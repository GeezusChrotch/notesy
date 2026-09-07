'use strict';
// Text-only HTML support. No DOM, fetching, CSS execution, or plugin evaluation.
const entities={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',ndash:'–',mdash:'—',hellip:'…',rsquo:'’',lsquo:'‘',rdquo:'”',ldquo:'“',bull:'•',copy:'©',reg:'®',trade:'™'};
function decode(value){return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi,(whole,key)=>{
 if(key[0]!=='#')return entities[key.toLowerCase()]||whole;
 const n=key[1].toLowerCase()==='x'?parseInt(key.slice(2),16):Number(key.slice(1));
 return n>=32&&n<=0x10ffff&&!(n>=0xd800&&n<=0xdfff)?String.fromCodePoint(n):n===10?'\n':n===9?'    ':'';
});}
function attribute(tag,name){const m=tag.match(new RegExp('\\b'+name+'\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))','i'));return m?decode(m[1]??m[2]??m[3]):'';}
function emphasis(tag,name,style){
 if(/^(b|strong|h[1-6])$/.test(name))style|=1;
 if(/^(i|em|cite)$/.test(name))style|=2;
 if(/^(s|strike|del)$/.test(name))style|=8;
 if(name==='u')style|=4;
 const css=attribute(tag,'style').toLowerCase();
 for(const part of css.split(';')){const [property,...rest]=part.split(':');const value=rest.join(':').trim();
  switch(property.trim()){
   case 'font-weight':if(/^(bold|bolder|[6-9]00)$/.test(value))style|=1;else if(/^(normal|[1-5]00)$/.test(value))style&=~1;break;
   case 'font-style':if(/^(italic|oblique)$/.test(value))style|=2;else if(value==='normal')style&=~2;break;
   case 'text-decoration':case 'text-decoration-line':if(/\bline-through\b/.test(value))style|=8;if(/\bunderline\b/.test(value))style|=4;break;
  }
 }
 return style;
}
module.exports={decode,attribute,emphasis};
