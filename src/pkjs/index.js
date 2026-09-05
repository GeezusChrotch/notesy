/* global Pebble, localStorage, XMLHttpRequest */
'use strict';
var Delivery = require('./delivery');
var Themes = require('./themes');
var Buttons = require('./buttons');
var Folders = require('./folders');
function enhanced(){try{return Pebble.getActiveWatchInfo().platform==='emery';}catch(e){return false;}}
function marqueeSpeed(value){return [0,15,30,60,90].indexOf(value)>=0?value:30;}
function settingsMessage(){var m=Themes.message(config,enhanced());m.MARQUEE_SPEED=marqueeSpeed(config&&config.marqueeSpeed);m.BUTTONS=Buttons.normalize(config&&config.buttons).join(',');m.API=config&&config.browserId?2:1;m.VAULT_ID=config&&config.browserId||'';m.FOLDER_ID=config&&config.root||'';return m;}
var config = null, activeRequest = 0, outbox = [], transmitting = false, delivery;
try { config = JSON.parse(localStorage.getItem('stonenotes.config') || 'null'); } catch (_) {}
function valid(c) {return c && /^https:\/\/[a-z0-9.-]+\.ts\.net(?::\d+)?$/i.test(c.gatewayURL) && typeof c.gatewayToken==='string' && c.gatewayToken.length>=32 && /^[a-f0-9]{64}$/.test(c.vaultId);}
if(!valid(config))config=null;
function send(message) {outbox.push({message:message,tries:0});drain();}
function drain() {
  if(transmitting || !outbox.length)return;
  transmitting=true;
  Pebble.sendAppMessage(outbox[0].message,function(){outbox.shift();transmitting=false;drain();},function(){
    transmitting=false;if(++outbox[0].tries>=3)outbox.shift();setTimeout(drain,350);
  });
}
function request(c, method, route, body, callback) {
  if(!valid(c)){callback(Error('Pair Notesy in phone Settings.'));return;}
  var xhr=new XMLHttpRequest(),finished=false;
  function finish(e,v){if(finished)return;finished=true;callback(e,v);}
  xhr.open(method,c.gatewayURL+route,true);xhr.timeout=route.indexOf('/image?')>=0?20000:10000;
  xhr.setRequestHeader('Authorization','Bearer '+c.gatewayToken);
  xhr.setRequestHeader('X-StoneNotes-Client','phone');
  if(body)xhr.setRequestHeader('Content-Type','application/json');
  xhr.onload=function(){var value;try{value=JSON.parse(xhr.responseText);}catch(e){finish(Error('Unexpected Mac response.'));return;}
    if(xhr.status<200||xhr.status>=300){finish(Error(value.error||'Mac connection unavailable.'));return;}finish(null,value);};
  xhr.onerror=xhr.ontimeout=function(){finish(Error('Waiting for Mac. Keep Tailscale connected and the Mac awake.'));};
  try{xhr.send(body?JSON.stringify(body):null);}catch(e){finish(Error('Mac connection unavailable.'));}
}
function error(text,seq){send({TYPE:9,TEXT:text,REQUEST:seq||0});}
try {
  delivery=new Delivery(localStorage,function(c,note,cb){request(c,'POST',note.api===2?(note.targetId?'/v2/items/'+encodeURIComponent(note.targetId)+'/append':'/v2/notes'):(note.targetId?'/v1/notes/'+encodeURIComponent(note.targetId)+'/append':'/v1/notes'),note,cb);},function(state,id,message,targetId){
    send({TYPE:state==='saved'?8:state==='queued'?7:5,NOTE_ID:id,TARGET_ID:targetId||'',TEXT:state==='saved'?'Saved to vault':state==='queued'?'On phone · waiting for Mac':message||'Waiting for Mac'});
    if(state==='saved')setTimeout(pump,400);
  });
} catch(e) { error('Phone storage could not load pending notes. Your watch draft is kept.'); }
function pump(){if(delivery)delivery.pump(config);}
Pebble.addEventListener('ready',function(){
  if(!config){send(settingsMessage());return;}
  request(config,'GET','/v1/health',null,function(e,v){
    if(!e&&v.browserId){config.browserId=v.browserId;config.root=v.root;try{localStorage.setItem('stonenotes.config',JSON.stringify(config));}catch(_){} }
    send(settingsMessage());pump();
  });
});
Pebble.addEventListener('appmessage',function(event){
  var m=event.payload,seq=m.REQUEST||0;
  if(m.COMMAND===3){
    if(!delivery){error('Phone storage unavailable. Your draft is kept.',seq);return;}
    try{delivery.enqueue(m.NOTE_ID,m.TEXT,config,m.TARGET_ID,{api:m.API,folderId:m.FOLDER_ID,vaultId:m.VAULT_ID});pump();}catch(e){error(e.message,seq);}return;
  }
  if(m.COMMAND===5){
    if(delivery&&delivery.pending().some(function(n){return n.targetId===m.NOTE_ID;})){error("Wait for the pending append to save before deleting this note.",seq);return;}
    request(config,'POST',(m.API===2?'/v2/items/':'/v1/notes/')+encodeURIComponent(m.NOTE_ID)+'/delete',{requestId:m.TEXT,vaultId:config&&(m.API===2?config.browserId:config.vaultId)},function(e,v){if(e||!v||!v.deleted){error(e?e.message:'Deletion was not confirmed. Please retry.',seq);return;}send({TYPE:10,NOTE_ID:m.NOTE_ID,REQUEST:seq});});return;
  }
  if(m.COMMAND===6){
    request(config,'POST','/v2/items/'+encodeURIComponent(m.NOTE_ID)+'/pin',{pinned:!!m.PINNED,vaultId:config&&config.browserId},function(e,v){if(e){error(e.message,seq);return;}send({TYPE:11,NOTE_ID:v.id,PINNED:v.pinned?1:0,REQUEST:seq});});return;
  }
  if(m.COMMAND===4){pump();return;}
  activeRequest=seq;
  if(m.COMMAND===8){
    request(config,'POST','/v3/notes/'+encodeURIComponent(m.NOTE_ID)+'/task',{vaultId:config&&config.browserId,requestId:m.TEXT,taskId:m.ITEM_ID,checked:!!m.CHECKED,revision:m.REVISION},function(e,v){if(seq!==activeRequest)return;if(e||!v.saved){error(e?e.message:'Task change was not confirmed.',seq);return;}send({TYPE:15,REQUEST:seq,ITEM_ID:v.taskId,CHECKED:v.checked?1:0,REVISION:v.revision});});return;
  }
  if(m.COMMAND===9){
    request(config,'GET','/v3/notes/'+encodeURIComponent(m.NOTE_ID)+'/image?index='+m.INDEX+'&revision='+encodeURIComponent(m.REVISION)+'&width='+m.WIDTH+'&height='+m.HEIGHT,null,function(e,v){
      if(seq!==activeRequest)return;if(e){error(e.message,seq);return;}
      var bytes=[],alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',bits=0,value=0;
      for(var i=0;i<v.data.length;i++){var digit=alphabet.indexOf(v.data.charAt(i));if(digit<0)break;value=(value<<6)|digit;bits+=6;if(bits>=8){bits-=8;bytes.push((value>>bits)&255);}}
      if(bytes.length>60000||bytes.length%2){error('Invalid image data.',seq);return;}
      send({TYPE:16,REQUEST:seq,WIDTH:v.width,HEIGHT:v.height,TOTAL:bytes.length});
      for(var offset=0;offset<bytes.length;offset+=512)send({TYPE:17,REQUEST:seq,INDEX:offset,PIXELS:bytes.slice(offset,offset+512)});
      send({TYPE:18,REQUEST:seq});
    });return;
  }
  if(m.COMMAND===1||m.COMMAND===7){
    request(config,'GET',m.COMMAND===7?'/v2/search?q='+encodeURIComponent(m.TEXT||'')+'&offset='+(m.PAGE||0)+'&snapshot='+encodeURIComponent(m.SNAPSHOT||''):m.API===2?'/v2/browse?folder='+encodeURIComponent(m.FOLDER_ID||'')+'&offset='+(m.PAGE||0)+'&snapshot='+encodeURIComponent(m.SNAPSHOT||''):'/v1/notes?offset='+(m.PAGE||0),null,function(e,value){
      if(seq!==activeRequest)return;if(e){error(e.message,seq);return;}
      if(m.API===2){
        send({TYPE:1,REQUEST:seq,COUNT:value.items.length,PAGE:value.offset,TOTAL:value.total,FOLDER_ID:value.id,PARENT_ID:value.parent,TITLE:value.title,SNAPSHOT:value.snapshot});
        value.items.forEach(function(n,i){send({TYPE:2,REQUEST:seq,INDEX:i,NOTE_ID:n.id,TITLE:n.title,ENTRY_KIND:n.folder?1:0,PINNED:n.pinned?1:0,TEXT:n.location||''});});
      }else{
        send({TYPE:1,REQUEST:seq,COUNT:value.notes.length,PAGE:value.next===null?-1:value.next});
        value.notes.forEach(function(n,i){send({TYPE:2,REQUEST:seq,INDEX:i,NOTE_ID:n.id,TITLE:n.title});});
      }
      send({TYPE:3,REQUEST:seq});
    });
  }else if(m.COMMAND===2){
    request(config,'GET',(m.API===3?'/v3/notes/':m.API===2?'/v2/notes/':'/v1/notes/')+encodeURIComponent(m.NOTE_ID)+'?page='+(m.PAGE||0),null,function(e,value){
      if(seq!==activeRequest)return;if(e){error(e.message,seq);return;}
      if(value.rich){
        send({TYPE:12,REQUEST:seq,TITLE:value.title,PARENT_ID:value.parent,PINNED:value.pinned?1:0,REVISION:value.revision,PAGE:value.offset,TOTAL:value.total,COUNT:value.blocks.length});
        value.blocks.forEach(function(b,i){send({TYPE:13,REQUEST:seq,INDEX:i,ITEM_ID:b.id,TEXT:b.text,ENTRY_KIND:b.kind==='task'?1:b.kind==='image'?2:0,CHECKED:b.checked?1:0});});
        send({TYPE:14,REQUEST:seq});return;
      }
      send({TYPE:4,REQUEST:seq,TITLE:value.title,TEXT:value.text,PAGE:value.page,COUNT:value.pages,PARENT_ID:value.parent||'',PINNED:value.pinned?1:0});
    });
  }
});
setInterval(pump,15000);
function configurationURL(){
  var saved=JSON.stringify(config||{}).replace(/</g,'\\u003c');
  var pendingText=JSON.stringify(delivery?delivery.pending().map(function(n){return (n.targetId?'[Append to existing note]\n':'')+n.text;}).join('\n\n—\n\n'):'Pending notes could not be loaded.').replace(/</g,'\\u003c');
  var html='<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Notesy Settings</title><style>body{font:17px -apple-system,sans-serif;max-width:34rem;margin:auto;padding:22px;background:#f5f5f4;color:#222}textarea,button,select{font:inherit;width:100%;box-sizing:border-box;padding:12px;margin:10px 0}textarea{height:160px;font-size:13px}label{display:block;margin:16px 0}button{background:#285f47;color:white;border:0;border-radius:8px}</style><h1>Notesy</h1><p>On your Mac, open Organik Apps Pebble Connector → Notesy → Connect Phone. Copy the pairing details from the QR page and paste below.</p><textarea id="pair" aria-label="Pairing details" placeholder="Paste pairing details"></textarea><button id="test">Test connection</button><p id="status"></p><h2>Hidden folders</h2><details><summary>Choose folders to hide</summary><p>Hide folders from browsing, pins and search. Notes and attachments stay in your vault.</p><button id="folders-load">Load folders</button><label>Find a loaded folder<input id="folder-filter" type="search"></label><div id="folder-tree"></div><button id="folders-apply">Apply hidden folders</button><p id="folder-status"></p></details><h2>Why two dictation options?</h2><p>Pebble limits each recording to 15 seconds. Notesy cannot extend that limit, so Stitch lets you capture a longer thought in sections.</p><ul><li><strong>Quick Dictate:</strong> one short thought, up to 15 seconds.</li><li><strong>Stitch:</strong> a longer note made from multiple recordings, each up to 15 seconds.</li></ul><p>Both work for new notes and appending. In Stitch, press Select to accept each section. It saves before the next recording starts, so expect a brief pause. Press Back to finish; accepted sections are kept. If Back returns you from review to listening, press Back again to exit.</p><h2>Button shortcuts</h2><details><summary>Customize watch buttons</summary><div id="buttons"></div></details><h2>Appearance</h2><label>Long menu titles<select id="marquee-speed"><option value="0">Off</option><option value="15">Slow</option><option value="30">Normal</option><option value="60">Fast</option><option value="90">Very fast</option></select></label><label>Preset<select id="appearance-preset"></select></label><label>Font<select id="appearance-font"></select></label><label>Font size<select id="appearance-size"></select></label><label>Background<input type="color" id="appearance-background"></label><label>Text<input type="color" id="appearance-text"></label><label>Selection<input type="color" id="appearance-selection"></label><label><input id="auto" type="checkbox"> Start Quick Dictate when the app opens</label><button id="save">Save settings</button><script>var saved='+saved+';var pair=document.getElementById("pair"),statusLabel=document.getElementById("status");pair.value=saved.gatewayURL?JSON.stringify({gatewayURL:saved.gatewayURL,gatewayToken:saved.gatewayToken,vaultId:saved.vaultId,browserId:saved.browserId,root:saved.root}):"";document.getElementById("auto").checked=!!saved.autoDictate;function read(){var c=JSON.parse(pair.value);c.gatewayURL=c.gatewayURL.replace(/\\/$/,"");if(!/^https:\\/\\/[a-z0-9.-]+\\.ts\\.net(?::\\d+)?$/i.test(c.gatewayURL)||typeof c.gatewayToken!=="string"||c.gatewayToken.length<32)throw Error("Paste the complete pairing details from your Mac.");return c;}var tested=null;document.getElementById("test").onclick=function(){try{var c=read();statusLabel.textContent="Connecting…";var x=new XMLHttpRequest();x.open("GET",c.gatewayURL+"/v1/health");x.setRequestHeader("Authorization","Bearer "+c.gatewayToken);x.timeout=10000;x.onload=function(){try{var j=JSON.parse(x.responseText);if(x.status!==200||j.service!=="StoneNotes")throw Error(j.error||"Connection failed.");c.vaultId=j.vaultId;c.browserId=j.browserId;c.root=j.root;pair.value=JSON.stringify(c);tested=pair.value;statusLabel.textContent="Connected to your vault.";}catch(e){statusLabel.textContent=e.message;}};x.onerror=x.ontimeout=function(){statusLabel.textContent="Cannot reach your Mac. Check Tailscale and the connector.";};x.send();}catch(e){statusLabel.textContent=e.message;}};document.getElementById("save").onclick=function(){try{var c=read();if(!/^[a-f0-9]{64}$/.test(c.vaultId))throw Error("Test the connection before saving.");c.marqueeSpeed=Number(document.getElementById("marquee-speed").value);c.appearance=readAppearance();c.buttons=readButtons();c.autoDictate=document.getElementById("auto").checked;location.href="pebblejs://close#"+encodeURIComponent(JSON.stringify(c));}catch(e){statusLabel.textContent=e.message;}};</script></html>';
  html=html.replace('<button id="save">','<details><summary>Pending notes on this phone</summary><p>If your vault or Mac connection changes, you can copy these notes here.</p><textarea id="pending" readonly aria-label="Pending note text"></textarea></details><button id="save">');
  html=html.replace('var tested=null;', 'var readAppearance=('+Themes.setup.toString()+')('+JSON.stringify(Themes.normalize(config,enhanced()))+','+JSON.stringify(Themes.presets(enhanced()))+','+JSON.stringify(Themes.sizes)+');var tested=null;');
  html=html.replace('var tested=null;', 'var readButtons=('+Buttons.setup.toString()+')('+JSON.stringify(Buttons.normalize(config&&config.buttons))+');var tested=null;');
  html=html.replace('</script>', '('+Folders.setup.toString()+')(read);</script>');
  html=html.replace('</script>', 'document.getElementById("marquee-speed").value='+marqueeSpeed(config&&config.marqueeSpeed)+';</script>');
  html=html.replace('</script>', 'document.getElementById("pending").value='+pendingText+';</script>');
  return 'data:text/html;charset=utf-8,'+encodeURIComponent(html);
}
Pebble.addEventListener('showConfiguration',function(){Pebble.openURL(configurationURL());});
Pebble.addEventListener('webviewclosed',function(event){
  if(!event.response||event.response==='CANCELLED')return;
  try{var c=JSON.parse(decodeURIComponent(event.response));if(!valid(c))throw Error('Invalid pairing details.');if(config&&c.gatewayURL===config.gatewayURL&&c.vaultId===config.vaultId&&!c.browserId){c.browserId=config.browserId;c.root=config.root;}localStorage.setItem('stonenotes.config',JSON.stringify(c));config=c;send(settingsMessage());pump();}catch(e){error('Settings were not saved. Check the pairing details.');}
});
