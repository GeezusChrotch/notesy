'use strict';
// Obsidian inline hashtags and common YAML tags forms; ignore code and comments.
module.exports=function tags(markdown){
 const found=new Map();
 function add(tag){tag=tag.trim().replace(/^['"]|['"]$/g,'').replace(/^#/,'');if(tag&&!/^\d+$/.test(tag)&&/^[\p{L}\p{N}_\/-]+$/u.test(tag))found.set(tag.toLowerCase(),tag.toLowerCase());}
 const front=markdown.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
 if(front){const lines=front[1].split(/\r?\n/);for(let i=0;i<lines.length;i++){
  const m=lines[i].match(/^tags?:\s*(.*)$/i);if(!m)continue;
  const value=m[1].replace(/\s+#.*$/,'').trim();
  if(value) value.replace(/^\[|\]$/g,'').split(/[,\s]+/).forEach(add);
  else while(i+1<lines.length&&/^\s*-\s+/.test(lines[i+1]))add(lines[++i].replace(/^\s*-\s+/,'').replace(/\s+#.*$/,''));
 }markdown=markdown.slice(front[0].length);}
 markdown=markdown.replace(/<!--[\s\S]*?-->/g,'');let fence='';
 for(let line of markdown.split(/\r?\n/)){
  const m=line.match(/^\s*(`{3,}|~{3,})/);if(m){if(!fence)fence=m[1][0];else if(fence===m[1][0])fence='';continue;}if(fence)continue;
  line=line.replace(/`+[^`]*`+/g,'').replace(/\]\([^)]*\)/g,']');
  for(const m of line.matchAll(/(?:^|[\s(])#([\p{L}\p{N}_\/-]+)/gu))add(m[1]);
 }
 return [...found.values()].sort();
};
