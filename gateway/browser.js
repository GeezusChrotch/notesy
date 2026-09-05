'use strict';
const fs=require('node:fs'), path=require('node:path');
// Opaque IDs keep paths out of the watch protocol. Only entries discovered inside
// this vault are resolvable; every use rechecks all ancestors without following links.
module.exports=(NoteStore,Fault,hash,atomicJSON,shortText,plainText,pages)=>class BrowserStore {
  constructor(vault,state){
    this.vault=fs.realpathSync(vault);this.state=state;
    this.vaultId=hash(this.vault+'\0browser-v2');
    this.home=path.join(state,'browser',this.vaultId);fs.mkdirSync(this.home,{recursive:true,mode:0o700});
    this.file=path.join(this.home,'index.json');
    this.index=fs.existsSync(this.file)?JSON.parse(fs.readFileSync(this.file,'utf8')):{entries:{},pins:[]};
    this.snapshots=new Map();this.index.hidden=this.index.hidden||[];
    this.root=this.remember('',true);this.flush();
  }
  hidden(relative){return this.index.hidden.some(p=>relative===p||relative.startsWith(p+'/'));}
  folders(parent=''){
    // A lazy tree avoids loading a whole large vault into phone settings at once.
    this.checked(parent,true);
    const folders=fs.readdirSync(path.join(this.vault,parent),{withFileTypes:true}).filter(e=>e.isDirectory()&&!e.name.startsWith('.')).map(e=>{
      const relative=parent?parent+'/'+e.name:e.name;this.checked(relative,true);
      return {path:relative,name:e.name,hidden:this.hidden(relative),explicit:this.index.hidden.includes(relative)};
    }).sort((a,b)=>a.name.localeCompare(b.name));
    return {vaultId:this.vaultId,folders,hidden:this.index.hidden};
  }
  setHidden(body){
    if(body.vaultId!==this.vaultId)throw new Fault(409,'The vault changed. Load folders again.');
    if(!Array.isArray(body.hidden)||body.hidden.length>500||body.hidden.some(p=>typeof p!=='string'||!p||p.length>1024))throw new Fault(400,'Choose up to 500 folders to hide.');
    for(const p of body.hidden)this.checked(p,true);
    this.index.hidden=[...new Set(body.hidden)].sort();this.snapshots.clear();this.flush();return {saved:true,hidden:this.index.hidden};
  }
  flush(){atomicJSON(this.file,this.index);}
  remember(relative,folder){const id=hash((folder?'folder:':'note:')+relative);this.index.entries[id]={relative,folder};return id;}
  checked(relative,folder,media=false){
    if(typeof relative!=='string'||path.isAbsolute(relative)||(relative!==''&&relative.split('/').some(p=>!p||p.startsWith('.')||p.includes('\0'))))throw new Fault(400,'Invalid vault location.');
    let current=this.vault;const parts=relative?relative.split('/'):[];
    for(let i=-1;i<parts.length;i++){
      if(i>=0)current=path.join(current,parts[i]);
      let stat;try{stat=fs.lstatSync(current);}catch(e){if(e.code==='ENOENT')throw new Fault(404,'This item moved or was removed. Refresh the folder.');throw e;}
      const directory=i<parts.length-1||folder;
      if(stat.isSymbolicLink()||fs.realpathSync(current)!==current||(directory?!stat.isDirectory():!stat.isFile()))throw new Fault(409,'This item is no longer a regular vault file or folder.');
    }
    if(!folder&&!media&&!/\.(?:md|excalidraw)$/i.test(relative))throw new Fault(400,'Only Markdown notes can be opened.');
    return current;
  }
  resolve(id,folder){
    const entry=this.index.entries[id||this.root];
    if(!entry||(folder!==undefined&&entry.folder!==folder))throw new Fault(404,'This item is unavailable. Refresh the folder.');
    if(this.hidden(entry.relative))throw new Fault(404,'This folder is hidden in Notesy settings.');
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
        .filter(e=>!e.name.startsWith('.')&&(e.isDirectory()||(e.isFile()&&/\.(?:md|excalidraw)$/i.test(e.name))))
        .filter(e=>!this.hidden(directory.relative?directory.relative+'/'+e.name:e.name))
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
  async search(term,offset=0,snapshot=''){
    const {normalize,score}=require('./search');
    if(typeof term!=='string'||Buffer.byteLength(term)>255||!normalize(term)||normalize(term).split(' ').length>12)throw new Fault(400,'Speak a short search term (up to 12 words).');
    const query=normalize(term),id='search:'+query;
    for(const [key,value] of this.snapshots)if(value.expires<Date.now())this.snapshots.delete(key);
    let view=snapshot&&this.snapshots.get(snapshot);
    if(snapshot&&(!view||view.id!==id))throw new Fault(409,'Search results expired. Search again to refresh them.');
    if(!view){
      const matches=[],directories=[''];let visited=0,partial=false;const deadline=Date.now()+7500;
      while(directories.length){
        const folder=directories.shift();let entries;
        try{entries=await fs.promises.readdir(this.checked(folder,true),{withFileTypes:true});}catch(e){if(!folder)throw e;partial=true;continue;}
        entries.sort((a,b)=>a.name.localeCompare(b.name));
        for(const entry of entries){
          if(++visited>60000||Date.now()>deadline){partial=true;break;}
          if(entry.name.startsWith('.'))continue;
          const relative=folder?folder+'/'+entry.name:entry.name;if(this.hidden(relative))continue;
          if(entry.isDirectory()){directories.push(relative);continue;}
          if(!entry.isFile()||!/\.(?:md|excalidraw)$/i.test(entry.name))continue;
          const title=entry.name.replace(/\.md$/i,'');let rank=score(query,title,folder);
          try{
            const file=this.checked(relative,false);
            if(!rank){
              const fd=await fs.promises.open(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
              try{const stat=await fd.stat();if(!stat.isFile()||stat.size>1024*1024)continue;
                const text=await fd.readFile('utf8');this.checked(relative,false);rank=score(query,title,folder,plainText(text));
              }finally{await fd.close();}
            }
            if(rank)matches.push({relative,rank});
          }catch(e){if(e.code!=='ENOENT'&&e.status!==404)partial=true;}
        }
        if(visited>60000||Date.now()>deadline){partial=true;break;}
      }
      matches.sort((a,b)=>b.rank-a.rank||a.relative.localeCompare(b.relative,undefined,{numeric:true}));
      const items=matches.slice(0,100).flatMap(match=>{
        try{
        const key=this.remember(match.relative,false),folder=path.posix.dirname(match.relative);
        this.remember(folder==='.'?'':folder,true);
        return [{...this.item(key),location:shortText(folder==='.'?'Vault':folder,90)}];
        }catch{partial=true;return [];}
      });
      snapshot=require('node:crypto').randomBytes(12).toString('hex');
      view={id,items,partial,limited:matches.length>100,expires:Date.now()+30*60*1000};
      if(this.snapshots.size>=32)this.snapshots.delete(this.snapshots.keys().next().value);
      this.snapshots.set(snapshot,view);this.flush();
    }
    return {vaultId:this.vaultId,id:this.root,parent:'',title:shortText((view.partial?'Partial matches: ':view.limited?'Top 100: ':'Search: ')+term),items:view.items.slice(offset,offset+15),offset,total:view.items.length,snapshot,partial:view.partial,limited:view.limited};
  }
  store(relative){this.checked(relative,true);return new NoteStore(this.vault,this.state,relative,{root:true,create:false});}
  note(id){const e=this.resolve(id,false),relative=path.posix.dirname(e.relative);return {entry:e,store:this.store(relative==='.'?'':relative),localId:hash(path.basename(e.relative))};}
  read(id,page){const n=this.note(id);return {...n.store.read(n.localId,page),id,parent:this.remember(path.posix.dirname(n.entry.relative)==='.'?'':path.posix.dirname(n.entry.relative),true),pinned:this.index.pins.includes(id)};}
  raw(id){
    const entry=this.resolve(id,false),file=this.checked(entry.relative,false),fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
    try{const stat=fs.fstatSync(fd);if(!stat.isFile()||stat.size>1024*1024)throw new Fault(413,'This note exceeds the 1 MB watch limit.');const data=fs.readFileSync(fd);if(data.length>1024*1024)throw new Fault(413,'This note exceeds the watch limit.');return {entry,file,data};}finally{fs.closeSync(fd);}
  }
  content(id,page=0){
    const {entry,data}=this.raw(id),drawing=/\.excalidraw(?:\.md)?$/i.test(entry.relative),parsed=drawing?{revision:hash(data),rich:true,blocks:[]}:require('./content').parse(data.toString('utf8'),plainText,pages);
    if(drawing){parsed.rich=true;parsed.blocks=[{kind:'image',ref:path.posix.basename(entry.relative),text:'Drawing'}];}
    if(!parsed.rich)return {...this.read(id,page),rich:false};
    const parent=path.posix.dirname(entry.relative),blocks=parsed.blocks.map((b,i)=>({...b,id:b.kind==='task'?b.id:String(i),text:shortText(b.text,220)}));
    if(page*15>=blocks.length&&page)throw new Fault(409,'The note changed. Reopen it.');
    return {id,title:this.item(id).title,parent:this.remember(parent==='.'?'':parent,true),pinned:this.index.pins.includes(id),rich:true,revision:parsed.revision,offset:page*15,total:blocks.length,blocks:blocks.slice(page*15,page*15+15)};
  }
  task(id,body){
    if(body.vaultId!==this.vaultId||typeof body.checked!=='boolean'||!/^\d{1,8}$/.test(body.taskId||'')||!/^[a-f0-9]{64}$/.test(body.revision||''))throw new Fault(400,'Reload this note before changing a task.');
    this.bind(body,'task',id+'|'+body.taskId+'|'+body.revision+'|'+body.checked);
    const receiptFile=path.join(this.home,hash(body.requestId)+'.json'),receipt=JSON.parse(fs.readFileSync(receiptFile,'utf8'));
    if(receipt.saved)return {saved:true,duplicate:true,taskId:body.taskId,checked:body.checked,revision:receipt.revision};
    const {entry,file,data}=this.raw(id),parsed=require('./content').parse(data.toString('utf8'),plainText,pages),task=parsed.blocks.find(b=>b.kind==='task'&&b.id===body.taskId);
    if(!task)throw new Fault(409,'The tasks changed in Obsidian. Reopen this note.');
    const expected=Buffer.from(data);expected[Number(body.taskId)]=body.checked?120:32;
    if(parsed.revision!==body.revision){
      // An interrupted write may already have reached disk; only accept its exact recorded result.
      if(receipt.after!==parsed.revision)throw new Fault(409,'The note changed in Obsidian. Reopen it before checking a task.');
    }else{
      receipt.after=hash(expected);atomicJSON(receiptFile,receipt);
      const fd=fs.openSync(file,fs.constants.O_RDWR|fs.constants.O_NOFOLLOW);
      try{
        const stat=fs.fstatSync(fd),current=fs.readFileSync(fd),named=fs.lstatSync(file);
        if(hash(current)!==body.revision||stat.ino!==named.ino||stat.dev!==named.dev||named.isSymbolicLink())throw new Fault(409,'The note changed. Reopen it before checking a task.');
        fs.writeSync(fd,Buffer.from(body.checked?'x':' '),0,1,Number(body.taskId));fs.fsyncSync(fd);
        const after=fs.lstatSync(file);if(after.ino!==stat.ino||after.dev!==stat.dev)throw new Fault(409,'The note moved while changing the task. Reopen it.');
      }finally{fs.closeSync(fd);}
    }
    receipt.saved=true;receipt.revision=receipt.after;atomicJSON(receiptFile,receipt);this.snapshots.clear();
    return {saved:true,taskId:body.taskId,checked:body.checked,revision:receipt.revision};
  }
  bind(body,operation,target){
    if(body.vaultId!==this.vaultId)throw new Fault(409,'This draft belongs to a different vault. Its text is kept on the phone.');
    if(typeof body.requestId!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(body.requestId))throw new Fault(400,'Invalid delivery ID.');
    const file=path.join(this.home,hash(body.requestId)+'.json'),digest=hash(operation+'\0'+target+'\0'+(body.text||''));
    if(fs.existsSync(file)){if(JSON.parse(fs.readFileSync(file,'utf8')).digest!==digest)throw new Fault(409,'This delivery ID belongs to another destination.');}
    else atomicJSON(file,{digest});
  }
  create(body){
    const parent=body.folderId||this.root;this.bind(body,'create',parent);
    const e=this.index.entries[parent];if(!e||!e.folder)throw new Fault(404,'The capture folder is unavailable.');this.checked(e.relative,true);const store=this.store(e.relative),result=store.create({...body,vaultId:store.vaultId});
    // Receipts retain the filename even when an acknowledged note later moves.
    const receipt=JSON.parse(fs.readFileSync(path.join(store.receipts,hash(body.requestId)+'.json'),'utf8'));
    result.id=this.remember(e.relative?e.relative+'/'+receipt.filename:receipt.filename,false);this.flush();return result;
  }
  append(id,body){if(/\.excalidraw(?:\.md)?$/i.test(this.index.entries[id]?.relative||''))throw new Fault(400,'Create a new note alongside this drawing for dictation.');this.bind(body,'append',id);const e=this.index.entries[id];if(!e||e.folder)throw new Fault(400,'Append is available for notes only.');const parent=path.posix.dirname(e.relative),store=this.store(parent==='.'?'':parent);return {...store.append(hash(path.basename(e.relative)),{...body,vaultId:store.vaultId}),id};}
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
