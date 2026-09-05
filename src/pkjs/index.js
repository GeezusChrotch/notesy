/* global Pebble, localStorage, XMLHttpRequest */
'use strict';
var Delivery = require('./delivery');
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
  if(!valid(c)){callback(Error('Pair StoneNotes in phone Settings.'));return;}
  var xhr=new XMLHttpRequest(),finished=false;
  function finish(e,v){if(finished)return;finished=true;callback(e,v);}
  xhr.open(method,c.gatewayURL+route,true);xhr.timeout=10000;
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
  delivery=new Delivery(localStorage,function(c,note,cb){request(c,'POST','/v1/notes',note,cb);},function(state,id,message){
    send({TYPE:state==='saved'?8:state==='queued'?7:5,NOTE_ID:id,TEXT:state==='saved'?'Saved to vault':state==='queued'?'On phone · waiting for Mac':message||'Waiting for Mac'});
    if(state==='saved')setTimeout(pump,400);
  });
} catch(e) { error('Phone storage could not load pending notes. Your watch draft is kept.'); }
function pump(){if(delivery)delivery.pump(config);}
Pebble.addEventListener('ready',function(){send({TYPE:6,THEME:config?config.theme||0:0,AUTO:config&&config.autoDictate?1:0});pump();});
Pebble.addEventListener('appmessage',function(event){
  var m=event.payload,seq=m.REQUEST||0;
  if(m.COMMAND===3){
    if(!delivery){error('Phone storage unavailable. Your draft is kept.',seq);return;}
    try{delivery.enqueue(m.NOTE_ID,m.TEXT,config);pump();}catch(e){error(e.message,seq);}return;
  }
  if(m.COMMAND===4){pump();return;}
  activeRequest=seq;
  if(m.COMMAND===1){
    request(config,'GET','/v1/notes?offset='+(m.PAGE||0),null,function(e,value){
      if(seq!==activeRequest)return;if(e){error(e.message,seq);return;}
      send({TYPE:1,REQUEST:seq,COUNT:value.notes.length,PAGE:value.next===null?-1:value.next});
      value.notes.forEach(function(n,i){send({TYPE:2,REQUEST:seq,INDEX:i,NOTE_ID:n.id,TITLE:n.title});});
      send({TYPE:3,REQUEST:seq});
    });
  }else if(m.COMMAND===2){
    request(config,'GET','/v1/notes/'+encodeURIComponent(m.NOTE_ID)+'?page='+(m.PAGE||0),null,function(e,value){
      if(seq!==activeRequest)return;if(e){error(e.message,seq);return;}
      send({TYPE:4,REQUEST:seq,TITLE:value.title,TEXT:value.text,PAGE:value.page,COUNT:value.pages});
    });
  }
});
setInterval(pump,15000);
function configurationURL(){
  var saved=JSON.stringify(config||{}).replace(/</g,'\\u003c');
  var pendingText=JSON.stringify(delivery?delivery.pending().map(function(n){return n.text;}).join('\n\n—\n\n'):'Pending notes could not be loaded.').replace(/</g,'\\u003c');
  var html='<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><title>StoneNotes Settings</title><style>body{font:17px -apple-system,sans-serif;max-width:34rem;margin:auto;padding:22px;background:#f5f5f4;color:#222}textarea,button,select{font:inherit;width:100%;box-sizing:border-box;padding:12px;margin:10px 0}textarea{height:160px;font-size:13px}label{display:block;margin:16px 0}button{background:#285f47;color:white;border:0;border-radius:8px}</style><h1>StoneNotes</h1><p>On your Mac, open Organik Apps Pebble Connector → StoneNotes → Connect Phone. Copy the pairing details from the QR page and paste below.</p><textarea id="pair" aria-label="Pairing details" placeholder="Paste pairing details"></textarea><button id="test">Test connection</button><p id="status"></p><label>Appearance<select id="theme"><option value="0">Paper</option><option value="1">Forest</option><option value="2">Midnight</option></select></label><label><input id="auto" type="checkbox"> Start dictation when the app opens</label><button id="save">Save settings</button><script>var saved='+saved+';var pair=document.getElementById("pair"),statusLabel=document.getElementById("status");pair.value=saved.gatewayURL?JSON.stringify({gatewayURL:saved.gatewayURL,gatewayToken:saved.gatewayToken,vaultId:saved.vaultId}):"";document.getElementById("theme").value=saved.theme||0;document.getElementById("auto").checked=!!saved.autoDictate;function read(){var c=JSON.parse(pair.value);c.gatewayURL=c.gatewayURL.replace(/\\/$/,"");if(!/^https:\\/\\/[a-z0-9.-]+\\.ts\\.net(?::\\d+)?$/i.test(c.gatewayURL)||typeof c.gatewayToken!=="string"||c.gatewayToken.length<32)throw Error("Paste the complete pairing details from your Mac.");return c;}var tested=null;document.getElementById("test").onclick=function(){try{var c=read();statusLabel.textContent="Connecting…";var x=new XMLHttpRequest();x.open("GET",c.gatewayURL+"/v1/health");x.setRequestHeader("Authorization","Bearer "+c.gatewayToken);x.timeout=10000;x.onload=function(){try{var j=JSON.parse(x.responseText);if(x.status!==200||j.service!=="StoneNotes")throw Error(j.error||"Connection failed.");c.vaultId=j.vaultId;pair.value=JSON.stringify(c);tested=pair.value;statusLabel.textContent="Connected to your Pebble notes folder.";}catch(e){statusLabel.textContent=e.message;}};x.onerror=x.ontimeout=function(){statusLabel.textContent="Cannot reach your Mac. Check Tailscale and the connector.";};x.send();}catch(e){statusLabel.textContent=e.message;}};document.getElementById("save").onclick=function(){try{var c=read();if(!/^[a-f0-9]{64}$/.test(c.vaultId))throw Error("Test the connection before saving.");c.theme=Number(document.getElementById("theme").value);c.autoDictate=document.getElementById("auto").checked;location.href="pebblejs://close#"+encodeURIComponent(JSON.stringify(c));}catch(e){statusLabel.textContent=e.message;}};</script></html>';
  html=html.replace('<button id="save">','<details><summary>Pending notes on this phone</summary><p>If your vault or Mac connection changes, you can copy these notes here.</p><textarea id="pending" readonly aria-label="Pending note text"></textarea></details><button id="save">');
  html=html.replace('</script>', 'document.getElementById("pending").value='+pendingText+';</script>');
  return 'data:text/html;charset=utf-8,'+encodeURIComponent(html);
}
Pebble.addEventListener('showConfiguration',function(){Pebble.openURL(configurationURL());});
Pebble.addEventListener('webviewclosed',function(event){
  if(!event.response||event.response==='CANCELLED')return;
  try{var c=JSON.parse(decodeURIComponent(event.response));if(!valid(c))throw Error('Invalid pairing details.');localStorage.setItem('stonenotes.config',JSON.stringify(c));config=c;send({TYPE:6,THEME:c.theme||0,AUTO:c.autoDictate?1:0});pump();}catch(e){error('Settings were not saved. Check the pairing details.');}
});
