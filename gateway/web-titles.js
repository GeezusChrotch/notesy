'use strict';
const http=require('node:http'),https=require('node:https'),dns=require('node:dns').promises,net=require('node:net');
function publicIPv4(address){
 if(net.isIP(address)!==4)return false;
 const [a,b,c]=address.split('.').map(Number);
 return !(a===0||a===10||a===127||a>=224||(a===100&&b>=64&&b<=127)||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&(b===168||(b===0&&(c===0||c===2))||(b===88&&c===99)))||(a===198&&(b===18||b===19||(b===51&&c===100)))||(a===203&&b===0&&c===113));
}
function safeURL(value){const u=new URL(value);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||(u.port&&!['80','443'].includes(u.port)))throw Error('Unsupported page address');u.hash='';return u;}
function title(html){
 const m=html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i);if(!m)return '';
 const entities={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',ndash:'–',mdash:'—',hellip:'…',rsquo:'’',lsquo:'‘'};
 return m[1].replace(/<[^>]*>/g,'').replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi,(all,key)=>{
  if(key[0]!=='#')return entities[key.toLowerCase()]||all;const n=key[1].toLowerCase()==='x'?parseInt(key.slice(2),16):Number(key.slice(1));return n>0&&n<=0x10ffff&&!(n>=0xd800&&n<=0xdfff)?String.fromCodePoint(n):'';
 }).replace(/[\x00-\x1f\x7f]/g,' ').replace(/\s+/g,' ').trim();
}
function short(text){let result='';for(const c of text){if(Buffer.byteLength(result+c)>220)break;result+=c;}return result;}
// Fetch public page metadata only: no browser, cookies, authorization, script
// execution or third-party title service. Pin the validated DNS answer per hop.
function makeService({lookup=(host)=>dns.lookup(host,{all:true,family:4}),request=(u,o,cb)=>(u.protocol==='https:'?https:http).request(u,o,cb),timeout=2500}={}){
 const cache=new Map(),pending=new Map();
 async function fetchTitle(value){
  const end=Date.now()+timeout,requests=new Set();let timer;
  const work=(async()=>{
   let u=safeURL(value);
   for(let hop=0;hop<3;hop++){
    const addresses=await lookup(u.hostname);
    if(Date.now()>=end)throw Error('Title timeout');
    if(!addresses.length||addresses.some(v=>!publicIPv4(v.address)))throw Error('Non-public page address');
    const address=addresses[0].address;
    const response=await new Promise((resolve,reject)=>{
     const req=request(u,{method:'GET',agent:false,headers:{'User-Agent':'Notesy/1.3 (page title preview)','Accept':'text/html','Accept-Encoding':'identity'},lookup:(_host,options,callback)=>options.all?callback(null,[{address,family:4}]):callback(null,address,4)},res=>{
      res.on('error',reject);
      if(res.statusCode>=300&&res.statusCode<400&&res.headers.location){res.resume();resolve({location:res.headers.location});return;}
      if(res.statusCode!==200||!/^text\/html(?:;|$)/i.test(res.headers['content-type']||'text/html')){res.resume();reject(Error('No HTML title'));return;}
      let bytes=0,chunks=[];
      res.on('data',chunk=>{bytes+=chunk.length;if(bytes>131072){req.destroy(Error('Page too large'));return;}chunks.push(chunk);const found=title(Buffer.concat(chunks).toString('utf8'));if(found){resolve({title:short(found)});req.destroy();}});
      res.on('end',()=>resolve({title:short(title(Buffer.concat(chunks).toString('utf8')))}));res.on('error',reject);
     });requests.add(req);req.on('error',reject);req.end();
    });
    if(response.location){u=safeURL(new URL(response.location,u).href);continue;}
    return response.title;
   }
   return '';
  })();
  try{return await Promise.race([work,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Title timeout')),timeout);})]);}
  finally{clearTimeout(timer);for(const req of requests)req.destroy();}
 }
 async function get(value){
  let key;try{key=safeURL(value).href;}catch{return '';}
  const found=cache.get(key);if(found&&found.expires>Date.now())return found.title;
  if(pending.has(key))return pending.get(key);
  // Bound outstanding requests across concurrent watch reads. Busy pages still
  // display their hostname immediately and can pick up a title on a later read.
  if(pending.size>=16)return '';
  const job=fetchTitle(key).catch(()=> '').then(value=>{if(cache.size>=256)cache.delete(cache.keys().next().value);cache.set(key,{title:value,expires:Date.now()+(value?86400000:900000)});return value;}).finally(()=>pending.delete(key));pending.set(key,job);return job;
 }
 async function enrich(view){if(!view.rich)return view;return {...view,blocks:await Promise.all(view.blocks.map(async block=>block.kind==='web'?{...block,text:await get(block.ref)||block.text}:block))};}
 return {get,enrich};
}
const service=makeService();module.exports={...service,makeService,publicIPv4,safeURL,title};
