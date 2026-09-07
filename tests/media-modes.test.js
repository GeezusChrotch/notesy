const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm');
const {createRequire}=require('node:module');
const {makeServer}=require('../gateway/server');
const {quantizeImage}=require('../gateway/pebble-image.cjs');

test('media applies requested mode and photo/drawing treatment, isolates cached modes, and preserves attachments',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'notesy-modes-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const vault=path.join(root,'vault');fs.mkdirSync(vault);
 const browser=makeServer({vault,state:path.join(root,'state'),token:'test-token-'.repeat(4)}).browser;
 const rgba=Buffer.from(Array.from({length:48},(_,i)=>i%4===3?255:40+(i*29)%180));
 const filename=require.resolve('../gateway/media'),realRequire=createRequire(filename),module={exports:{}};let conversions=0;
 vm.runInNewContext(fs.readFileSync(filename,'utf8'),{module,Buffer,process,__dirname:path.dirname(filename),require(name){
  if(name==='node:child_process')return {execFile(executable,args,options,callback){conversions++;callback(null,JSON.stringify({width:4,height:3,rgba:rgba.toString('base64')}));}};
  return realRequire(name);
 }});
 const media=module.exports;
 const decode=v=>{const r=Buffer.from(v.data,'base64'),out=[];for(let i=0;i<r.length;i+=2)for(let n=0;n<r[i];n++)out.push(r[i+1]);return out;};
 for(const [ext,kind] of [['png','photo'],['svg','drawing']]){
  const attachment=path.join(vault,'asset.'+ext),bytes=Buffer.from('fixture '+ext);fs.writeFileSync(attachment,bytes);
  const note='note-'+ext+'.md';fs.writeFileSync(path.join(vault,note),'![[asset.'+ext+']]');const id=browser.remember(note,false),revision=browser.content(id).revision;
  for(const mode of ['natural','high-contrast','original']){
   const before=conversions,result=await media.render(browser,id,0,revision,120,100,mode);
   assert.equal(conversions,before+1);assert.deepEqual(decode(result),Array.from(quantizeImage({width:4,height:3,rgba,mode,kind})));
   assert.equal(await media.render(browser,id,0,revision,120,100,mode),result);assert.equal(conversions,before+1);
  }
  const before=conversions;assert.equal(await media.render(browser,id,0,revision,120,100,'invalid'),await media.render(browser,id,0,revision,120,100,'natural'));assert.equal(conversions,before);
  assert.deepEqual(fs.readFileSync(attachment),bytes);
 }
});

test('paired media HTTP route forwards display mode to the renderer',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'notesy-mode-http-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const vault=path.join(root,'vault');fs.mkdirSync(vault);const token='mode-http-test-'.repeat(3);
 const {server}=makeServer({vault,state:path.join(root,'state'),token});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const media=require('../gateway/media'),original=media.render;let received;
 media.render=async(...args)=>{received=args;return {width:1,height:1,encoding:'rle-gcolor8',data:'Af8='};};t.after(()=>{media.render=original;});
 const base='http://127.0.0.1:'+server.address().port+'/v3/notes/'+'b'.repeat(64)+'/image?index=0&revision='+'a'.repeat(64)+'&width=120&height=100';
 for(const mode of ['natural','high-contrast','original']){
  const response=await fetch(base+'&mode='+mode,{headers:{Authorization:'Bearer '+token}});assert.equal(response.status,200);assert.equal(received[6],mode);
 }
 assert.equal((await fetch(base+'&mode=natural')).status,401);
});

test('Original retains legacy opaque colors; drawing backgrounds stay uniform and all modes are bounded',()=>{
 const width=120,height=100,rgba=Buffer.alloc(width*height*4);
 for(let p=0;p<width*height;p++){rgba[p*4]=(p*13)%256;rgba[p*4+1]=(p*37)%256;rgba[p*4+2]=(p*71)%256;rgba[p*4+3]=255;}
 const old=Array.from({length:width*height},(_,p)=>0xc0|(Math.round(rgba[p*4]/85)<<4)|(Math.round(rgba[p*4+1]/85)<<2)|Math.round(rgba[p*4+2]/85));
 assert.deepEqual(Array.from(quantizeImage({width,height,rgba,mode:'original'})),old);
 for(const mode of ['natural','high-contrast','original']){
  const result=quantizeImage({width,height,rgba,mode});assert.equal(result.length,width*height);assert.ok(result.every(v=>v>=192&&v<=255));
 }
 const flat=Buffer.from(Array.from({length:16*16*4},(_,i)=>i%4===3?255:145));
 assert.equal(new Set(quantizeImage({width:16,height:16,rgba:flat,kind:'drawing'})).size,1);
});
