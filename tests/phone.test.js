const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
function phone(){
 const handlers={},messages=[],requests=[],data={},urls=[];
 const context={require,localStorage:{getItem:k=>data[k]||null,setItem:(k,v)=>data[k]=v},setTimeout:f=>f(),setInterval:()=>{},
  Pebble:{addEventListener:(n,f)=>handlers[n]=f,sendAppMessage:(m,ok)=>{messages.push(m);ok();},openURL:u=>urls.push(u)},
  XMLHttpRequest:function(){this.open=(method,url)=>{this.method=method;this.url=url;};this.setRequestHeader=()=>{};this.send=body=>{this.body=body;requests.push(this);};}};
 context.require=()=>require('../src/pkjs/delivery');vm.runInNewContext(fs.readFileSync(require.resolve('../src/pkjs/index'),'utf8'),context);
 return {handlers,messages,requests,data,urls};
}
const config={gatewayURL:'https://unit.example.ts.net:10448',gatewayToken:'x'.repeat(40),vaultId:'a'.repeat(64)};
test('phone settings page compiles and contains no installed personal configuration',()=>{
 const p=phone();p.handlers.showConfiguration();const html=decodeURIComponent(p.urls[0].split(',').slice(1).join(','));
 assert.match(html,/StoneNotes Settings/);new vm.Script(html.split('<script>')[1].split('</script>')[0]);assert.ok(!html.includes('/Users/'));
});
test('late list response cannot replace a newer watch request',()=>{
 const p=phone();p.handlers.webviewclosed({response:encodeURIComponent(JSON.stringify(config))});p.handlers.appmessage({payload:{COMMAND:1,REQUEST:10,PAGE:0}});p.handlers.appmessage({payload:{COMMAND:1,REQUEST:11,PAGE:15}});
 const reply=(req,title)=>{req.status=200;req.responseText=JSON.stringify({notes:[{id:'b'.repeat(64),title}],next:null});req.onload();};
 reply(p.requests[1],'Current');reply(p.requests[0],'Stale');assert.ok(p.messages.some(m=>m.TITLE==='Current'));assert.ok(!p.messages.some(m=>m.TITLE==='Stale'));
});
test('capture is acknowledged after phone persistence and saved only after the Mac receipt',()=>{
 const p=phone();p.handlers.webviewclosed({response:encodeURIComponent(JSON.stringify(config))});p.handlers.appmessage({payload:{COMMAND:3,REQUEST:1,NOTE_ID:'watch-12345678',TEXT:'Remember to water the fern'}});
 assert.equal(JSON.parse(p.data['stonenotes.delivery']).pending.length,1);assert.ok(p.messages.some(m=>m.TYPE===7));assert.ok(!p.messages.some(m=>m.TYPE===8));
 const req=p.requests[0];req.status=200;req.responseText='{"saved":true}';req.onload();assert.ok(p.messages.some(m=>m.TYPE===8));assert.equal(JSON.parse(p.data['stonenotes.delivery']).pending.length,0);
});
