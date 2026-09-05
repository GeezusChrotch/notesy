'use strict';
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
class Fault extends Error { constructor(status, message) { super(message); this.status = status; } }
function atomicJSON(file, value) {
  const temp = file + '.' + crypto.randomBytes(8).toString('hex') + '.tmp';
  const fd = fs.openSync(temp, 'wx', 0o600);
  try { fs.writeFileSync(fd, JSON.stringify(value)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  try { fs.renameSync(temp, file); } finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
}
function plainText(markdown) {
  return markdown.replace(/^\uFEFF/, '').replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '')
    .replace(/<!-- stonenotes-append:[a-f0-9]{64} -->/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '[Image]')
    .replace(/!\[\[[^\]]+\]\]/g, '[Embedded content]')
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '').replace(/^```[^\n]*$/gm, '').replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1').replace(/`([^`]+)`/g, '$1').trim();
}
function pages(text, bytes = 760) {
  const result = []; let current = '';
  for (const character of text) {
    if (Buffer.byteLength(current + character) > bytes) { result.push(current); current = ''; }
    current += character;
  }
  result.push(current || (result.length ? '' : '(Empty note)'));
  return result.filter(Boolean);
}
function shortText(text, limit = 100) {
  let result = '';
  for (const c of text) { if (Buffer.byteLength(result + c) > limit) break; result += c; }
  return result;
}
class NoteStore {
  constructor(vault, state, folder = 'Pebble', options = {}) {
    this.vault = fs.realpathSync(vault);
    if (!fs.statSync(this.vault).isDirectory()) throw new Fault(400, 'Choose a vault folder.');
    if(typeof folder!=='string'||path.isAbsolute(folder)||(!(options.root&&folder==='')&&folder.split('/').some(p=>!p||p==='..'||p.startsWith('.'))))throw new Fault(400,'Choose a notes folder inside the vault.');
    this.folderName=folder;
    this.folder=path.join(this.vault,folder);
    let current=this.vault;
    for(const part of folder?folder.split('/'):[]){
      current=path.join(current,part);
      if(!fs.existsSync(current)&&options.create!==false)fs.mkdirSync(current,{mode:0o700});
      const info=fs.lstatSync(current);
      if(!info.isDirectory()||info.isSymbolicLink()||fs.realpathSync(current)!==current)throw new Fault(409,'The notes folder must be a regular folder inside the vault.');
    }
    this.checkFolder();
    // Preserve existing Pebble pairing; other destinations have their own queue scope.
    this.vaultId=folder==='Pebble'?hash(this.vault):hash(this.vault+'\0'+folder);
    this.receipts = path.join(state, 'receipts', this.vaultId);
    fs.mkdirSync(this.receipts, {recursive: true, mode: 0o700});
  }
  checkFolder() {
    const info = fs.lstatSync(this.folder);
    if (!info.isDirectory() || info.isSymbolicLink() || fs.realpathSync(this.folder) !== this.folder)
      throw new Fault(409, 'The notes folder must be a regular folder inside the selected vault.');
  }
  entries() {
    this.checkFolder();
    return fs.readdirSync(this.folder, {withFileTypes:true}).filter(e => e.isFile() && !e.name.startsWith('.') && /\.md$/i.test(e.name))
      .map(e => {
        const info = fs.lstatSync(path.join(this.folder, e.name));
        const title=e.name.replace(/\.md$/i, '').replace(/ — \d{4}-\d{2}-\d{2}T[\dTZ-]+ [a-f0-9]{12}$/, '');
        return {id:hash(e.name), title:shortText(title.replace(/^(\d{4}-\d{2}-\d{2} - \d{1,2})\.(\d{2}[ap]m - )/, '$1:$2')), modified:info.mtimeMs, name:e.name};
      }).sort((a,b) => b.modified-a.modified || a.name.localeCompare(b.name));
  }
  list(offset = 0) {
    const all = this.entries();
    return {vaultId:this.vaultId, notes:all.slice(offset, offset+15).map(({name,...entry}) => entry),
      next:offset+15 < all.length ? offset+15 : null, total:all.length};
  }
  read(id, page = 0) {
    const entry = this.entries().find(e => e.id === id);
    if (!entry) throw new Fault(404, 'This note was moved or removed. Refresh the list.');
    const fd = fs.openSync(path.join(this.folder, entry.name), fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    let buffer;
    try {
      const stat = fs.fstatSync(fd);
      if (!stat.isFile() || stat.size > 1024*1024) throw new Fault(413, 'This note is too large to read on the watch (1 MB limit).');
      buffer = fs.readFileSync(fd);
      if (buffer.length > 1024*1024) throw new Fault(413, 'This note is too large to read on the watch.');
    } finally { fs.closeSync(fd); }
    const chunks = pages(plainText(buffer.toString('utf8')));
    if (page >= chunks.length) throw new Fault(409, 'This note changed. Reopen it from the list.');
    return {id, title:entry.title, text:chunks[page], page, pages:chunks.length};
  }
  mutationReceipt(requestId, vaultId, operation, id, text='') {
    this.checkFolder();
    if(vaultId!==this.vaultId)throw new Fault(409,'The selected notes folder or vault changed. Restore the original pairing.');
    if(typeof requestId!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(requestId)||!/^[a-f0-9]{64}$/.test(id))throw new Fault(400,'Invalid note operation.');
    const file=path.join(this.receipts,hash(requestId)+'.json'),digest=hash(operation+id+text);
    const receipt=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null;
    if(receipt&&receipt.digest!==digest)throw new Fault(409,'This delivery ID already belongs to another operation.');
    return {file,digest,receipt};
  }
  append(id,{requestId,text,vaultId}) {
    if(typeof text!=='string'||!text.trim()||Buffer.byteLength(text)>4096||text.includes('\0'))throw new Fault(400,'Dictate a note of up to 4096 bytes.');
    const tx=this.mutationReceipt(requestId,vaultId,'append',id,text);
    if(tx.receipt&&tx.receipt.saved)return {saved:true,id,duplicate:true};
    const entry=this.entries().find(e=>e.id===id);
    if(!entry)throw new Fault(404,'This note was moved or deleted. Appended text is kept on your phone.');
    const destination=path.join(this.folder,entry.name),fd=fs.openSync(destination,fs.constants.O_RDWR|fs.constants.O_APPEND|fs.constants.O_NOFOLLOW);
    try {
      const stat=fs.fstatSync(fd);
      if(!stat.isFile()||stat.size>1024*1024)throw new Fault(413,'This note is too large to append from the watch.');
      const before=fs.readFileSync(fd),marker='<!-- stonenotes-append:'+hash(requestId)+' -->';
      let receipt=tx.receipt;
      if(!receipt){receipt={operation:'append',filename:entry.name,digest:tx.digest,before:hash(before),saved:false};atomicJSON(tx.file,receipt);}
      if(!before.includes(Buffer.from(marker))){
        if(hash(before)!==receipt.before)throw new Fault(409,'The note changed during an interrupted append. Your dictated text is kept on the phone.');
        const current=fs.lstatSync(destination);
        if(current.ino!==stat.ino||current.dev!==stat.dev||current.isSymbolicLink())throw new Fault(409,'The note moved while appending. Please retry.');
        // Append to the existing inode; never replace the note with a stale copy.
        fs.writeFileSync(fd,'\n\n'+text.trim()+'\n'+marker+'\n');fs.fsyncSync(fd);
        const after=fs.lstatSync(destination);
        if(after.ino!==stat.ino||after.dev!==stat.dev)throw new Fault(409,'The note moved while appending. Check the note before retrying.');
      }
      receipt.saved=true;atomicJSON(tx.file,receipt);return {saved:true,id};
    } finally {fs.closeSync(fd);}
  }
  remove(id,{requestId,vaultId}) {
    const tx=this.mutationReceipt(requestId,vaultId,'delete',id);
    if(tx.receipt&&tx.receipt.saved)return {deleted:true,id,duplicate:true};
    const trash=path.join(this.folder,'.trash');
    if(!fs.existsSync(trash))fs.mkdirSync(trash,{mode:0o700});
    if(!fs.lstatSync(trash).isDirectory()||fs.lstatSync(trash).isSymbolicLink()||fs.realpathSync(trash)!==trash)throw new Fault(409,'The note trash folder is unavailable.');
    let receipt=tx.receipt;
    if(!receipt){
      const entry=this.entries().find(e=>e.id===id);if(!entry)throw new Fault(404,'This note was already moved or deleted. Refresh the list.');
      receipt={operation:'delete',filename:entry.name,trash:hash(requestId)+'.md',digest:tx.digest,saved:false};atomicJSON(tx.file,receipt);
    }
    const destination=path.join(trash,receipt.trash);
    if(!fs.existsSync(destination)){
      const source=path.join(this.folder,receipt.filename),stat=fs.lstatSync(source);
      if(!stat.isFile()||stat.isSymbolicLink())throw new Fault(409,'This note is no longer a regular Markdown file.');
      fs.renameSync(source,destination);
    }
    receipt.saved=true;atomicJSON(tx.file,receipt);return {deleted:true,id};
  }
  create({requestId, text, vaultId}) {
    this.checkFolder();
    if (vaultId !== this.vaultId) throw new Fault(409, 'The selected notes folder or vault changed. Your pending note has been kept on the phone.');
    if (typeof requestId !== 'string' || !/^[a-zA-Z0-9_-]{8,100}$/.test(requestId)) throw new Fault(400, 'Invalid delivery ID.');
    if (typeof text !== 'string' || !text.trim() || Buffer.byteLength(text) > 4096 || text.includes('\0')) throw new Fault(400, 'Dictate a note of up to 4096 bytes.');
    const digest = hash(text), receiptFile = path.join(this.receipts, hash(requestId)+'.json');
    let receipt;
    if (fs.existsSync(receiptFile)) {
      receipt = JSON.parse(fs.readFileSync(receiptFile, 'utf8'));
      if (receipt.digest !== digest) throw new Fault(409, 'This delivery ID already belongs to another note.');
      if (receipt.saved) return {saved:true, id:hash(receipt.filename), title:receipt.title, duplicate:true};
    } else {
      const now = new Date(), created = now.toISOString();
      const date = [now.getFullYear(), String(now.getMonth()+1).padStart(2,'0'), String(now.getDate()).padStart(2,'0')].join('-');
      const title = shortText(text.trim().split(/[\n.!?]/)[0].replace(/[<>:"/\\|?*\x00-\x1f]/g, ' ').trim(), 70) || 'Dictated note';
      const clock = (now.getHours()%12 || 12) + '.' + String(now.getMinutes()).padStart(2,'0') + (now.getHours()<12?'am':'pm');
      const base = date + ' - ' + clock + ' - ' + title;
      // Reserve names recorded by earlier deliveries, including interrupted writes.
      const reserved = new Set(fs.readdirSync(this.receipts).filter(n => n.endsWith('.json'))
        .map(n => JSON.parse(fs.readFileSync(path.join(this.receipts,n),'utf8')).filename));
      let filename = base + '.md', suffix = 2;
      while (reserved.has(filename) || fs.existsSync(path.join(this.folder, filename)))
        filename = base + ' (' + suffix++ + ').md';
      receipt = {created, filename, title, digest, source:'Notesy', saved:false};
      atomicJSON(receiptFile, receipt);
    }
    const body = `---\ncreated: ${receipt.created}\nsource: ${receipt.source || 'StoneNotes'}\nstonenotes_id: ${requestId}\n---\n\n${text.trim()}\n`;
    const destination = path.join(this.folder, receipt.filename);
    if (fs.existsSync(destination)) {
      const fd = fs.openSync(destination, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
      let existing;
      try { existing = fs.readFileSync(fd); } finally { fs.closeSync(fd); }
      if (hash(existing) !== hash(body)) throw new Fault(409, 'A note already uses this filename. Existing content was preserved.');
    } else {
      const temp = path.join(this.folder, '.stonenotes-' + crypto.randomBytes(12).toString('hex') + '.tmp');
      const fd = fs.openSync(temp, 'wx', 0o600);
      try { fs.writeFileSync(fd, body); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
      try { this.checkFolder(); fs.linkSync(temp, destination); } finally { fs.unlinkSync(temp); }
    }
    receipt.saved = true;
    atomicJSON(receiptFile, receipt);
    return {saved:true, id:hash(receipt.filename), title:receipt.title, duplicate:false};
  }
}
// StoneNotes remains the wire service ID for compatibility with existing paired clients.
function makeServer({vault, state, token, folder}) {
  if (typeof token !== 'string' || token.length < 32) throw new Error('A private access token is required.');
  const BrowserStore=require('./browser')(NoteStore,Fault,hash,atomicJSON,shortText,plainText);
  const browser=new BrowserStore(vault,state), pairing=new Map();
  const legacyFolder=folder||'Pebble', legacyId=legacyFolder==='Pebble'?hash(browser.vault):hash(browser.vault+'\0'+legacyFolder);
  let legacy;const legacyStore=()=>legacy||(legacy=new NoteStore(vault,state,legacyFolder));
  let lastPhoneContact = null;
  const same = input => {const a=Buffer.from(input||''), b=Buffer.from('Bearer '+token);return a.length===b.length && crypto.timingSafeEqual(a,b);};
  const send = (res,status,value,type='application/json') => {
    res.writeHead(status, {'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*',
      'Access-Control-Allow-Headers':'Authorization, Content-Type, X-StoneNotes-Client','Access-Control-Allow-Methods':'GET, POST, OPTIONS',
      'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer', 'Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"});
    res.end(type==='application/json'?JSON.stringify(value):value);
  };
  const server = http.createServer(async(req,res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method==='OPTIONS') return send(res,204,{});
      if (req.method==='GET' && url.pathname==='/health') return send(res,200,{service:'StoneNotes',displayName:'Notesy',version:'0.1.0'});
      if (req.method==='GET' && url.pathname==='/pair') return send(res,200,pairingPage(),'text/html');
      if (!(req.method==='POST' && url.pathname==='/pair') && !same(req.headers.authorization)) throw new Fault(401,'Open Notesy settings on your phone and pair with the Mac connector.');
      let body = {}, bytes = 0, chunks = [];
      if (req.method==='POST') {
        for await (const chunk of req) { bytes+=chunk.length; if(bytes>16384) throw new Fault(413,'Request too large.'); chunks.push(chunk); }
        try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new Fault(400,'Invalid request.'); }
      }
      if (req.method==='POST' && url.pathname==='/pair') {
        const item = pairing.get(body.code); pairing.delete(body.code);
        if (!item || item.expires < Date.now()) throw new Fault(410,'This pairing code expired. Choose Connect Phone on the Mac again.');
        return send(res,200,{gatewayURL:item.origin,gatewayToken:token,vaultId:legacyId,browserId:browser.vaultId});
      }
      if (req.headers['x-stonenotes-client']==='phone') lastPhoneContact=new Date().toISOString();
      if (req.method==='GET' && url.pathname==='/v1/health') {
        browser.checked('',true); return send(res,200,{service:'StoneNotes',displayName:'Notesy',vaultId:legacyId,browserId:browser.vaultId,root:browser.root,folder:legacyFolder,lastPhoneContact});
      }
      if (req.method==='POST' && url.pathname==='/v1/pairing') {
        let origin;
        try { origin=new URL(body.origin); } catch { throw new Fault(400,'Start the private connection first.'); }
        if(origin.protocol!=='https:' || !origin.hostname.endsWith('.ts.net') || origin.username || origin.password || origin.pathname!=='/' || origin.search || origin.hash) throw new Fault(400,'Use the private Tailscale HTTPS origin.');
        for(const [key,item] of pairing) if(item.expires<Date.now()) pairing.delete(key);
        if(pairing.size>=10) pairing.clear();
        const code=crypto.randomBytes(24).toString('base64url');
        pairing.set(code,{origin:origin.origin,expires:Date.now()+600000});
        return send(res,200,{url:origin.origin+'/pair#'+code});
      }
      const integer=(key)=>{const value=url.searchParams.get(key)||'0';if(!/^\d{1,7}$/.test(value))throw new Fault(400,'Invalid page.');return Number(value);};
      if(req.method==='GET' && url.pathname==='/v1/notes') return send(res,200,legacyStore().list(integer('offset')));
      if(req.method==='GET' && /^\/v1\/notes\/[a-f0-9]{64}$/.test(url.pathname)) return send(res,200,legacyStore().read(url.pathname.split('/').pop(),integer('page')));
      const mutation=url.pathname.match(/^\/v1\/notes\/([a-f0-9]{64})\/(append|delete)$/);
      if(req.method==='POST'&&mutation)return send(res,200,mutation[2]==='append'?legacyStore().append(mutation[1],body):legacyStore().remove(mutation[1],body));
      if(req.method==='POST' && url.pathname==='/v1/notes') return send(res,200,legacyStore().create(body));
      if(req.method==='GET'&&url.pathname==='/v2/search')return send(res,200,await browser.search(url.searchParams.get('q'),integer('offset'),url.searchParams.get('snapshot')||''));
      if(req.method==='GET'&&url.pathname==='/v2/browse')return send(res,200,browser.list(url.searchParams.get('folder')||'',integer('offset'),url.searchParams.get('snapshot')||''));
      if(req.method==='GET'&&/^\/v2\/notes\/[a-f0-9]{64}$/.test(url.pathname))return send(res,200,browser.read(url.pathname.split('/').pop(),integer('page')));
      if(req.method==='POST'&&url.pathname==='/v2/notes')return send(res,200,browser.create(body));
      const action=url.pathname.match(/^\/v2\/items\/([a-f0-9]{64})\/(append|delete|pin)$/);
      if(req.method==='POST'&&action){
        if(body.vaultId!==browser.vaultId)throw new Fault(409,'The selected vault changed. Reload Notesy before making changes.');
        return send(res,200,action[2]==='pin'?browser.pin(action[1],body.pinned):action[2]==='append'?browser.append(action[1],body):browser.remove(action[1],body));
      }
      throw new Fault(404,'Unknown request.');
    } catch(error) { if(!res.headersSent)send(res,error.status||500,{error:error.status?error.message:'The Mac could not access the notes folder. Check the connector.'}); }
  });
  server.requestTimeout=10000; server.headersTimeout=10000;
  server.on('connection',socket=>socket.setTimeout(15000,()=>socket.destroy()));
  return {server,get store(){return legacyStore();},browser};
}
function pairingPage() {
  return `<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Pair Notesy</title><style>body{font:17px -apple-system,sans-serif;max-width:32rem;margin:3rem auto;padding:20px}button,textarea{font:inherit;padding:12px;width:100%;box-sizing:border-box;margin:10px 0}textarea{height:150px;font-size:13px}</style><h1>Pair Notesy</h1><p>Keep this page on your phone.</p><button id="connect">Get pairing details</button><textarea id="details" hidden readonly></textarea><button id="copy" hidden>Copy pairing details</button><p id="status">Then open Pebble → Notesy → Settings, paste the details, test, and save.</p><script>const code=location.hash.slice(1);history.replaceState(null,'',location.pathname);document.getElementById('connect').onclick=async()=>{try{const r=await fetch('/pair',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});const j=await r.json();if(!r.ok)throw Error(j.error);document.getElementById('details').value=JSON.stringify(j);document.getElementById('details').hidden=false;document.getElementById('copy').hidden=false;document.getElementById('connect').hidden=true;}catch(e){document.getElementById('status').textContent=e.message;}};document.getElementById('copy').onclick=async()=>{const t=document.getElementById('details');try{await navigator.clipboard.writeText(t.value);document.getElementById('status').textContent='Copied. Open Pebble → Notesy → Settings and paste.';}catch(e){t.focus();t.select();document.getElementById('status').textContent='Select and copy the pairing details above.';}};</script></html>`;
}
if(require.main===module) {
  const config=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
  const {server}=makeServer({...config,token:process.env.STONENOTES_TOKEN});
  server.on('error',()=>{process.stderr.write('Notesy could not start. Check its port and vault configuration.\n');process.exit(1);});
  server.listen(config.port||7844,'127.0.0.1');
}
module.exports={NoteStore,makeServer,plainText,pages};
