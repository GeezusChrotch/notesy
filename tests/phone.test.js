const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
function phone(){
 const handlers={},messages=[],requests=[],data={},urls=[];
 const context={require,localStorage:{getItem:k=>data[k]||null,setItem:(k,v)=>data[k]=v},setTimeout:f=>f(),setInterval:()=>{},
  Pebble:{addEventListener:(n,f)=>handlers[n]=f,sendAppMessage:(m,ok)=>{messages.push(m);ok();},openURL:u=>urls.push(u)},
  XMLHttpRequest:function(){this.open=(method,url)=>{this.method=method;this.url=url;};this.setRequestHeader=()=>{};this.send=body=>{this.body=body;requests.push(this);};}};
 context.require=name=>require('../src/pkjs/'+name.replace('./',''));vm.runInNewContext(fs.readFileSync(require.resolve('../src/pkjs/index'),'utf8'),context);
 return {handlers,messages,requests,data,urls};
}
const config={gatewayURL:'https://unit.example.ts.net:10448',gatewayToken:'x'.repeat(40),vaultId:'a'.repeat(64)};
test('phone settings page compiles and contains no installed personal configuration',()=>{
 const p=phone();p.handlers.showConfiguration();const html=decodeURIComponent(p.urls[0].split(',').slice(1).join(','));
 assert.match(html,/Notesy Settings/);new vm.Script(html.split('<script>')[1].split('</script>')[0]);assert.ok(!html.includes('/Users/'));
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
test('settings shows connection progress, success and errors with browser window.status semantics',()=>{
 const p=phone();p.handlers.showConfiguration();const html=decodeURIComponent(p.urls[0].split(',').slice(1).join(','));
 const elements={};for(const id of ['buttons','pair','status','theme','auto','test','save','pending','appearance-preset','appearance-font','appearance-size','appearance-background','appearance-text','appearance-selection'])elements[id]={value:'',textContent:''};
 for(let i=0;i<12;i++)elements['button-'+i]={value:String(require('../src/pkjs/buttons').normalize()[i])};
 let request;const context={document:{getElementById:id=>elements[id]},location:{href:''},XMLHttpRequest:function(){request=this;this.open=()=>{};this.setRequestHeader=()=>{};this.send=()=>{};}};
 let browserStatus='';Object.defineProperty(context,'status',{get:()=>browserStatus,set:v=>{browserStatus=String(v);},configurable:true});
 vm.runInNewContext(html.split('<script>')[1].split('</script>')[0],context);
 elements.pair.value=JSON.stringify(config);elements.test.onclick();assert.equal(elements.status.textContent,'Connecting…');
 request.status=200;request.responseText=JSON.stringify({service:'StoneNotes',vaultId:config.vaultId});request.onload();assert.equal(elements.status.textContent,'Connected to your vault.');
 elements['appearance-preset'].value='2';elements['appearance-preset'].onchange();
 elements.save.onclick();assert.match(context.location.href,/^pebblejs:\/\/close#/);
 const saved=JSON.parse(decodeURIComponent(context.location.href.split('#')[1]));assert.equal(saved.appearance.background,'#000055');assert.equal(saved.appearance.font,'roboto-condensed');assert.equal(saved.gatewayToken,config.gatewayToken);
 elements.test.onclick();request.onerror();assert.match(elements.status.textContent,/Cannot reach/);
 elements.pair.value='invalid';elements.test.onclick();assert.ok(elements.status.textContent.length>0);assert.notEqual(elements.status.textContent,'Connecting…');
});
test('phone routes append to the chosen note and only confirms an acknowledged deletion',()=>{
 const p=phone(),id='b'.repeat(64);p.handlers.webviewclosed({response:encodeURIComponent(JSON.stringify(config))});
 p.handlers.appmessage({payload:{COMMAND:3,NOTE_ID:'append_phone_123',TARGET_ID:id,TEXT:'Add this'}});
 assert.ok(p.requests[0].url.endsWith('/'+id+'/append'));assert.equal(JSON.parse(p.requests[0].body).targetId,id);
 p.requests[0].status=200;p.requests[0].responseText='{"saved":true}';p.requests[0].onload();
 p.handlers.appmessage({payload:{COMMAND:5,NOTE_ID:id,TEXT:'delete_phone_123',REQUEST:9}});
 const req=p.requests[1];assert.ok(req.url.endsWith('/'+id+'/delete'));req.status=200;req.responseText='{"saved":true}';req.onload();assert.ok(!p.messages.some(m=>m.TYPE===10));
 p.handlers.appmessage({payload:{COMMAND:5,NOTE_ID:id,TEXT:'delete_phone_123',REQUEST:10}});
 const again=p.requests[2];again.status=200;again.responseText='{"deleted":true}';again.onload();assert.ok(p.messages.some(m=>m.TYPE===10&&m.REQUEST===10));
});
test('browser lists carry folder types, pins, page positions and stale replies are ignored',()=>{
 const p=phone(),c={...config,browserId:'b'.repeat(64),root:'c'.repeat(64)};p.handlers.webviewclosed({response:encodeURIComponent(JSON.stringify(c))});
 const send=(seq,offset)=>p.handlers.appmessage({payload:{COMMAND:1,API:2,REQUEST:seq,FOLDER_ID:c.root,PAGE:offset,SNAPSHOT:'abc'}});
 send(21,0);send(22,15);assert.match(p.requests[1].url,/v2\/browse/);assert.match(p.requests[1].url,/offset=15&snapshot=abc/);
 function reply(req,title){req.status=200;req.responseText=JSON.stringify({items:[{id:'d'.repeat(64),title,folder:true,pinned:true}],id:c.root,parent:'',offset:15,total:31,title:'Vault',snapshot:'abc'});req.onload();}
 reply(p.requests[1],'Current');reply(p.requests[0],'Stale');const row=p.messages.find(m=>m.TITLE==='Current');assert.equal(row.ENTRY_KIND,1);assert.equal(row.PINNED,1);assert.ok(!p.messages.some(m=>m.TITLE==='Stale'));
});
test('phone learns browser identity from existing pairing and sends all twelve button bindings',()=>{
 const p=phone();p.handlers.webviewclosed({response:encodeURIComponent(JSON.stringify({...config,buttons:[3,2,1,4,5,6,7,0,0,2,4,5]}))});p.handlers.ready();
 const req=p.requests[0];req.status=200;req.responseText=JSON.stringify({service:'StoneNotes',vaultId:config.vaultId,browserId:'b'.repeat(64),root:'c'.repeat(64)});req.onload();
 const settings=p.messages.filter(m=>m.TYPE===6).at(-1);assert.equal(settings.API,2);assert.equal(settings.BUTTONS,'3,2,1,4,5,6,7,0,0,2,4,5');assert.equal(settings.FOLDER_ID,'c'.repeat(64));
 p.handlers.appmessage({payload:{COMMAND:3,API:2,NOTE_ID:'v2_phone_draft',TEXT:'Here',FOLDER_ID:'d'.repeat(64),VAULT_ID:'b'.repeat(64)}});
 assert.match(p.requests[1].url,/v2\/notes$/);assert.equal(JSON.parse(p.requests[1].body).folderId,'d'.repeat(64));
});
