'use strict';
const html=require('./html');
const marker=style=>String.fromCharCode(style<8?style+1:style+16);
const isStyle=ch=>/[\x01-\x08\x18-\x1f]/.test(ch);
const stripStyles=value=>value.replace(/[\x01-\x08\x18-\x1f]/g,'');
// Small, non-executing inline subset. Non-whitespace control bytes encode emphasis flags;
// literal control bytes are removed before parsing and never interpreted as markup.
function inline(source,base=0){
 source=source.replace(/[\x00-\x08\x0b-\x1f]/g,'').replace(/\t/g,'    ');
 const links=[],web=[];
 const external=ref=>/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(ref);
 function webLabel(ref,label){
  if(label&&!/^https?:\/\//i.test(label))return label;
  let name='Web page';try{name=new URL(ref).hostname.replace(/^www\./,'');}catch{}
  const index=web.push({kind:'web',ref,text:name})-1;return '\x11'+index+'\x12';
 }
 function scan(s,style,depth=0){
  if(depth>12)return s;
  let out='';const htmlStack=[];
  for(let i=0;i<s.length;){
   if(s[i]==='\\'&&i+1<s.length){out+=s[i+1];i+=2;continue;}
   const rest=s.slice(i);let m;
   if((m=rest.match(/^(`+)([\s\S]*?)\1(?!`)/))){out+=marker(style|4)+m[2]+marker(style);i+=m[0].length;continue;}
   if((m=rest.match(/^\[\[([^\]\n]+)\]\]/))){const bits=m[1].split('|'),ref=bits[0],label=bits.slice(1).join('|')||ref;links.push({kind:'link',ref,text:label,wiki:true});out+=label;i+=m[0].length;continue;}
   if((m=rest.match(/^\[([^\]\n]+)\]\(\s*(<[^>]+>|(?:[^\s()]|\([^)]*\))+)(?:\s+"([^"]*)")?\s*\)/))){const ref=m[2].replace(/^<|>$/g,''),label=m[1];if(external(ref))out+=webLabel(ref,(/^https?:\/\//i.test(label)&&m[3])?m[3]:label);else{links.push({kind:'link',ref,text:label,wiki:false});out+=label;}i+=m[0].length;continue;}
   if((m=rest.match(/^<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i))){const label=require('./web-titles').title('<title>'+m[2]+'</title>');if(external(m[1]))out+=webLabel(m[1],label);else{links.push({kind:'link',ref:m[1],text:label,wiki:false});out+=label;}i+=m[0].length;continue;}
   if((m=rest.match(/^<https?:\/\/[^>\s]+>/i))){out+=webLabel(m[0].slice(1,-1),'');i+=m[0].length;continue;}
   if((m=rest.match(/^https?:\/\/[^\s<>]+/i))){let ref=m[0].replace(/[.,;:!?]+$/,'');while(ref.endsWith(')')&&(ref.match(/\)/g)||[]).length>(ref.match(/\(/g)||[]).length)ref=ref.slice(0,-1);out+=webLabel(ref,'');i+=ref.length;continue;}
   if(rest.startsWith('<!--')){const end=rest.indexOf('-->');i+=end<0?rest.length:end+3;continue;}
   if((m=rest.match(/^<(\/?)([a-z][\w:-]*)(?:\s+(?:"[^"]*"|'[^']*'|[^'">])*)?\s*\/?>/i))){
    const name=m[2].toLowerCase(),closing=!!m[1];i+=m[0].length;
    if(!closing&&/^(script|style|iframe|object|template)$/.test(name)){const end=s.slice(i).match(new RegExp('</'+name+'\\s*>','i'));i=end?i+end.index+end[0].length:s.length;continue;}
    if(name==='br'||name==='hr'){out+='\n';continue;}
    if(!closing&&name==='code'){const end=s.slice(i).match(/<\/code\s*>/i);if(end){out+=marker(style|4)+html.decode(s.slice(i,i+end.index).replace(/<[^>]*>/g,''))+marker(style);i+=end.index+end[0].length;continue;}}
    if(name==='img'){out+=html.attribute(m[0],'alt');continue;}
    if(/^(p|div|section|li|tr|h[1-6]|blockquote|pre)$/.test(name)&&out&&!out.endsWith('\n'))out+='\n';
    if(/^(td|th)$/.test(name)&&closing)out+=' | ';
    if(closing){const at=htmlStack.map(v=>v.name).lastIndexOf(name);if(at>=0){style=htmlStack[at].style;htmlStack.length=at;out+=marker(style);}}
    else if(!/\/\s*>$/.test(m[0])&&!/^(input|meta|link|hr|br|wbr)$/.test(name)){if(htmlStack.length<64){htmlStack.push({name,style});style=html.emphasis(m[0],name,style);out+=marker(style);}}
    continue;
   }
   if((m=rest.match(/^&(?:#x[\da-f]+|#\d+|[a-z]+);/i))){out+=html.decode(m[0]);i+=m[0].length;continue;}
   let matched=false;
   for(const [mark,flag] of [['***',3],['___',3],['**',1],['__',1],['~~',8],['*',2],['_',2]]){
    if(!rest.startsWith(mark)||(mark.includes('_')&&i&&/[\p{L}\p{N}]/u.test(s[i-1])))continue;
    const end=s.indexOf(mark,i+mark.length);if(end<=i+mark.length||/^\s/.test(s.slice(i+mark.length)))continue;
    out+=marker(style|flag)+scan(s.slice(i+mark.length,end),style|flag,depth+1)+marker(style);i=end+mark.length;matched=true;break;
   }
   if(!matched)out+=s[i++];
  }
  return out;
 }
 const markup=scan(source,base);return {markup,text:markup.replace(/\x11(\d+)\x12/g,(_,i)=>web[Number(i)].text).replace(/[\x01-\x08\x18-\x1f]/g,''),links,web,changed:markup!==source};
}
function chunks(markup,limit=220){
 const result=[];let current='',state='\x01';
 for(const ch of markup){if(Buffer.byteLength(current+ch)>limit){result.push(current);current=state;}current+=ch;if(isStyle(ch))state=ch;}
 if(current)result.push(current);return result;
}
module.exports={inline,chunks,marker,isStyle,stripStyles};
