// Disposable vault for the native watch integration harness. Never uses a user vault.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {makeServer}=require('../gateway/server');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'stonenotes-watch-')),vault=path.join(root,'vault');fs.mkdirSync(vault);
fs.mkdirSync(path.join(vault,'Projects'));fs.mkdirSync(path.join(vault,'Empty folder'));
fs.writeFileSync(path.join(vault,'Projects','Project plan.md'),'A note written in Obsidian.\n\n'+('This is a scrolling paragraph with enough text to cross into another chunk. '.repeat(30)));
for(let i=1;i<=36;i++)fs.writeFileSync(path.join(vault,'Note '+String(i).padStart(2,'0')+'.md'),'Fixture note '+i);
const {server,browser}=makeServer({vault,state:path.join(root,'state'),token:'fixture-token-'.repeat(4)});
const projects=browser.list().items.find(n=>n.title==='Projects');const projectNote=browser.list(projects.id).items[0];browser.pin(projectNote.id,true);
server.listen(0,'127.0.0.1',()=>process.stdout.write(JSON.stringify({port:server.address().port,vaultId:browser.vaultId,root:browser.root,projects:projects.id,note:projectNote.id})+'\n'));
function close(){server.close(()=>{fs.rmSync(root,{recursive:true,force:true});process.exit(0);});}process.on('SIGTERM',close);process.on('SIGINT',close);
