const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {NoteStore,makeServer,pages,plainText}=require('../gateway/server');
function fixture(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'stonenotes-'));const vault=path.join(root,'vault');fs.mkdirSync(vault);t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return {root,vault,state:path.join(root,'state')};}
test('notes created externally are listed, read and refreshed; no modification',t=>{
 const f=fixture(t),s=new NoteStore(f.vault,f.state),file=path.join(s.folder,'Shopping.md');
 fs.writeFileSync(file,'# Shopping\n\n- Bread\n- [[Coffee|Decaf]]');
 const [n]=s.list().notes;assert.equal(n.title,'Shopping');assert.match(s.read(n.id).text,/Decaf/);
 fs.writeFileSync(file,'Updated in Obsidian');assert.equal(s.read(n.id).text,'Updated in Obsidian');
 assert.equal(fs.readFileSync(file,'utf8'),'Updated in Obsidian');
});
test('delivery survives restart, later edit and removal without creating a duplicate',t=>{
 const f=fixture(t);let s=new NoteStore(f.vault,f.state);const data={requestId:'delivery_12345678',text:'Buy fresh coffee.',vaultId:s.vaultId};
 const result=s.create(data);assert.equal(result.saved,true);assert.equal(s.list().total,1);
 s=new NoteStore(f.vault,f.state);assert.equal(s.create(data).duplicate,true);
 const file=path.join(s.folder,fs.readdirSync(s.folder)[0]);fs.writeFileSync(file,'Edited externally');
 assert.equal(s.create(data).duplicate,true);assert.equal(fs.readFileSync(file,'utf8'),'Edited externally');
 fs.unlinkSync(file);assert.equal(s.create(data).duplicate,true);assert.equal(s.list().total,0);
 assert.throws(()=>s.create({...data,text:'Different thought'}),/another note/);
});
test('crash between file publication and receipt commit recovers without duplicate',t=>{
 const f=fixture(t),s=new NoteStore(f.vault,f.state);const data={requestId:'interrupted_1234',text:'An interrupted delivery',vaultId:s.vaultId};s.create(data);
 const file=path.join(s.receipts,fs.readdirSync(s.receipts)[0]);const receipt=JSON.parse(fs.readFileSync(file));receipt.saved=false;fs.writeFileSync(file,JSON.stringify(receipt));
 assert.equal(new NoteStore(f.vault,f.state).create(data).saved,true);assert.equal(s.list().total,1);
});
test('scope blocks symlinks, traversal, non-Markdown and changed vault delivery',t=>{
 const f=fixture(t),s=new NoteStore(f.vault,f.state);fs.writeFileSync(path.join(f.root,'secret.md'),'outside');fs.symlinkSync(path.join(f.root,'secret.md'),path.join(s.folder,'linked.md'));
 fs.writeFileSync(path.join(s.folder,'image.png'),'x');assert.equal(s.list().total,0);assert.throws(()=>s.read('../secret.md'),/moved/);
 assert.throws(()=>s.create({requestId:'safe_12345678',text:'note',vaultId:'other'}),/vault changed/);
 fs.renameSync(s.folder,path.join(f.root,'moved'));fs.symlinkSync(path.join(f.root,'moved'),s.folder);assert.throws(()=>s.list(),/regular folder/);
});
test('Unicode pages preserve every character within transport bounds',()=>{
 const original='Résumé 🌱 日本語 '.repeat(300);const chunks=pages(original);assert.equal(chunks.join(''),original);for(const p of chunks)assert.ok(Buffer.byteLength(p)<=760);
 assert.equal(plainText('---\nsource: test\n---\n# Hello **world**'), 'Hello world');
});
test('pagination reaches all external notes and a removed note reports an error',t=>{
 const f=fixture(t),s=new NoteStore(f.vault,f.state);for(let i=0;i<37;i++)fs.writeFileSync(path.join(s.folder,'Note '+i+'.md'),'x');
 const first=s.list(),second=s.list(first.next),third=s.list(second.next);assert.equal(first.notes.length+second.notes.length+third.notes.length,37);assert.equal(third.next,null);
 const entry=s.entries()[0];fs.unlinkSync(path.join(s.folder,entry.name));assert.throws(()=>s.read(entry.id),/moved/);
});
test('HTTP authorization and one-time pairing; landing page does not disclose credentials',async t=>{
 const f=fixture(t),token='test-token-'.repeat(5),{server}=makeServer({...f,token});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const base='http://127.0.0.1:'+server.address().port;const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
 assert.equal((await fetch(base+'/v1/notes')).status,401);
 assert.equal((await fetch(base+'/v1/notes',{headers:{Authorization:'Bearer bad'}})).status,401);
 const health=await (await fetch(base+'/v1/health',{headers})).json();assert.equal(health.lastPhoneContact,null);
 const response=await fetch(base+'/v1/pairing',{method:'POST',headers,body:JSON.stringify({origin:'https://sample.test.ts.net:10448'})});const pair=await response.json();assert.equal(response.status,200);
 const landing=await (await fetch(base+'/pair')).text();assert.ok(!landing.includes(token));
 const code=new URL(pair.url).hash.slice(1);let redeem=await fetch(base+'/pair',{method:'POST',body:JSON.stringify({code})});assert.equal((await redeem.json()).gatewayToken,token);
 assert.equal((await fetch(base+'/pair',{method:'POST',body:JSON.stringify({code})})).status,410);
 assert.equal((await fetch(base+'/v1/pairing',{method:'POST',headers,body:JSON.stringify({origin:'https://public.example.com'})})).status,400);
 await fetch(base+'/v1/notes',{headers:{...headers,'X-StoneNotes-Client':'phone'}});
 assert.ok((await (await fetch(base+'/v1/health',{headers})).json()).lastPhoneContact);
 const note=await fetch(base+'/v1/notes',{method:'POST',headers,body:JSON.stringify({requestId:'http_test_1234',text:'From HTTP',vaultId:health.vaultId})});assert.equal(note.status,200);
 assert.equal((await fetch(base+'/v1/notes?offset=-1',{headers})).status,400);
});

test('filenames lead with local date and safely number repeated titles',t=>{
 const f=fixture(t),s=new NoteStore(f.vault,f.state),now=new Date();
 const date=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
 const clock=(now.getHours()%12||12)+'.'+String(now.getMinutes()).padStart(2,'0')+(now.getHours()<12?'am':'pm');
 const name=date+' - '+clock+' - This is the dictated note';
 const original=path.join(s.folder,name+'.md');fs.writeFileSync(original,'Written in Obsidian');
 const data={requestId:'filename_test_123',text:'This is the dictated note. More detail.',vaultId:s.vaultId};
 s.create(data);assert.ok(fs.existsSync(path.join(s.folder,name+' (2).md')));
 s.create({...data,requestId:'filename_test_456'});assert.ok(fs.existsSync(path.join(s.folder,name+' (3).md')));
 assert.equal(s.create(data).duplicate,true);assert.equal(s.list().total,3);
 assert.equal(fs.readFileSync(original,'utf8'),'Written in Obsidian');
});
