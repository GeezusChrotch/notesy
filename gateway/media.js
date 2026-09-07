'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{execFile,execFileSync}=require('node:child_process');
const assets=process.env.NOTESY_RENDERER|| (fs.existsSync(path.join(__dirname,'renderer'))?path.join(__dirname,'renderer'):path.join(__dirname,'../renderer/dist'));
const {quantizeImage,normalizeImageMode}=require('./pebble-image.cjs');
const cache=new Map();
function error(message,status=400){return Object.assign(new Error(message),{status});}
function resolve(browser,note,reference){
 let ref;try{ref=decodeURIComponent(reference.split('#')[0]);}catch{throw error('Invalid image link.');}
 if(!ref||/^[a-z][a-z\d+.-]*:/i.test(ref)||ref.startsWith('/')||ref.includes('\0'))throw error('Only images stored in this vault can be shown.');
 const extensions=path.extname(ref)?['']:['','.png','.jpg','.jpeg','.webp','.svg','.excalidraw.md','.excalidraw','.pdf'];
 const parent=path.posix.dirname(note);
 for(const base of [path.posix.normalize(path.posix.join(parent,ref)),ref])for(const ext of extensions){try{return browser.checked(base+ext,false,true);}catch{}}
 // Obsidian also permits shortest unique filenames, independent of attachment folder.
 const found=[],directories=[''];let visited=0;
 while(directories.length){const dir=directories.pop();for(const e of fs.readdirSync(browser.checked(dir,true),{withFileTypes:true})){
  if(++visited>60000)throw error('Attachment lookup limit reached. Use a vault-relative image link.');if(e.name.startsWith('.'))continue;
  const relative=dir?dir+'/'+e.name:e.name;if(e.isDirectory())directories.push(relative);else if(e.isFile()&&extensions.some(ext=>path.posix.basename(ref+ext).toLowerCase()===e.name.toLowerCase()))found.push(browser.checked(relative,false,true));
 }}
 if(found.length!==1)throw error(found.length?'More than one image has this name. Use its folder in the link.':'This embedded image was moved or is missing.',404);return found[0];
}
function read(file){const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{const stat=fs.fstatSync(fd);if(!stat.isFile()||stat.size>20*1024*1024)throw error('This image exceeds the 20 MB limit.',413);const data=fs.readFileSync(fd);if(data.length>20*1024*1024)throw error('This image exceeds the 20 MB limit.',413);return data;}finally{fs.closeSync(fd);}}
function drawing(browser,file,data){
 const text=data.toString('utf8');let source=text;
 if(/\.md$/i.test(file)){
  const block=text.match(/```(json|compressed-json)\s*\n([\s\S]*?)\n```/);if(!block)throw error('No Excalidraw drawing data was found.');
  source=block[1]==='json'?block[2]:require(path.join(assets,'lz-string.js')).decompressFromBase64(block[2].replace(/\s/g,''));
 }
 if(!source||source.length>12*1024*1024)throw error('Drawing data is invalid or too large.');let scene;try{scene=JSON.parse(source);}catch{throw error('Drawing data is invalid.');}
 if(!Array.isArray(scene.elements)||scene.elements.length>10000)throw error('This drawing exceeds the watch rendering limit.');
 scene.files=scene.files||{};
 // Obsidian keeps image references outside the compressed scene in Embedded Files.
 for(const match of text.matchAll(/^([\w-]+):\s*!?\[\[([^\]]+)\]\]/gm)){
  const image=resolve(browser,path.relative(browser.vault,file),match[2].split('|')[0]),ext=path.extname(image).toLowerCase();
  const mime={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif'}[ext];
  if(mime)scene.files[match[1]]={id:match[1],dataURL:'data:'+mime+';base64,'+read(image).toString('base64'),mimeType:mime,created:0};
 }
 for(const [key,value] of Object.entries(scene.files))if(!value||!/^data:image\/(?:png|jpeg|webp|gif);base64,/.test(value.dataURL||''))delete scene.files[key];
 return Buffer.from(JSON.stringify(scene));
}
const pdfCache=new Map();
function pdfBlocks(browser,note,blocks){
 return blocks.flatMap(block=>{
  if(block.kind!=='image'||! /\.pdf(?:#|$)/i.test(block.ref))return [block];
  try{
   const data=read(resolve(browser,note,block.ref)),digest=crypto.createHash('sha256').update(data).digest('hex');
   let pages=pdfCache.get(digest);
   if(!pages){
    const temp=fs.mkdtempSync(path.join(os.tmpdir(),'notesy-pdf-'));
    try{
     const input=path.join(temp,'input'),helper=path.join(temp,'notesy-image-helper');fs.writeFileSync(input,data,{mode:0o600});fs.copyFileSync(path.join(assets,'notesy-image-helper'),helper);fs.chmodSync(helper,0o700);
     const info=JSON.parse(execFileSync(helper,[input,'120','100','pdf-info',assets],{timeout:5000,maxBuffer:4096,stdio:['ignore','pipe','pipe']}));
     pages=info.pages;if(!Number.isInteger(pages)||pages<1||pages>1000)throw error('Invalid PDF page count.');
     if(pdfCache.size>=24)pdfCache.delete(pdfCache.keys().next().value);pdfCache.set(digest,pages);
    }finally{fs.rmSync(temp,{recursive:true,force:true});}
   }
   const fragment=block.ref.split('#')[1]||'',match=fragment.match(/(?:^|&)page=(\d+)(?:&|$)/i),selected=match?Number(match[1]):null;
   if(selected!==null&&(selected<1||selected>pages))throw error('This PDF page is unavailable.');
   return Array.from({length:selected===null?pages:1},(_,i)=>({...block,pdfPage:selected===null?i+1:selected,pdfRevision:digest,text:path.posix.basename(block.ref.split('#')[0])+' · Page '+(selected===null?i+1:selected)+' of '+pages}));
  }catch(e){return [{kind:'text',text:'PDF: '+(e.status>=400&&e.status<=599?e.message:'Cannot preview this PDF. It may be damaged, password-protected, or exceed the 1000-page limit.')}];}
 });
}
async function render(browser,id,index,revision,width,height,mode){
 mode=normalizeImageMode(mode);
 if(![120,176].includes(width)||height!==(width===120?100:150))throw error('Invalid watch image size.');
 const raw=browser.raw(id);if(crypto.createHash('sha256').update(raw.data).digest('hex')!==revision)throw error('The note changed. Reopen it to load images.',409);
 const parsed=browser.content(id,Math.floor(index/15)),block=parsed.blocks[index%15];if(!block||block.kind!=='image')throw error('This image is no longer in the note.',404);
 const file=resolve(browser,raw.entry.relative,block.ref),ext=path.extname(file).toLowerCase();
 if(!/\.(?:png|jpe?g|webp|gif|heic|tiff?|bmp|svg|pdf|excalidraw|md)$/i.test(file))throw error('This embedded file is not a supported picture or drawing.');
 let data=read(file);if(block.pdfRevision&&crypto.createHash('sha256').update(data).digest('hex')!==block.pdfRevision)throw error('The PDF changed. Reopen the note.',409);let kind=ext==='.pdf'?'pdf:'+block.pdfPage:require('./content').isDrawing(file,data)?'drawing':ext==='.svg'?'svg':'image';if(kind==='drawing')data=drawing(browser,file,data);
 const key=crypto.createHash('sha256').update(data).update(width+':'+height+':'+kind+':'+mode).digest('hex');if(cache.has(key))return cache.get(key);
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'notesy-image-')),input=path.join(temp,'input');fs.writeFileSync(input,data,{mode:0o600});
 try{
  // Give the Swift CLI its own process bundle context. Direct execution inside the
  // enclosing macOS app can stall before main. Copying preserves its code signature.
  const executable=path.join(temp,'notesy-image-helper');
  fs.copyFileSync(path.join(assets,'notesy-image-helper'),executable);fs.chmodSync(executable,0o700);
  const result=await new Promise((resolve,reject)=>execFile(executable,[input,String(width),String(height),kind,assets],{timeout:14000,maxBuffer:384*1024},(err,stdout)=>{if(err)reject(error('This image could not be converted. Check its format or size.',422));else{try{resolve(JSON.parse(stdout));}catch{reject(error('Image conversion failed.',422));}}}));
  const rgba=Buffer.from(result.rgba,'base64');if(rgba.length!==result.width*result.height*4||result.width>width||result.height>height)throw error('Invalid converted image.',422);
  const pixels=quantizeImage({width:result.width,height:result.height,rgba,mode,kind:kind==='image'?'photo':'drawing'});
  const runs=[];for(let i=0;i<pixels.length;){let n=1;while(n<255&&i+n<pixels.length&&pixels[i+n]===pixels[i])n++;runs.push(n,pixels[i]);i+=n;}
  const value={width:result.width,height:result.height,encoding:'rle-gcolor8',data:Buffer.from(runs).toString('base64')};if(cache.size>=12)cache.delete(cache.keys().next().value);cache.set(key,value);return value;
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
module.exports={render,resolve,drawing,pdfBlocks};
