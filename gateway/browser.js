'use strict';
const fs=require('node:fs'), path=require('node:path');
// Opaque IDs keep paths out of the watch protocol. Only entries discovered inside
// this vault are resolvable; every use rechecks all ancestors without following links.
module.exports=(NoteStore,Fault,hash,atomicJSON,shortText)=>class BrowserStore {
  constructor(vault,state){
    this.vault=fs.realpathSync(vault);this.state=state;
    this.vaultId=hash(this.vault+'\0browser-v2');
    this.home=path.join(state,'browser',this.vaultId);fs.mkdirSync(this.home,{recursive:true,mode:0o700});
    this.file=path.join(this.home,'index.json');
    this.index=fs.existsSync(this.file)?JSON.parse(fs.readFileSync(this.file,'utf8')):{entries:{},pins:[]};
    this.snapshots=new Map();
    this.root=this.remember('',true);this.flush();
  }
  flush(){atomicJSON(this.file,this.index);}
  remember(relative,folder){const id=hash((folder?'folder:':'note:')+relative);this.index.entries[id]={relative,folder};return id;}
  checked(relative,folder){
    if(typeof relative!=='string'||path.isAbsolute(relative)||(relative!==''&&relative.split('/').some(p=>!p||p.startsWith('.')||p.includes('\0'))))throw new Fault(400,'Invalid vault location.');
    let current=this.vault;const parts=relative?relative.split('/'):[];
    for(let i=-1;i<parts.length;i++){
      if(i>=0)current=path.join(current,parts[i]);
      let stat;try{stat=fs.lstatSync(current);}catch(e){if(e.code==='ENOENT')throw new Fault(404,'This item moved or was removed. Refresh the folder.');throw e;}
      const directory=i<parts.length-1||folder;
      if(stat.isSymbolicLink()||fs.realpathSync(current)!==current||(directory?!stat.isDirectory():!stat.isFile()))throw new Fault(409,'This item is no longer a regular vault file or folder.');
    }
    if(!folder&&!/\.md$/i.test(relative))throw new Fault(400,'Only Markdown notes can be opened.');
    return current;
  }
  resolve(id,folder){
    const entry=this.index.entries[id||this.root];
    if(!entry||(folder!==undefined&&entry.folder!==folder))throw new Fault(404,'This item is unavailable. Refresh the folder.');
    this.checked(entry.relative,entry.folder);return entry;
  }
  item(id){
    const e=this.resolve(id),name=path.basename(e.relative)||'Vault';
    return {id,title:shortText(e.folder?name:name.replace(/\.md$/i,'').replace(/^(\d{4}-\d{2}-\d{2} - \d{1,2})\.(\d{2}[ap]m - )/,'$1:$2')),folder:e.folder,pinned:this.index.pins.includes(id)};
  }
  list(id,offset=0,snapshot=''){
    id=id||this.root;const directory=this.resolve(id,true);
    for(const [key,value] of this.snapshots)if(value.expires<Date.now())this.snapshots.delete(key);
    let view=snapshot&&this.snapshots.get(snapshot);
    if(snapshot&&(!view||view.id!==id))throw new Fault(409,'Folder listing expired. Refresh to continue.');
    if(!view){
      const children=fs.readdirSync(this.checked(directory.relative,true),{withFileTypes:true})
        .filter(e=>!e.name.startsWith('.')&&(e.isDirectory()||(e.isFile()&&/\.md$/i.test(e.name))))
        .map(e=>this.remember(directory.relative?directory.relative+'/'+e.name:e.name,e.isDirectory()));
      const pins=id===this.root?this.index.pins.filter(key=>{try{this.resolve(key);return true;}catch{return false;}}):[];
      const entries=children.filter(key=>!pins.includes(key)).map(key=>this.item(key)).sort((a,b)=>Number(b.folder)-Number(a.folder)||a.title.localeCompare(b.title,undefined,{numeric:true})||a.id.localeCompare(b.id));
      const items=pins.map(key=>this.item(key)).concat(entries);
      if(items.length>60000)throw new Fault(413,'This folder has more than 60,000 entries. Organize it into smaller folders.');
      snapshot=require('node:crypto').randomBytes(12).toString('hex');view={id,items,expires:Date.now()+30*60*1000};
      if(this.snapshots.size>=32)this.snapshots.delete(this.snapshots.keys().next().value);
      this.snapshots.set(snapshot,view);this.flush();
    }
    const parent=directory.relative?this.remember(path.posix.dirname(directory.relative)==='.'?'':path.posix.dirname(directory.relative),true):'';
    return {vaultId:this.vaultId,id,parent,title:directory.relative?shortText(path.basename(directory.relative)):'Vault',items:view.items.slice(offset,offset+15),offset,total:view.items.length,snapshot};
  }
  store(relative){this.checked(relative,true);return new NoteStore(this.vault,this.state,relative,{root:true,create:false});}
  note(id){const e=this.resolve(id,false),relative=path.posix.dirname(e.relative);return {entry:e,store:this.store(relative==='.'?'':relative),localId:hash(path.basename(e.relative))};}
  read(id,page){const n=this.note(id);return {...n.store.read(n.localId,page),id,parent:this.remember(path.posix.dirname(n.entry.relative)==='.'?'':path.posix.dirname(n.entry.relative),true),pinned:this.index.pins.includes(id)};}
  bind(body,operation,target){
    if(body.vaultId!==this.vaultId)throw new Fault(409,'This draft belongs to a different vault. Its text is kept on the phone.');
    if(typeof body.requestId!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(body.requestId))throw new Fault(400,'Invalid delivery ID.');
    const file=path.join(this.home,hash(body.requestId)+'.json'),digest=hash(operation+'\0'+target+'\0'+(body.text||''));
    if(fs.existsSync(file)){if(JSON.parse(fs.readFileSync(file,'utf8')).digest!==digest)throw new Fault(409,'This delivery ID belongs to another destination.');}
    else atomicJSON(file,{digest});
  }
  create(body){
    const parent=body.folderId||this.root;this.bind(body,'create',parent);
    const e=this.resolve(parent,true),store=this.store(e.relative),result=store.create({...body,vaultId:store.vaultId});
    // Receipts retain the filename even when an acknowledged note later moves.
    const receipt=JSON.parse(fs.readFileSync(path.join(store.receipts,hash(body.requestId)+'.json'),'utf8'));
    result.id=this.remember(e.relative?e.relative+'/'+receipt.filename:receipt.filename,false);this.flush();return result;
  }
  append(id,body){this.bind(body,'append',id);const e=this.index.entries[id];if(!e||e.folder)throw new Fault(400,'Append is available for notes only.');const parent=path.posix.dirname(e.relative),store=this.store(parent==='.'?'':parent);return {...store.append(hash(path.basename(e.relative)),{...body,vaultId:store.vaultId}),id};}
  remove(id,body){
    this.bind(body,'delete',id);
    // Resolve the stored path without requiring the already deleted note to exist.
    const e=this.index.entries[id];if(!e||e.folder)throw new Fault(400,'Delete is available for notes only.');
    const parent=path.posix.dirname(e.relative),store=this.store(parent==='.'?'':parent);
    const result=store.remove(hash(path.basename(e.relative)),{...body,vaultId:store.vaultId});
    this.index.pins=this.index.pins.filter(key=>key!==id);this.flush();return {...result,id};
  }
  pin(id,pinned){
    if(typeof pinned!=='boolean')throw new Fault(400,'Choose pin or unpin.');
    this.resolve(id);if(id===this.root)throw new Fault(400,'The vault is already on the main page.');
    if(pinned&&!this.index.pins.includes(id))this.index.pins.push(id);
    if(!pinned)this.index.pins=this.index.pins.filter(key=>key!==id);
    this.flush();return {id,pinned};
  }
};
