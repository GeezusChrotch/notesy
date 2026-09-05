const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {makeServer}=require('../gateway/server');
function fixture(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'stone-browser-')),vault=path.join(root,'vault'),state=path.join(root,'state');fs.mkdirSync(vault);t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const options={vault,state,token:'t'.repeat(40)};const instance=makeServer(options);return {root,vault,state,options,server:instance.server,browser:instance.browser};}
function add(f,relative,text='External note'){const p=path.join(f.vault,relative);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,text);}
test('vault root, nested folders and same-named notes have distinct IDs without creating a dedicated folder',t=>{
 const f=fixture(t);assert.deepEqual(fs.readdirSync(f.vault),[]);
 add(f,'Root.md');add(f,'Work/Same.md','work');add(f,'Home/Same.md','home');add(f,'.obsidian/secret.md');add(f,'image.png');
 fs.symlinkSync(f.root,path.join(f.vault,'Outside'));
 const root=f.browser.list();assert.deepEqual(root.items.map(n=>n.title),['Home','Work','Root']);
 const home=f.browser.list(root.items[0].id),work=f.browser.list(root.items[1].id);
 assert.notEqual(home.items[0].id,work.items[0].id);assert.equal(f.browser.read(home.items[0].id,0).text,'home');assert.equal(f.browser.read(work.items[0].id,0).text,'work');
 assert.equal(home.parent,f.browser.root);assert.equal(f.browser.read(home.items[0].id,0).parent,root.items[0].id);
});
test('stable snapshot pagination reaches every entry in both directions despite intervening edits',t=>{
 const f=fixture(t);for(let i=0;i<47;i++)add(f,'Note '+i+'.md');
 const a=f.browser.list(),snapshot=a.snapshot;add(f,'A newer note.md');
 const b=f.browser.list('',15,snapshot),c=f.browser.list('',30,snapshot),d=f.browser.list('',45,snapshot);
 assert.equal(new Set([...a.items,...b.items,...c.items,...d.items].map(n=>n.id)).size,47);
 assert.deepEqual(f.browser.list('',15,snapshot).items,b.items);assert.equal(f.browser.list().total,48);
 f.browser.snapshots.get(snapshot).expires=0;assert.throws(()=>f.browser.list('',15,snapshot),/expired/);
});
test('pins survive restart, deduplicate root entries, support nested notes and disappear when missing',t=>{
 const f=fixture(t);add(f,'Folder/Note.md');add(f,'Root.md');
 const root=f.browser.list(),folder=root.items[0],note=f.browser.list(folder.id).items[0];
 f.browser.pin(note.id,true);f.browser.pin(folder.id,true);f.browser.pin(note.id,true);
 let b=makeServer(f.options).browser;assert.deepEqual(b.list().items.slice(0,2).map(n=>n.id),[note.id,folder.id]);assert.equal(b.list().total,3);
 b.pin(folder.id,false);assert.equal(b.list().items[1].pinned,false);
 fs.renameSync(path.join(f.vault,'Folder/Note.md'),path.join(f.vault,'Folder/Renamed.md'));
 assert.equal(b.list().items.some(n=>n.id===note.id),false);assert.throws(()=>b.read(note.id,0),/moved/);
});
test('create and append preserve exact destinations across restart and conflicting retries',t=>{
 const f=fixture(t);add(f,'Nested/Existing.md','Original');const folder=f.browser.list().items[0],note=f.browser.list(folder.id).items[0];
 const data={requestId:'browser_create_123',text:'In nested folder',vaultId:f.browser.vaultId,folderId:folder.id};
 const created=f.browser.create(data);assert.match(f.browser.read(created.id,0).text,/In nested folder/);assert.equal(fs.readdirSync(f.vault).length,1);
 assert.throws(()=>f.browser.create({...data,folderId:f.browser.root}),/another destination/);
 let b=makeServer(f.options).browser;assert.equal(b.create(data).duplicate,true);
 const append={requestId:'browser_append_123',text:'More',vaultId:b.vaultId};b.append(note.id,append);
 assert.equal(b.append(note.id,append).duplicate,true);assert.equal(b.read(note.id,0).text,'Original\n\nMore');
 assert.throws(()=>b.append(created.id,append),/another destination/);
 const root=b.create({requestId:'browser_root_123',text:'At the root',vaultId:b.vaultId,folderId:b.root});assert.equal(b.read(root.id,0).parent,b.root);
 assert.throws(()=>b.create({...data,requestId:'bad_vault_123',vaultId:'other'}),/different vault/);
});
test('ancestor symlink replacements block reads, writes, deletes and pinning',t=>{
 const f=fixture(t);add(f,'Folder/Note.md');const folder=f.browser.list().items[0],note=f.browser.list(folder.id).items[0];
 fs.renameSync(path.join(f.vault,'Folder'),path.join(f.root,'Elsewhere'));fs.symlinkSync(path.join(f.root,'Elsewhere'),path.join(f.vault,'Folder'));
 for(const fn of [()=>f.browser.list(folder.id),()=>f.browser.read(note.id,0),()=>f.browser.pin(note.id,true),()=>f.browser.append(note.id,{requestId:'unsafe_append_123',vaultId:f.browser.vaultId,text:'x'}),()=>f.browser.remove(note.id,{requestId:'unsafe_delete_123',vaultId:f.browser.vaultId}),()=>f.browser.create({requestId:'unsafe_create_123',vaultId:f.browser.vaultId,folderId:folder.id,text:'x'})])assert.throws(fn,/regular/);
 assert.equal(fs.readFileSync(path.join(f.root,'Elsewhere/Note.md'),'utf8'),'External note');
});
test('immediate deletion is recoverable, unpins and never deletes a replacement on retry',t=>{
 const f=fixture(t);add(f,'Root.md','Keep in trash');const note=f.browser.list().items[0];f.browser.pin(note.id,true);
 const body={requestId:'browser_delete_123',vaultId:f.browser.vaultId};assert.equal(f.browser.remove(note.id,body).deleted,true);
 assert.equal(f.browser.list().total,0);const trash=path.join(f.vault,'.trash');assert.equal(fs.readFileSync(path.join(trash,fs.readdirSync(trash)[0]),'utf8'),'Keep in trash');
 add(f,'Root.md','Replacement');assert.equal(makeServer(f.options).browser.remove(note.id,body).duplicate,true);assert.equal(fs.readFileSync(path.join(f.vault,'Root.md'),'utf8'),'Replacement');
 const folder=f.browser.remember('SomeFolder',true);assert.throws(()=>f.browser.remove(folder,{...body,requestId:'folder_delete_123'}),/notes only/);
});
test('authenticated v2 HTTP coexists with old phone deliveries and does not require re-pairing',async t=>{
 const f=fixture(t);add(f,'Root.md');await new Promise(r=>f.server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>f.server.close(r)));
 const base='http://127.0.0.1:'+f.server.address().port,headers={Authorization:'Bearer '+f.options.token,'Content-Type':'application/json'};
 assert.equal((await fetch(base+'/v2/browse')).status,401);assert.equal((await fetch(base+'/v2/search?q=root')).status,401);
 const search=await(await fetch(base+'/v2/search?q=root',{headers})).json();assert.equal(search.items[0].title,'Root');assert.equal(search.items[0].location,'Vault');
 assert.equal((await fetch(base+'/v2/search?q=',{headers})).status,400);
 const health=await(await fetch(base+'/v1/health',{headers})).json();assert.equal(health.browserId,f.browser.vaultId);
 const root=await(await fetch(base+'/v2/browse',{headers})).json();assert.equal(root.items[0].title,'Root');assert.equal(fs.existsSync(path.join(f.vault,'Pebble')),false);
 async function post(route,body){const r=await fetch(base+route,{headers,method:'POST',body:JSON.stringify(body)});assert.equal(r.status,200,await r.clone().text());return r.json();}
 await post('/v1/notes',{requestId:'old_pending_123',text:'Old destination',vaultId:health.vaultId});assert.equal(fs.readdirSync(path.join(f.vault,'Pebble')).length,1);
 const note=await post('/v2/notes',{requestId:'new_root_123',text:'New destination',vaultId:health.browserId,folderId:health.root});
 await post('/v2/items/'+note.id+'/pin',{pinned:true,vaultId:health.browserId});await post('/v2/items/'+note.id+'/append',{requestId:'http_append_v2',text:'Append',vaultId:health.browserId});
 assert.match((await(await fetch(base+'/v2/notes/'+note.id,{headers})).json()).text,/Append/);
 await post('/v2/items/'+note.id+'/delete',{requestId:'http_delete_v2',vaultId:health.browserId});
});
test('dictated fuzzy search ranks titles, finds unvisited folders and body text, and stays read-only',async t=>{
 const f=fixture(t);add(f,'Project plan.md','Original');add(f,'Deep/Work/Project plan.md');add(f,'Other.md','Discuss the project plan tomorrow');add(f,'Café.md');add(f,'.obsidian/Project plan secret.md');fs.symlinkSync(path.join(f.vault,'Project plan.md'),path.join(f.vault,'Project plan link.md'));
 const results=await f.browser.search('project plna');assert.equal(results.items[0].title,'Project plan');assert.equal(results.items.length,2);assert.ok(results.items.some(n=>n.location==='Deep/Work'));
 assert.equal(f.browser.read(results.items.find(n=>n.location==='Deep/Work').id,0).text,'External note');assert.equal((await f.browser.search('cafe')).items[0].title,'Café');
 const literal=await f.browser.search('project plan');assert.equal(literal.items.at(-1).title,'Other');assert.equal(fs.readFileSync(path.join(f.vault,'Project plan.md'),'utf8'),'Original');
 assert.equal((await f.browser.search('xyzzy unmatched')).total,0);for(const q of ['',null,'!','x'.repeat(256)])await assert.rejects(f.browser.search(q),/search|Search/);
});
test('search snapshots keep ranked pages stable and reject another query or expiration',async t=>{
 const f=fixture(t);for(let i=0;i<37;i++)add(f,'Folder/Meeting '+i+'.md');const a=await f.browser.search('meeting');add(f,'Meeting new.md');
 const b=await f.browser.search('meeting',15,a.snapshot),c=await f.browser.search('meeting',30,a.snapshot);assert.equal(new Set([...a.items,...b.items,...c.items].map(n=>n.id)).size,37);assert.equal((await f.browser.search('meeting')).total,38);
 await assert.rejects(f.browser.search('other',15,a.snapshot),/expired/);f.browser.snapshots.get(a.snapshot).expires=0;await assert.rejects(f.browser.search('meeting',15,a.snapshot),/expired/);
});

test('search reports a result cap and title matches rank above approximate and body matches',async t=>{
 const f=fixture(t);add(f,'Garden.md');add(f,'Gardens.md');add(f,'Other.md','Garden');for(let i=0;i<105;i++)add(f,'Garden details '+i+'.md');
 const results=await f.browser.search('garden');assert.equal(results.total,100);assert.equal(results.limited,true);assert.equal(results.partial,false);assert.equal(results.items[0].title,'Garden');assert.match(results.title,/Top 100/);
});
