'use strict';
// Small, non-executing inline subset. Control bytes 1..16 encode emphasis flags;
// literal control bytes are removed before parsing and never interpreted as markup.
function inline(source,base=0){
 source=source.replace(/[\x00-\x08\x0b-\x1f]/g,'');
 const links=[],web=[];
 const external=ref=>/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(ref);
 function webLabel(ref,label){
  if(label&&!/^https?:\/\//i.test(label))return label;
  let name='Web page';try{name=new URL(ref).hostname.replace(/^www\./,'');}catch{}
  const index=web.push({kind:'web',ref,text:name})-1;return '\x11'+index+'\x12';
 }
 function scan(s,style,depth=0){
  if(depth>12)return s;
  let out='';
  for(let i=0;i<s.length;){
   if(s[i]==='\\'&&i+1<s.length){out+=s[i+1];i+=2;continue;}
   const rest=s.slice(i);let m;
   if((m=rest.match(/^(`+)([\s\S]*?)\1(?!`)/))){out+=String.fromCharCode((style|4)+1)+m[2]+String.fromCharCode(style+1);i+=m[0].length;continue;}
   if((m=rest.match(/^\[\[([^\]\n]+)\]\]/))){const bits=m[1].split('|'),ref=bits[0],label=bits.slice(1).join('|')||ref;links.push({kind:'link',ref,text:label,wiki:true});out+=label;i+=m[0].length;continue;}
   if((m=rest.match(/^\[([^\]\n]+)\]\(\s*(<[^>]+>|(?:[^\s()]|\([^)]*\))+)(?:\s+"([^"]*)")?\s*\)/))){const ref=m[2].replace(/^<|>$/g,''),label=m[1];if(external(ref))out+=webLabel(ref,(/^https?:\/\//i.test(label)&&m[3])?m[3]:label);else{links.push({kind:'link',ref,text:label,wiki:false});out+=label;}i+=m[0].length;continue;}
   if((m=rest.match(/^<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i))){const label=require('./web-titles').title('<title>'+m[2]+'</title>');if(external(m[1]))out+=webLabel(m[1],label);else{links.push({kind:'link',ref:m[1],text:label,wiki:false});out+=label;}i+=m[0].length;continue;}
   if((m=rest.match(/^<https?:\/\/[^>\s]+>/i))){out+=webLabel(m[0].slice(1,-1),'');i+=m[0].length;continue;}
   if((m=rest.match(/^https?:\/\/[^\s<>]+/i))){let ref=m[0].replace(/[.,;:!?]+$/,'');while(ref.endsWith(')')&&(ref.match(/\)/g)||[]).length>(ref.match(/\(/g)||[]).length)ref=ref.slice(0,-1);out+=webLabel(ref,'');i+=ref.length;continue;}
   let matched=false;
   for(const [mark,flag] of [['***',3],['___',3],['**',1],['__',1],['~~',8],['*',2],['_',2]]){
    if(!rest.startsWith(mark)||(mark.includes('_')&&i&&/[\p{L}\p{N}]/u.test(s[i-1])))continue;
    const end=s.indexOf(mark,i+mark.length);if(end<=i+mark.length||/^\s/.test(s.slice(i+mark.length)))continue;
    out+=String.fromCharCode((style|flag)+1)+scan(s.slice(i+mark.length,end),style|flag,depth+1)+String.fromCharCode(style+1);i=end+mark.length;matched=true;break;
   }
   if(!matched)out+=s[i++];
  }
  return out;
 }
 const markup=scan(source,base);return {markup,text:markup.replace(/\x11(\d+)\x12/g,(_,i)=>web[Number(i)].text).replace(/[\x01-\x10]/g,''),links,web,changed:markup!==source};
}
function chunks(markup,limit=220){
 const result=[];let current='',state='\x01';
 for(const ch of markup){if(Buffer.byteLength(current+ch)>limit){result.push(current);current=state;}current+=ch;if(ch.charCodeAt(0)>=1&&ch.charCodeAt(0)<=16)state=ch;}
 if(current)result.push(current);return result;
}
module.exports={inline,chunks};
