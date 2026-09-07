'use strict';
const fs=require('node:fs'),path=require('node:path');
// No URL fetching, note creation, or Obsidian/plugin execution. Hidden folders
// and symlinks are excluded even when an explicit link points into them.
module.exports=function resolver(browser,note){
 let candidates;
 return function(block){
  let ref;try{ref=decodeURIComponent(block.ref.split('#')[0]);}catch{return {error:'Invalid note link'};}
  if(!ref)return {target:browser.remember(note,false)};
  if(/^[a-z][a-z\d+.-]*:/i.test(ref)||ref.startsWith('//')||ref.includes('\\')||ref.includes('\0'))return {error:'External links cannot open on the watch'};
  const extensions=/\.(md|excalidraw|pdf)$/i.test(ref)?['']:['.md','.excalidraw.md','.excalidraw'];
  const parent=path.posix.dirname(note),root=ref.replace(/^\//,'');
  const bases=block.wiki?[root,path.posix.join(parent,ref)]:[path.posix.join(parent,ref),root];
  for(const base of bases)for(const ext of extensions){const relative=path.posix.normalize(base+ext);if(browser.hidden(relative))continue;try{browser.checked(relative,false);return {target:browser.remember(relative,false)};}catch{}}
  if(ref.includes('/')||ref.startsWith('.'))return {error:'Linked note is missing or hidden'};
  if(!candidates){candidates=[];const dirs=[''];let count=0;
   while(dirs.length){const dir=dirs.pop();let entries;try{entries=fs.readdirSync(browser.checked(dir,true),{withFileTypes:true});}catch{continue;}
    for(const e of entries){if(++count>60000){candidates=null;return {error:'Use a folder path for this link'};}if(e.name.startsWith('.'))continue;const relative=dir?dir+'/'+e.name:e.name;if(browser.hidden(relative))continue;if(e.isDirectory())dirs.push(relative);else if(e.isFile()&&/\.(md|excalidraw|pdf)$/i.test(e.name))candidates.push(relative);}
   }
  }
  const found=candidates.filter(p=>extensions.some(ext=>path.posix.basename(p).toLowerCase()===(ref+ext).toLowerCase()));
  if(found.length!==1)return {error:found.length?'Ambiguous link: include its folder':'Linked note is missing or hidden'};
  try{browser.checked(found[0],false);return {target:browser.remember(found[0],false)};}catch{return {error:'Linked note is unavailable'};}
 };
};
