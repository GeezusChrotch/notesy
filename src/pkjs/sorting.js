'use strict';
function normalize(n){return typeof n==='number'&&n>=0&&n<=3&&n%1===0?n:0;}
function setup(saved,readPair){
 var box=document.getElementById('sorting');
 box.innerHTML='<label>Sort notes<select id="note-sort"><option value="0">Name (A–Z)</option><option value="1">Date modified (newest first)</option><option value="2">Date created (newest first)</option><option value="3">Tag</option></select></label><p>Folders stay first and vault pins stay at the top. Watch sorting changes are saved here too. Choose Tag on the watch to see tags in that folder. Creation date uses the file creation time supplied by your Mac.</p><div id="sort-tags"><label>Vault root tag<select id="note-tag"><option value="">Choose a tag on the watch</option></select></label><button id="load-sort-tags" type="button">Load root tags</button><p id="sort-tag-status"></p></div>';
 var sort=document.getElementById('note-sort'),tag=document.getElementById('note-tag'),panel=document.getElementById('sort-tags'),status=document.getElementById('sort-tag-status');
 sort.value=String(saved.sort||0);
 if(saved.tag){var o=document.createElement('option');o.value=saved.tag;o.textContent='Current watch tag';tag.appendChild(o);tag.value=saved.tag;}
 function show(){panel.hidden=sort.value!=='3';}sort.onchange=show;show();
 var offset=0,snapshot='',loading=false;
 document.getElementById('load-sort-tags').onclick=function(){
  if(loading)return;var c;try{c=readPair();}catch(e){status.textContent=e.message;return;}
  loading=true;status.textContent='Loading tags…';var x=new XMLHttpRequest();x.open('GET',c.gatewayURL+'/v3/tags?offset='+offset+'&snapshot='+encodeURIComponent(snapshot));x.setRequestHeader('Authorization','Bearer '+c.gatewayToken);x.timeout=10000;
  x.onload=function(){loading=false;try{var v=JSON.parse(x.responseText);if(x.status!==200)throw Error(v.error||'Could not load tags.');v.items.forEach(function(n){var o=document.createElement('option');o.value=n.id;o.textContent=n.title;tag.appendChild(o);});offset+=v.items.length;snapshot=v.snapshot;status.textContent=offset+' of '+v.total+' tags loaded.';document.getElementById('load-sort-tags').disabled=offset>=v.total;document.getElementById('load-sort-tags').textContent='Load more tags';}catch(e){status.textContent=e.message;offset=0;snapshot='';}};
  x.onerror=x.ontimeout=function(){loading=false;status.textContent='Cannot reach the Mac connector.';};x.send();
 };
 return function(){return {sort:Number(sort.value),tag:sort.value==='3'?tag.value:''};};
}
module.exports={normalize:normalize,setup:setup};
