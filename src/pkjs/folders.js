'use strict';
// Embedded into the phone settings document; no personal paths are in this source.
function setup(read){
 var filter=document.getElementById('folder-filter');filter.oninput=function(){var query=filter.value.toLowerCase();Array.prototype.forEach.call(document.querySelectorAll('[data-folder-label]'),function(label){label.style.opacity=label.getAttribute('data-folder-label').toLowerCase().indexOf(query)>=0?'1':'0.35';});};
 var tree=document.getElementById('folder-tree'),status=document.getElementById('folder-status'),hidden=[],vaultId='',loaded=false;
 function call(method,route,body,done){var c;try{c=read();}catch(e){status.textContent=e.message;return;}
  var x=new XMLHttpRequest();x.open(method,c.gatewayURL+route);x.setRequestHeader('Authorization','Bearer '+c.gatewayToken);x.setRequestHeader('Content-Type','application/json');x.timeout=10000;
  x.onload=function(){try{var v=JSON.parse(x.responseText);if(x.status!==200)throw Error(v.error||'Could not load folders.');done(v);}catch(e){status.textContent=e.message;}};
  x.onerror=x.ontimeout=function(){status.textContent='Cannot reach your Mac. Keep the connector and Tailscale running.';};x.send(body?JSON.stringify(body):null);
 }
 function children(parent,box){call('GET','/v3/folders?parent='+encodeURIComponent(parent),null,function(v){
  if(!loaded){hidden=v.hidden.slice();vaultId=v.vaultId;loaded=true;}
  box.textContent='';v.folders.forEach(function(f){
   var row=document.createElement('div'),label=document.createElement('label'),check=document.createElement('input'),expand=document.createElement('button'),nested=document.createElement('div');
   nested.style.marginLeft='16px';label.setAttribute('data-folder-label',f.path);check.type='checkbox';check.checked=hidden.indexOf(f.path)>=0;
   check.onchange=function(){hidden=hidden.filter(function(p){return p!==f.path;});if(check.checked)hidden.push(f.path);status.textContent='Folder choices changed. Select Apply hidden folders.';};
   label.appendChild(check);label.appendChild(document.createTextNode(' Hide '+f.name));expand.textContent='Show subfolders';expand.type='button';expand.onclick=function(){children(f.path,nested);expand.disabled=true;};
   row.appendChild(label);row.appendChild(expand);row.appendChild(nested);box.appendChild(row);
  });status.textContent=v.folders.length?'A hidden folder also hides all its subfolders. Embedded pictures still work.':'No subfolders here.';
 });}
 document.getElementById('folders-load').onclick=function(){loaded=false;children('',tree);};
 document.getElementById('folders-apply').onclick=function(){if(!loaded){status.textContent='Load folders first.';return;}call('POST','/v3/hidden',{vaultId:vaultId,hidden:hidden},function(){status.textContent='Saved. Reopen Notesy or refresh its list to apply.';});};
}
module.exports={setup:setup};
