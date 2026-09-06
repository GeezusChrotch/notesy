// BEGIN ORGANIK SETTINGS UI
// Organik settings UI v1. Vendored by sync.py; no network or storage dependencies.
function organikSettingsHTML(html, options) {
  var script = '(' + organikSettingsClient.toString() + ')(' + JSON.stringify(options).replace(/</g, '\\u003c') + ');';
  // Run after the app's own controls and event handlers have been initialized.
  var at = html.lastIndexOf('</script>');
  return html.slice(0, at) + ';' + script + html.slice(at);
}
function organikSettingsClient(options) {
  var d = document, app = options.app;
  function id(name) { return d.getElementById(name); }
  function all(selector, root) { return Array.prototype.slice.call((root || d).querySelectorAll(selector)); }
  function el(tag, text, cls) { var n = d.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; }
  function button(text, fn) { var b = el('button', text); b.type = 'button'; b.onclick = fn; return b; }
  var style = el('style');
  style.textContent = 'html{color-scheme:light}*{box-sizing:border-box}body{font:17px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;background:#f2f2f7!important;color:#111!important;margin:0 auto!important;padding:20px 20px 40px!important;max-width:620px!important;line-height:1.45}.wrap{padding:0!important}h1{font-size:28px!important;color:#111!important;margin:4px 0 16px!important}h2{font-size:20px!important;margin:24px 0 12px}h3{font-size:17px}p,.hint{color:#61616b!important;font-size:14px;line-height:1.45}label{display:block;font-weight:600;margin:14px 0 6px}input,select,textarea{font:16px -apple-system,sans-serif!important;width:100%;min-width:0;padding:13px!important;border:1px solid #bbb!important;border-radius:10px!important;background:#fff!important;color:#111!important;margin:8px 0 16px!important}textarea{min-height:130px}input[type=checkbox]{width:auto!important;margin:0 10px 0 0!important;accent-color:#34a853}button{font:600 16px -apple-system,sans-serif!important;min-height:44px;padding:13px!important;border:0;border-radius:10px!important;background:#34a853;color:white;cursor:pointer}button:disabled{opacity:.5;cursor:default}button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:3px solid #0878d1;outline-offset:3px}.secondary,.palette-done{background:#e5e5ea!important;color:#111!important}.danger{background:#fff!important;color:#b42318!important;border:1px solid #d7d7dc!important}.card,.theme-card,.threads,details{background:white;border:1px solid #d7d7dc;border-radius:12px;padding:14px;margin:12px 0 20px}.card h2{margin-top:0}.organik-tabs{display:flex!important;gap:3px!important;padding:3px!important;background:#dedee3!important;border-radius:11px!important;margin:0 0 22px!important;position:static!important;overflow-x:auto}.organik-tabs button{flex:1;min-width:max-content;width:auto!important;font-size:14px!important;min-height:44px;padding:9px 12px!important;background:transparent!important;color:#555!important}.organik-tabs button[aria-selected=true]{background:white!important;color:#111!important;box-shadow:0 1px 3px #aaa}.organik-panel{padding:0!important}.organik-panel[hidden]{display:none!important}.organik-help{background:#fff7df;border:1px solid #e3bd5c;border-radius:12px;padding:13px;color:#604500!important;font-size:14px}.organik-preview{width:216px!important;height:244px!important;margin:16px auto 24px!important;border:8px solid #252525!important;border-radius:24px!important;overflow:hidden!important;padding:8px!important;box-shadow:0 8px 22px #ccc;line-height:1.2}.organik-preview .preview-row{padding:10px 4px;display:block;height:auto;min-height:47px}.organik-preview small{font:14px/1.3 Arial,sans-serif}.organik-palette-trigger{width:100%;height:58px;display:flex;align-items:center;gap:12px;background:white!important;color:#111!important;border:1px solid #bbb!important;margin:8px 0 16px;text-align:left}.organik-swatch{width:36px;height:36px;border-radius:7px;border:1px solid #888;flex:none}.organik-color-value{font:15px ui-monospace,monospace}.organik-overlay{position:fixed;inset:0;background:#0008;z-index:30;display:flex;align-items:center;justify-content:center;padding:14px}.organik-overlay[hidden]{display:none}.organik-dialog{background:#f2f2f7;border-radius:16px;padding:16px;max-width:390px;width:100%;max-height:90vh;overflow:auto}.organik-dialog h2{margin-top:0}.organik-colors{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:5px}.organik-colors button{min-height:32px;height:38px;padding:0!important;border:1px solid #888;border-radius:7px!important}.organik-colors button[aria-pressed=true]{outline:3px solid #0878d1;outline-offset:1px}.organik-dialog>button{width:100%;margin-top:16px}.organik-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}.organik-apply{background:#0878d1!important;color:white!important;width:100%;margin:14px 0}.error,[role=alert]{color:#b42318!important}.emoji-picker-card{background:#f2f2f7!important}.emoji-choice,.emoji-grid button{background:#fff!important;color:#111!important}.emoji-slot{grid-template-columns:28px minmax(0,1fr) 40px 40px}.emoji-slot button{padding:6px!important}.button-grid,.row,.grid,.swatches{min-width:0}.button-grid>*,.row>*,.grid>*,.swatches>*{min-width:0}@media(max-width:380px){body{padding:16px 12px 32px!important}.button-grid,.swatches{grid-template-columns:1fr!important}.organik-tabs button{padding:9px!important}}';
  d.body.setAttribute('data-organik-app',app);
  style.textContent += '[data-organik-app=pome] .organik-preview{padding:0!important}[data-organik-app=pome] .organik-preview .preview-row{display:flex;padding:0 3px 0 6px;min-height:0}';
  d.head.appendChild(style);
  var panels = {}, tabs, host = app === 'beepster' ? id('form') : d.body;
  function panel(name, title) { var p = el('section', '', 'organik-panel'); p.id = 'organik-' + name; p.setAttribute('aria-label', title); panels[name] = p; host.appendChild(p); return p; }
  function move(n, p) { if (n) p.appendChild(n); }
  function split(root, mapping, initial) {
    var dest = initial;
    Array.prototype.slice.call(root.children).forEach(function(n) {
      if (n.tagName === 'SCRIPT' || n.tagName === 'STYLE' || n.tagName === 'H1' || n === tabs || n.classList.contains('organik-panel')) return;
      if (n.tagName === 'H2' && mapping[n.textContent]) dest = mapping[n.textContent];
      move(n, panels[dest]);
    });
  }
  if (app === 'pome' || app === 'tesla') {
    ['setup','themes','shortcuts'].forEach(function(name) { panels[name] = id(name + 'Panel'); panels[name].classList.add('organik-panel'); });
    tabs = d.querySelector('.tabs');
    if (app === 'tesla') { var title = el('h1', 'Gandalf+Gilda'); d.body.insertBefore(title, tabs); }
  } else {
    tabs = el('nav');
    panel('setup', 'Setup'); panel('themes', 'Themes');
    if (app !== 'pebclaw') panel('shortcuts', 'Shortcuts');
    if (app === 'notesy') panel('vault', 'Vault');
    if (app === 'beepster') panel('replies', 'Replies');
    var heading = d.querySelector('h1'); heading.parentNode.insertBefore(tabs, heading.nextSibling);
    if (app === 'notesy') {
      var save = id('save'), status = id('status'), pending = id('pending').parentNode;
      split(d.body, {'Sorting':'vault','Hidden folders':'vault','Dictation':'shortcuts','Button shortcuts':'shortcuts','Appearance':'themes'}, 'setup');
      move(id('auto').parentNode, panels.shortcuts); move(pending, panels.vault);
      d.body.appendChild(save); d.body.appendChild(status);
    } else if (app === 'reminderz') {
      all('body > .card').forEach(function(n) { var title = n.querySelector('h2').textContent; move(n, panels[title === 'Theme' ? 'themes' : title === 'Button actions' ? 'shortcuts' : 'setup']); });
      // Keep the original save action and status reachable from every tab.
      var save = all('body > button').filter(function(n) { return n.getAttribute('onclick') === 'save()'; })[0];
      move(save, d.body); move(id('status'), d.body);
    } else if (app === 'pebclaw') {
      var save = all('body > button').filter(function(n) { return n.getAttribute('onclick') === 'save()'; })[0];
      split(d.body, {'Appearance':'themes'}, 'setup'); d.body.appendChild(save); move(id('status'), d.body);
    } else {
      var oldTabs = id('generalTab').parentNode; oldTabs.parentNode.removeChild(oldTabs);
      split(id('generalPanel'), {'Saved themes':'themes','Theme editor':'themes','Quick replies':'replies','Emoji replies':'replies','Included services':'setup'}, 'setup');
      while (id('buttonsPanel').firstChild) move(id('buttonsPanel').firstChild, panels.shortcuts);
      move(id('pairing'), panels.setup);
      id('generalPanel').remove(); id('buttonsPanel').remove();
      host.appendChild(id('save')); host.appendChild(id('status'));
    }
  }
  tabs.className = 'organik-tabs'; tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Settings sections'); tabs.innerHTML = '';
  var keys = Object.keys(panels);
  function show(name, focus) {
    keys.forEach(function(key) { var selected = key === name, b = id('organik-tab-' + key), p = panels[key]; p.hidden = !selected; p.classList.toggle('active', selected); p.classList.remove('hidden'); b.setAttribute('aria-selected', String(selected)); b.tabIndex = selected ? 0 : -1; });
    if (focus) id('organik-tab-' + name).focus();
  }
  keys.forEach(function(name, index) {
    var b = button(name.charAt(0).toUpperCase() + name.slice(1), function() { show(name); }); b.id = 'organik-tab-' + name; b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', panels[name].id);
    panels[name].setAttribute('role', 'tabpanel'); panels[name].setAttribute('aria-labelledby', b.id);
    b.onkeydown = function(e) { var i = index; if (e.key === 'ArrowRight') i = (i + 1) % keys.length; else if (e.key === 'ArrowLeft') i = (i + keys.length - 1) % keys.length; else if (e.key === 'Home') i = 0; else if (e.key === 'End') i = keys.length - 1; else return; e.preventDefault(); show(keys[i], true); }; tabs.appendChild(b);
  });
  // Reveal validation errors and expired pairing even when another tab is open.
  var observer = new MutationObserver(function() { all('.error,#buttonError,#status,#folder-status').forEach(function(n) { if (!n.textContent || !/error|failed|cannot|could not|keep move|expired|enter the current/i.test(n.textContent)) return; keys.forEach(function(key) { if (panels[key].contains(n)) show(key); }); }); if (id('pairing') && !id('pairing').classList.contains('hidden') && app === 'beepster') show('setup'); });
  ['status','buttonError','pairing'].forEach(function(name) { if(id(name)) observer.observe(id(name), {childList:true,subtree:true,attributes:true,attributeFilter:['class']}); });
  show('setup');
  all('label').forEach(function(label, i) { if (label.querySelector('input,select,textarea') || label.htmlFor) return; var next = label.nextElementSibling; if (next && /^(INPUT|SELECT|TEXTAREA)$/.test(next.tagName)) { if (!next.id) next.id = 'organik-control-' + i; label.htmlFor = next.id; } });
  all('#status,#buttonError,#folder-status').forEach(function(n) { n.setAttribute('role','status'); n.setAttribute('aria-live','polite'); });
  var themePanel = panels.themes;
  if (app !== 'pome') themePanel.insertBefore(el('p', 'Choose a preset or edit your own colors, font and size. The preview updates as you edit. Save and apply sends your settings to the watch.', 'organik-help'), themePanel.firstChild);
  var preview = id('preview');
  if (!preview) { preview = el('div'); preview.id = 'preview'; preview.innerHTML = '<div class="preview-title">Notesy</div><div class="preview-row selected">Meeting notes<small><br>Today · Pebble</small></div><div class="preview-row">Ideas<small><br>Capture a thought</small></div><div class="preview-row">Shopping list</div>'; }
  if(app==='pebclaw')preview.innerHTML='<strong>PebClaw</strong><div class=preview-row>You: What is next?</div><div class=preview-row>Agent: Review notes.</div>';
  preview.classList.add('organik-preview'); preview.setAttribute('aria-label', 'Watch theme preview'); themePanel.insertBefore(preview, themePanel.children[1] || null);
  var map = options.fields || {}, raw = [], watch = options.watchColors;
  for (var c = 0; c < 64; c++) raw.push('#' + [Math.floor(c/16),Math.floor(c/4)%4,c%4].map(function(v) { var s=(v*85).toString(16);return s.length<2?'0'+s:s; }).join(''));
  function colorIndex(hex) { if (!/^#[0-9a-f]{6}$/i.test(hex)) return 0; return Math.round(parseInt(hex.slice(1,3),16)/85)*16 + Math.round(parseInt(hex.slice(3,5),16)/85)*4 + Math.round(parseInt(hex.slice(5,7),16)/85); }
  function display(hex) { return watch[colorIndex(hex)]; }
  function value(key) { return id(map[key]) && id(map[key]).value; }
  function fire(control) { ['input','change'].forEach(function(type) { var e = d.createEvent('HTMLEvents'); e.initEvent(type, true, false); control.dispatchEvent(e); }); }
  var swatches = [];
  function refresh() {
    swatches.forEach(function(s) { s.swatch.style.background = display(s.input.value); s.value.textContent = s.input.value.toUpperCase(); });
    if (app === 'pome') {window.preview();return;}
    var text = value('text') || '#000000', bg = value('background') || '#ffffff', selected = value('selection') || value('accent') || '#000000';
    preview.style.color = display(text); preview.style.background = display(bg);
    var font = value('font'), families = {inter:'Inter,Arial,sans-serif',roboto:'Roboto,Arial,sans-serif','open-sans':'Open Sans,Arial,sans-serif',montserrat:'Montserrat,Arial,sans-serif',poppins:'Poppins,Arial,sans-serif','droid-serif':'Georgia,serif','3':'Georgia,serif','roboto-condensed':'Arial Narrow,Arial,sans-serif'};
    preview.style.fontFamily = families[font] || 'Arial,sans-serif'; preview.style.fontWeight = /^(gothic-bold|droid-serif|bitham-black|1|3|4)$/.test(font) ? '700' : '400'; preview.style.fontSize = (Number(value('size')) || 22) + 'px';
    all('.selected', preview).forEach(function(row) { row.style.background=display(selected); var h=display(selected), luminance=parseInt(h.slice(1,3),16)*299+parseInt(h.slice(3,5),16)*587+parseInt(h.slice(5,7),16)*114; row.style.color=luminance>=150000?'#000':'#fff'; });
    var muted=preview.querySelector('.preview-muted'), accent=preview.querySelector('.preview-button'); if(muted) muted.style.color=display(value('muted')||text); if(accent) {accent.style.background=display(selected);accent.style.color=display(value('accentText')||'#ffffff');}
  }
  var overlay = el('div','','organik-overlay'), dialog = el('div','','organik-dialog'), grid=el('div','','organik-colors'), target=null, returnFocus=null;
  overlay.hidden=true; dialog.setAttribute('role','dialog'); dialog.setAttribute('aria-modal','true'); dialog.setAttribute('aria-label','Choose a Pebble color'); dialog.appendChild(el('h2','Choose a Pebble color')); dialog.appendChild(grid);
  function close() {overlay.hidden=true;if(returnFocus)returnFocus.focus();}
  dialog.appendChild(button('Done',close)); overlay.appendChild(dialog); d.body.appendChild(overlay);
  raw.forEach(function(hex,index) {var b=button('',function(){target.value=hex;fire(target);refresh();close();});b.style.background=watch[index];b.setAttribute('aria-label','Pebble color '+hex.toUpperCase());b.dataset.color=hex;grid.appendChild(b);});
  overlay.onclick=function(e){if(e.target===overlay)close();}; overlay.onkeydown=function(e){if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){var bs=all('button',dialog),first=bs[0],last=bs[bs.length-1];if(e.shiftKey&&d.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&d.activeElement===last){e.preventDefault();first.focus();}}};
  Object.keys(map).forEach(function(key){if(['font','size'].indexOf(key)>=0)return;var input=id(map[key]);if(!input)return;
    if(input.tagName==='SELECT') { var selected=input.value; raw.forEach(function(hex){if(!all('option',input).some(function(o){return o.value.toLowerCase()===hex;})){var option=el('option',hex.toUpperCase());option.value=hex;input.appendChild(option);}});input.value=selected; }
    // Keep original form controls as the source of truth; the palette changes them through normal events.
    var previous=input.previousElementSibling;if(previous&&previous.classList.contains('palette-trigger')){previous.hidden=true;previous.style.setProperty('display','none','important');}
    input.hidden=true; input.style.setProperty('display','none','important');
    var b=button('',function(){target=input;returnFocus=b;all('button',grid).forEach(function(o){o.setAttribute('aria-pressed',String(o.dataset.color===raw[colorIndex(input.value)]));});overlay.hidden=false;grid.children[colorIndex(input.value)].focus();});b.className='organik-palette-trigger';b.setAttribute('aria-label','Choose '+key.replace(/([A-Z])/g,' $1').toLowerCase()+' color');var swatch=el('span','','organik-swatch'),label=el('span','','organik-color-value');b.appendChild(swatch);b.appendChild(label);input.parentNode.insertBefore(b,input.nextSibling);swatches.push({input:input,swatch:swatch,value:label});
  });
  if(app==='reminderz'){var preset=id('preset'),custom=el('option','Custom');custom.value='custom';custom.disabled=true;preset.appendChild(custom);themePanel.addEventListener('change',function(e){if(Object.keys(map).some(function(k){return map[k]===e.target.id;}))preset.value='custom';});}
  themePanel.addEventListener('input',refresh);themePanel.addEventListener('change',refresh);themePanel.addEventListener('click',function(){setTimeout(refresh,0);});
  // Older apps have presets but no custom library. Store only appearance fields in the app callback.
  if(options.library) {
    var library=Array.isArray(options.savedThemes)?options.savedThemes.slice(0,20):[],card=el('div','','theme-card'),menu=el('select'),name=el('input');menu.id='organik-saved-theme';name.id='organik-theme-name';name.maxLength=32;name.placeholder='My theme';
    var label=el('label','Saved custom themes');label.htmlFor=menu.id;card.appendChild(label);card.appendChild(menu);label=el('label','Theme name');label.htmlFor=name.id;card.appendChild(label);card.appendChild(name);
    function renderLibrary(){menu.innerHTML='';var o=el('option','Current preview');o.value='';menu.appendChild(o);library.forEach(function(t,i){var o=el('option',t.name);o.value=i;menu.appendChild(o);});}
    function readLibraryTheme(){var t={name:name.value.trim()||'My theme'};Object.keys(map).forEach(function(k){t[k]=value(k);});return t;}
    function setControl(input,v){if(!input)return;if(input.tagName==='SELECT'&&!all('option',input).some(function(o){return o.value===String(v)&&!o.disabled;}))return;input.value=v;fire(input);}
    menu.onchange=function(){if(menu.value==='')return;var t=library[Number(menu.value)];name.value=t.name;Object.keys(map).forEach(function(k){if(k==='size')return;var input=id(map[k]);if(input&&t[k]!==undefined){setControl(input,t[k]);}});if(id(map.size)){setControl(id(map.size),t.size);}refresh();};
    var row=el('div','','organik-actions');row.appendChild(button('Save custom theme',function(){var t=readLibraryTheme(),found=-1;library.forEach(function(v,i){if(v.name.toLowerCase()===t.name.toLowerCase())found=i;});if(found<0&&library.length>=20){alert('You can save up to 20 custom themes. Delete one first.');return;}if(found<0){library.push(t);found=library.length-1;}else library[found]=t;renderLibrary();menu.value=String(found);}));var remove=button('Delete custom theme',function(){if(menu.value==='')return;library.splice(Number(menu.value),1);renderLibrary();});remove.className='danger';row.appendChild(remove);card.appendChild(row);card.appendChild(el('p','Custom themes are kept on this phone when you save and apply settings. Built-in presets remain available below.'));renderLibrary();themePanel.insertBefore(card,preview.nextSibling);
    window.organikSavedThemes=function(){return library;};
  }
  if(options.apply) {var mainSave=id('save') || all('body > button').filter(function(n){return n.getAttribute('onclick')==='save()';})[0]; if(mainSave){mainSave.classList.add('organik-apply');if(app!=='beepster')mainSave.textContent='Save & Apply to Watch';}}
  refresh();
}

// END ORGANIK SETTINGS UI
/* global Pebble, localStorage, XMLHttpRequest */
'use strict';
var Delivery = require('./delivery');
var Themes = require('./themes');
var Buttons = require('./buttons');
var Sorting = require('./sorting');
var Folders = require('./folders');
function enhanced(){try{return Pebble.getActiveWatchInfo().platform==='emery';}catch(e){return false;}}
function marqueeSpeed(value){return [0,15,30,60,90].indexOf(value)>=0?value:30;}
function settingsMessage(){var m=Themes.message(config,enhanced());m.MARQUEE_SPEED=marqueeSpeed(config&&config.marqueeSpeed);m.BUTTONS=Buttons.normalize(config&&config.buttons).join(',');m.SORT=Sorting.normalize(config&&config.sort);m.TAG=config&&config.tag||'';m.API=config&&config.browserId?2:1;m.VAULT_ID=config&&config.browserId||'';m.FOLDER_ID=config&&config.root||'';return m;}
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
  if(m.COMMAND===1||m.COMMAND===7||m.COMMAND===10){
    var sort=Sorting.normalize(m.SORT===undefined?config&&config.sort:m.SORT),tag=m.TAG||'';
    var route=m.COMMAND===7?'/v2/search?q='+encodeURIComponent(m.TEXT||''):m.COMMAND===10?'/v3/tags?folder='+encodeURIComponent(m.FOLDER_ID||''):m.API===2?'/v3/browse?folder='+encodeURIComponent(m.FOLDER_ID||'')+'&sort='+['name','modified','created','tag'][sort]+'&tag='+encodeURIComponent(tag):'/v1/notes?';
    route+='&offset='+(m.PAGE||0)+'&snapshot='+encodeURIComponent(m.SNAPSHOT||'');
    request(config,'GET',route,null,function(e,value){
      if(seq!==activeRequest)return;if(e){error(e.message,seq);return;}
      if(m.COMMAND===1&&m.SORT!==undefined){config.sort=sort;config.tag=tag;try{localStorage.setItem('stonenotes.config',JSON.stringify(config));}catch(_){}}
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
  var html='<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Notesy Settings</title><style>body{font:17px -apple-system,sans-serif;max-width:34rem;margin:auto;padding:22px;background:#f5f5f4;color:#222}textarea,button,select{font:inherit;width:100%;box-sizing:border-box;padding:12px;margin:10px 0}textarea{height:160px;font-size:13px}label{display:block;margin:16px 0}button{background:#285f47;color:white;border:0;border-radius:8px}</style><h1>Notesy</h1><p>On your Mac, open Organik Apps Pebble Connector → Notesy → Connect Phone. Copy the pairing details from the QR page and paste below.</p><textarea id="pair" aria-label="Pairing details" placeholder="Paste pairing details"></textarea><button id="test">Test connection</button><p id="status"></p><h2>Sorting</h2><div id="sorting"></div><h2>Hidden folders</h2><div id="vault-folders"><p>Hide folders from browsing, pins and search. Notes and attachments stay in your vault.</p><button id="folders-load">Load folders</button><label>Find a loaded folder<input id="folder-filter" type="search"></label><div id="folder-tree"></div><button id="folders-apply">Apply hidden folders</button><p id="folder-status"></p></div><h2>Dictation</h2><ul><li><strong>Quick Dictate:</strong> one recording, up to 15 seconds.</li><li><strong>Stitch:</strong> combine 15-second recordings. Select keeps each section; Back finishes.</li></ul><p>Both can create or append to a note. Accepted sections are kept.</p><h2>Button shortcuts</h2><div id="buttons"></div><h2>Appearance</h2><label>Long menu titles<select id="marquee-speed"><option value="0">Off</option><option value="15">Slow</option><option value="30">Normal</option><option value="60">Fast</option><option value="90">Very fast</option></select></label><label>Preset<select id="appearance-preset"></select></label><label>Font<select id="appearance-font"></select></label><label>Font size<select id="appearance-size"></select></label><label>Background<input type="color" id="appearance-background"></label><label>Text<input type="color" id="appearance-text"></label><label>Selection<input type="color" id="appearance-selection"></label><label><input id="auto" type="checkbox"> Start Quick Dictate when the app opens</label><button id="save">Save settings</button><script>var saved='+saved+';var pair=document.getElementById("pair"),statusLabel=document.getElementById("status");pair.value=saved.gatewayURL?JSON.stringify({gatewayURL:saved.gatewayURL,gatewayToken:saved.gatewayToken,vaultId:saved.vaultId,browserId:saved.browserId,root:saved.root}):"";document.getElementById("auto").checked=!!saved.autoDictate;function read(){var c=JSON.parse(pair.value);c.gatewayURL=c.gatewayURL.replace(/\\/$/,"");if(!/^https:\\/\\/[a-z0-9.-]+\\.ts\\.net(?::\\d+)?$/i.test(c.gatewayURL)||typeof c.gatewayToken!=="string"||c.gatewayToken.length<32)throw Error("Paste the complete pairing details from your Mac.");return c;}var tested=null;document.getElementById("test").onclick=function(){try{var c=read();statusLabel.textContent="Connecting…";var x=new XMLHttpRequest();x.open("GET",c.gatewayURL+"/v1/health");x.setRequestHeader("Authorization","Bearer "+c.gatewayToken);x.timeout=10000;x.onload=function(){try{var j=JSON.parse(x.responseText);if(x.status!==200||j.service!=="StoneNotes")throw Error(j.error||"Connection failed.");c.vaultId=j.vaultId;c.browserId=j.browserId;c.root=j.root;pair.value=JSON.stringify(c);tested=pair.value;statusLabel.textContent="Connected to your vault.";}catch(e){statusLabel.textContent=e.message;}};x.onerror=x.ontimeout=function(){statusLabel.textContent="Cannot reach your Mac. Check Tailscale and the connector.";};x.send();}catch(e){statusLabel.textContent=e.message;}};document.getElementById("save").onclick=function(){try{var c=read();if(!/^[a-f0-9]{64}$/.test(c.vaultId))throw Error("Test the connection before saving.");c.marqueeSpeed=Number(document.getElementById("marquee-speed").value);c.appearance=readAppearance();c.settingsThemes=window.organikSavedThemes();c.buttons=readButtons();var sorting=readSorting();c.sort=sorting.sort;c.tag=sorting.tag;c.autoDictate=document.getElementById("auto").checked;location.href="pebblejs://close#"+encodeURIComponent(JSON.stringify(c));}catch(e){statusLabel.textContent=e.message;}};</script></html>';
  html=html.replace('<button id="save">','<div id="pending-notes"><h2>Pending notes on this phone</h2><p>If your vault or Mac connection changes, you can copy these notes here.</p><textarea id="pending" readonly aria-label="Pending note text"></textarea></div><button id="save">');
  html=html.replace('var tested=null;', 'var readAppearance=('+Themes.setup.toString()+')('+JSON.stringify(Themes.normalize(config,enhanced()))+','+JSON.stringify(Themes.presets(enhanced()))+','+JSON.stringify(Themes.sizes)+');var tested=null;');
  html=html.replace('var tested=null;', 'var readButtons=('+Buttons.setup.toString()+')('+JSON.stringify(Buttons.normalize(config&&config.buttons))+');var tested=null;');
  html=html.replace('var tested=null;', 'var readSorting=('+Sorting.setup.toString()+')(saved,read);var tested=null;');
  html=html.replace('</script>', '('+Folders.setup.toString()+')(read);</script>');
  html=html.replace('</script>', 'document.getElementById("marquee-speed").value='+marqueeSpeed(config&&config.marqueeSpeed)+';</script>');
  html=html.replace('</script>', 'document.getElementById("pending").value='+pendingText+';</script>');
  html = organikSettingsHTML(html, {"app":"notesy","fields":{"text":"appearance-text","background":"appearance-background","selection":"appearance-selection","font":"appearance-font","size":"appearance-size"},"watchColors":["#000000","#001e41","#004387","#0068ca","#2b4a2c","#27514f","#16638d","#007dce","#5e9860","#5c9b72","#57a5a2","#4cb4db","#8ee391","#8ee69e","#8aebc0","#84f5f1","#4a161b","#482748","#40488a","#2f6bcc","#564e36","#545454","#4f6790","#4180d0","#759a64","#759d76","#71a6a4","#69b5dd","#9ee594","#9de7a0","#9becc2","#95f6f2","#99353f","#983e5a","#955694","#8f74d2","#9d5b4d","#9d6064","#9a7099","#9587d5","#afa072","#aea382","#ababab","#a7bae2","#c9e89d","#c9eaa7","#c7f0c8","#c3f9f7","#e35462","#e25874","#e16aa3","#de83dc","#e66e6b","#e6727c","#e37fa7","#e194df","#f1aa86","#f1ad93","#efb5b8","#ecc3eb","#ffeeab","#fff1b5","#fff6d3","#ffffff"],"library":true,"apply":true,"savedThemes":config && config.settingsThemes});
  return 'data:text/html;charset=utf-8,'+encodeURIComponent(html);
}
Pebble.addEventListener('showConfiguration',function(){Pebble.openURL(configurationURL());});
Pebble.addEventListener('webviewclosed',function(event){
  if(!event.response||event.response==='CANCELLED')return;
  try{var c=JSON.parse(decodeURIComponent(event.response));if(!valid(c))throw Error('Invalid pairing details.');if(config&&c.gatewayURL===config.gatewayURL&&c.vaultId===config.vaultId&&!c.browserId){c.browserId=config.browserId;c.root=config.root;}localStorage.setItem('stonenotes.config',JSON.stringify(c));config=c;send(settingsMessage());pump();}catch(e){error('Settings were not saved. Check the pairing details.');}
});
