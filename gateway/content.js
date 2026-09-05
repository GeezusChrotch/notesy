'use strict';
const crypto=require('node:crypto');
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
// Byte offsets refer to the original Markdown; toggling changes exactly one marker byte.
function parse(markdown,plainText,pages){
 const blocks=[];let offset=0,fence='',front=false,first=true,paragraph=[];
 const flush=()=>{const text=plainText(paragraph.join('\n'));paragraph=[];if(text)for(const chunk of pages(text,220))blocks.push({kind:'text',text:chunk});};
 for(const full of markdown.match(/[^\n]*\n|[^\n]+$/g)||[]){
  const line=full.replace(/\r?\n$/,'');const clean=line.replace(/^\uFEFF/,'');
  if(first&&clean==='---'){front=true;first=false;offset+=Buffer.byteLength(full);continue;}first=false;
  if(front){if(clean==='---')front=false;offset+=Buffer.byteLength(full);continue;}
  const code=line.match(/^\s{0,3}(`{3,}|~{3,})/);
  if(code){if(!fence)fence=code[1];else if(code[1][0]===fence[0]&&code[1].length>=fence.length)fence='';paragraph.push(line);offset+=Buffer.byteLength(full);continue;}
  const task=!fence&&line.match(/^(\s*(?:>\s*)*(?:[-+*]|\d+[.)])\s+\[)([ xX])(\]\s+)(.*)$/);
  if(task){flush();blocks.push({kind:'task',id:String(offset+Buffer.byteLength(task[1])),checked:task[2]!==' ',text:plainText(task[4])||'(Untitled task)'});}
  else if(!fence){
   const pattern=/!\[\[([^\]]+)\]\]|!\[([^\]]*)\]\(\s*(<[^>]+>|(?:[^\s()]|\([^)]*\))+)(?:\s+"[^"]*")?\s*\)/g;let last=0,match,found=false;
   while((match=pattern.exec(line))){found=true;paragraph.push(line.slice(last,match.index));flush();const wiki=match[1]&&match[1].split('|');const ref=wiki?wiki[0]:match[3].replace(/^<|>$/g,'');blocks.push({kind:'image',ref,text:wiki?wiki[0]:match[2]||ref});last=pattern.lastIndex;}
   if(found)paragraph.push(line.slice(last));else if(!line.trim())flush();else paragraph.push(line);
  }else paragraph.push(line);
  offset+=Buffer.byteLength(full);
 }
 flush();return {revision:hash(Buffer.from(markdown)),blocks,rich:blocks.some(b=>b.kind!=='text')};
}
module.exports={parse,hash};
