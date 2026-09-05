// Disposable vault for the native watch integration harness. Never uses a user vault.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {makeServer}=require('../gateway/server');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'stonenotes-watch-')),vault=path.join(root,'vault');fs.mkdirSync(vault);
fs.mkdirSync(path.join(vault,'Projects'));fs.mkdirSync(path.join(vault,'Empty folder'));
fs.writeFileSync(path.join(vault,'Projects','Project plan.md'),'A note written in Obsidian.\n\n'+('This is a scrolling paragraph with enough text to cross into another chunk. '.repeat(30)));
for(let i=1;i<=36;i++)fs.writeFileSync(path.join(vault,'Note '+String(i).padStart(2,'0')+'.md'),'Fixture note '+i);
if(process.env.WATCH_TEST_RICH_ONLY){
 fs.mkdirSync(path.join(vault,'Assets'));fs.writeFileSync(path.join(vault,'Assets','Colors.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="50" fill="red"/><rect y="50" width="200" height="50" fill="blue"/></svg>');
 const scene={type:'excalidraw',version:2,elements:[{id:'box',type:'rectangle',x:0,y:0,width:200,height:100,strokeColor:'#000000',backgroundColor:'#00ff00',fillStyle:'solid',strokeWidth:2,roughness:1,opacity:100,seed:1,version:1,isDeleted:false,groupIds:[]},{id:'label',type:'text',x:20,y:30,width:120,height:35,text:'Notesy',originalText:'Notesy',fontSize:28,fontFamily:1,textAlign:'left',verticalAlign:'top',strokeColor:'#000000',opacity:100,seed:2,version:1,isDeleted:false,groupIds:[]}],appState:{viewBackgroundColor:'#ffffff'},files:{}};
 fs.writeFileSync(path.join(vault,'Assets','Drawing.excalidraw'),JSON.stringify(scene));
 fs.writeFileSync(path.join(vault,'Projects','Project plan.md'),'Text from Obsidian.\n\n- [ ] Buy coffee beans\n- [x] Already done\n\n![[Assets/Colors.svg]]\n![[Assets/Drawing.excalidraw]]\n'+Array.from({length:32},(_,i)=>'- [ ] More task '+i).join('\n'));
}
if(process.env.WATCH_TEST_SCROLL_ONLY){
 fs.mkdirSync(path.join(vault,'Assets'));
 for(const [name,width,height] of [['Wide',400,80],['Tall',80,400]])fs.writeFileSync(path.join(vault,'Assets',name+'.svg'),`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="red"/></svg>`);
 fs.writeFileSync(path.join(vault,'Projects','Project plan.md'),'START This long paragraph must be readable from beginning to end, even with the largest font. Scroll through every line before advancing to the checkbox. Nothing after the pictures should disappear. END\n\n- [ ] After paragraph\n![[Assets/Wide.svg]]\n![[Assets/Tall.svg]]\n- [ ] After pictures');
}
const {server,browser}=makeServer({vault,state:path.join(root,'state'),token:'fixture-token-'.repeat(4)});
const projects=browser.list().items.find(n=>n.title==='Projects');const projectNote=browser.list(projects.id).items[0];browser.pin(projectNote.id,true);
server.listen(0,'127.0.0.1',()=>process.stdout.write(JSON.stringify({port:server.address().port,vaultId:browser.vaultId,root:browser.root,projects:projects.id,note:projectNote.id})+'\n'));
function close(){server.close(()=>{fs.rmSync(root,{recursive:true,force:true});process.exit(0);});}process.on('SIGTERM',close);process.on('SIGINT',close);
