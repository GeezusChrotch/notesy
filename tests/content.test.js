const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {makeServer,plainText,pages}=require('../gateway/server'),{parse,hash}=require('../gateway/content');
function fixture(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'notesy-content-')),vault=path.join(root,'vault');fs.mkdirSync(vault);t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const options={vault,state:path.join(root,'state'),token:'fixture-rich-'.repeat(4)};const b=makeServer(options).browser;return {root,vault,b,options,add(name,text='External'){const file=path.join(vault,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text);return b.remember(name,false);}};}
test('hidden folder choices persist and exclude descendants from browser, pins and search; queued creation retains its folder',async t=>{
 const f=fixture(t);f.add('Work/Secret.md','secret');f.add('Work/Sub/Deep.md');f.add('Public.md','public');
 const folder=f.b.list().items[0],note=f.b.list(folder.id).items.find(n=>n.title==='Secret');f.b.pin(note.id,true);const stale=f.b.list().snapshot;
 f.b.setHidden({vaultId:f.b.vaultId,hidden:['Work']});assert.deepEqual(f.b.list().items.map(n=>n.title),['Public']);assert.equal((await f.b.search('secret')).total,0);assert.throws(()=>f.b.list('',15,stale),/expired/);assert.throws(()=>f.b.read(note.id),/hidden/);
 assert.equal(makeServer(f.options).browser.folders().folders[0].hidden,true);assert.equal(f.b.folders('Work').folders[0].hidden,true);
 const saved=f.b.create({vaultId:f.b.vaultId,folderId:folder.id,requestId:'queued_hidden_123',text:'Original destination'});assert.ok(saved.saved);
 f.b.setHidden({vaultId:f.b.vaultId,hidden:[]});assert.ok(f.b.list().items.some(n=>n.id===note.id));assert.throws(()=>f.b.setHidden({vaultId:f.b.vaultId,hidden:['../outside']}),/Invalid/);
});
test('task parser ignores frontmatter and code, preserves UTF-8 byte offsets and recognizes images in order',()=>{
 const text='\ufeff---\r\n- [ ] Metadata\r\n---\r\nCafé text\r\n\r\n- [ ] Buy café beans\r\n* [X] Done\r\n```md\r\n- [ ] Example\r\n```\r\n![Photo](<Assets/My photo.png>) and ![[Sketch.excalidraw.md|200]]\r\n';
 const v=parse(text,plainText,pages),tasks=v.blocks.filter(b=>b.kind==='task');assert.equal(tasks.length,2);assert.equal(Buffer.from(text)[Number(tasks[0].id)],32);assert.equal(tasks[1].checked,true);assert.deepEqual(v.blocks.filter(b=>b.kind==='image').map(b=>b.ref),['Assets/My photo.png','Sketch.excalidraw.md']);
});
test('checkbox changes preserve all other bytes and reject concurrent edits, with idempotent interrupted retry',t=>{
 const f=fixture(t),original='\ufeff---\r\naliases: [Test]\r\n---\r\nCafé\r\n- [ ] First task\r\n- [x] Second task\r\n';const id=f.add('Tasks.md',original),view=f.b.content(id),task=view.blocks.find(b=>b.kind==='task');
 const body={vaultId:f.b.vaultId,requestId:'task_mutation_123',taskId:task.id,checked:true,revision:view.revision};const result=f.b.task(id,body),expected=Buffer.from(original);expected[Number(task.id)]=120;
 assert.deepEqual(fs.readFileSync(path.join(f.vault,'Tasks.md')),expected);assert.equal(f.b.task(id,body).duplicate,true);
 const receipt=path.join(f.b.home,hash(body.requestId)+'.json'),saved=JSON.parse(fs.readFileSync(receipt));saved.saved=false;fs.writeFileSync(receipt,JSON.stringify(saved));assert.ok(f.b.task(id,body).saved);
 fs.appendFileSync(path.join(f.vault,'Tasks.md'),'An Obsidian edit');assert.throws(()=>f.b.task(id,{...body,requestId:'task_conflict_123',checked:false,revision:result.revision}),/changed/);assert.match(fs.readFileSync(path.join(f.vault,'Tasks.md'),'utf8'),/An Obsidian edit$/);
 const fresh=f.b.content(id);f.b.task(id,{...body,requestId:'task_uncheck_123',checked:false,revision:fresh.revision});assert.equal(fs.readFileSync(path.join(f.vault,'Tasks.md'))[Number(task.id)],32);
});
test('rich content pages all tasks while plain notes retain their scrolling reader',t=>{
 const f=fixture(t),id=f.add('Tasks.md',Array.from({length:34},(_,i)=>'- [ ] Task '+i).join('\n'));assert.equal(f.b.content(id).total,34);assert.equal(f.b.content(id,2).blocks.length,4);assert.equal(f.b.content(f.add('Plain.md','Simple note')).rich,false);
});
test('local image conversion, hidden attachments and both Excalidraw formats produce bounded watch pixels',async t=>{
 const f=fixture(t),media=require('../gateway/media');const svg='<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="50" fill="red"/><rect y="50" width="200" height="50" fill="blue"/></svg>';
 f.add('Assets/picture.svg',svg);const id=f.add('Images.md','![[Assets/picture.svg]]');f.b.setHidden({vaultId:f.b.vaultId,hidden:['Assets']});
 const view=f.b.content(id),image=await media.render(f.b,id,0,view.revision,120,100);assert.ok(image.width<=120&&image.height<=100);assert.equal(image.encoding,'rle-gcolor8');const runs=Buffer.from(image.data,'base64');assert.ok(runs.length);let count=0;for(let i=0;i<runs.length;i+=2)count+=runs[i];assert.equal(count,image.width*image.height);
 const scene={type:'excalidraw',version:2,elements:[{id:'box',type:'rectangle',x:0,y:0,width:200,height:100,strokeColor:'#000000',backgroundColor:'#ff0000',fillStyle:'solid',strokeWidth:2,roughness:1,opacity:100,seed:1,version:1,isDeleted:false,groupIds:[]},{id:'label',type:'text',x:20,y:30,width:120,height:35,text:'Notesy',originalText:'Notesy',fontSize:28,fontFamily:1,textAlign:'left',verticalAlign:'top',strokeColor:'#000000',opacity:100,seed:2,version:1,isDeleted:false,groupIds:[]}],appState:{viewBackgroundColor:'#ffffff'},files:{}};
 const draw=f.add('Sketch.excalidraw',JSON.stringify(scene));const drawing=await media.render(f.b,draw,0,f.b.content(draw).revision,176,150);assert.ok(drawing.width>0);
 const lz=require('../renderer/dist/lz-string');const md=f.add('Compressed.excalidraw.md','---\nexcalidraw-plugin: parsed\n---\n# Drawing\n```compressed-json\n'+lz.compressToBase64(JSON.stringify(scene))+'\n```');const compressed=await media.render(f.b,md,0,f.b.content(md).revision,176,150);assert.deepEqual(compressed,drawing);
 assert.throws(()=>media.resolve(f.b,'Images.md','https://example.com/image.png'),/Only images/);fs.symlinkSync('/tmp',path.join(f.vault,'Outside'));assert.throws(()=>media.resolve(f.b,'Images.md','Outside/private.png'));
 await assert.rejects(media.render(f.b,id,0,'a'.repeat(64),120,100),/changed/);
});
test('rich content, hidden folders, task editing and media endpoints require pairing and vault identity',async t=>{
 const f=fixture(t),id=f.add('Tasks.md','- [ ] A task');f.b.flush();const {server}=makeServer(f.options);await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));const base='http://127.0.0.1:'+server.address().port,headers={Authorization:'Bearer '+f.options.token,'Content-Type':'application/json'};
 for(const route of ['/v3/folders','/v3/notes/'+id,'/v3/notes/'+id+'/image'])assert.equal((await fetch(base+route)).status,401);
 const view=await(await fetch(base+'/v3/notes/'+id,{headers})).json();assert.equal(view.blocks[0].kind,'task');
 const body={vaultId:f.b.vaultId,taskId:view.blocks[0].id,checked:true,revision:view.revision,requestId:'http_checkbox_123'};
 assert.equal((await fetch(base+'/v3/notes/'+id+'/task',{headers,method:'POST',body:JSON.stringify({...body,vaultId:'other'})})).status,400);
 const changed=await(await fetch(base+'/v3/notes/'+id+'/task',{headers,method:'POST',body:JSON.stringify(body)})).json();assert.equal(changed.saved,true);
 assert.equal((await fetch(base+'/v3/hidden',{headers,method:'POST',body:JSON.stringify({vaultId:'other',hidden:[]})})).status,409);
});
