const {test}=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {makeService,publicIPv4,safeURL,title}=require('../gateway/web-titles');
const {parse}=require('../gateway/content'),{plainText,pages}=require('../gateway/server');
function fixture(responses,options={}){
 const calls=[];
 const service=makeService({timeout:50,lookup:async host=>[{address:host==='private.example'?'127.0.0.1':'93.184.215.14'}],request:(url,opts,cb)=>{
  const req=new EventEmitter();req.destroy=()=>{};req.end=()=>{calls.push(url.href);opts.lookup(url.hostname,{all:true},(e,answer)=>assert.deepEqual(answer,[{address:'93.184.215.14',family:4}]));const value=responses.shift();if(!value)return;const res=new EventEmitter();res.statusCode=value.status||200;res.headers=value.headers||{'content-type':'text/html'};res.resume=()=>{};cb(res);queueMicrotask(()=>{res.emit('data',Buffer.from(value.body||''));res.emit('end');});};return req;
 },...options});return {service,calls};
}
test('web labels are readable text, bare URLs become title blocks, and internal links remain selectable',()=>{
 const p=parse('Read [A great page](https://example.com/a).\n<a href="https://example.com/b">Another title</a>\nhttps://example.com/long?secret=123\n<https://example.org/path>\n[https://example.net/a](https://example.net/a)\n[[Local|My note]]\n`https://code.example/path`',plainText,pages);
 assert.ok(p.rich);assert.deepEqual(p.blocks.filter(b=>b.kind==='link').map(b=>b.text),['My note']);
 assert.deepEqual(p.blocks.filter(b=>b.kind==='web').map(b=>b.text),['example.com','example.org','example.net']);
 assert.ok(p.blocks.some(b=>b.text.includes('A great page')));assert.ok(p.blocks.some(b=>b.text.includes('Another title')));
 assert.ok(!p.blocks.some(b=>b.text.includes('secret=123')));assert.ok(p.blocks.some(b=>b.text.includes('https://code.example/path')));
});
test('fetches a page title, decodes entities, pins public DNS and caches it',async()=>{
 const f=fixture([{body:'<html><title>A &amp; B &#8212; café</title></html>'}]);assert.equal(await f.service.get('https://public.example/page#part'),'A & B — café');assert.equal(await f.service.get('https://public.example/page#other'),'A & B — café');assert.equal(f.calls.length,1);
});
test('forbids non-public IPv4, IPv6, credentials and unusual ports; rechecks redirects',async()=>{
 for(const ip of ['127.0.0.1','10.0.0.2','169.254.169.254','192.168.1.2','172.16.0.1','100.64.0.1','0.0.0.0','224.0.0.1','::1','::ffff:127.0.0.1'])assert.equal(publicIPv4(ip),false,ip);
 assert.equal(publicIPv4('93.184.215.14'),true);assert.throws(()=>safeURL('file:///etc/passwd'));assert.throws(()=>safeURL('https://user:pass@public.example'));assert.throws(()=>safeURL('http://public.example:7844'));
 const f=fixture([{status:302,headers:{location:'http://private.example/admin'}}]);assert.equal(await f.service.get('https://public.example'), '');assert.equal(f.calls.length,1);
});
test('missing titles, timeouts and oversized pages retain hostname and do not alter block indices',async()=>{
 const f=fixture([{body:'<html>No title</html>'},{body:'x'.repeat(140000)}]);const view={rich:true,blocks:[{kind:'web',id:'0',ref:'https://public.example/one',text:'public.example'},{kind:'image',id:'1',ref:'photo.png',text:'Photo'}]};
 const result=await f.service.enrich(view);assert.equal(result.blocks[0].text,'public.example');assert.deepEqual(result.blocks[1],view.blocks[1]);assert.equal(await f.service.get('https://public.example/two'),'');assert.equal(await f.service.get('https://public.example/timeout'),'');
 assert.equal(title('<title> &lt;hello&gt;\n &#0; world </title>'),'<hello> world');
});
test('uses supplied web titles without fetching, and style survives a bare URL in bold text',()=>{
 const p=parse('[https://example.com](https://example.com "Saved page title")\n<a href="https://example.org">A &amp; B</a>\n\n**Before https://example.net after**',plainText,pages);
 assert.ok(p.blocks.some(b=>b.text.includes('Saved page title')));assert.ok(p.blocks.some(b=>b.text.includes('A & B')));assert.equal(p.blocks.filter(b=>b.kind==='web').length,1);
 const after=p.blocks.find(b=>b.text.includes('after'));assert.ok(after.markup.startsWith('\x02'));assert.equal(publicIPv4('192.0.78.1'),true);
});
