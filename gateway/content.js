'use strict';
const crypto=require('node:crypto');
const md=require('./markdown');
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
// Byte offsets refer to the original Markdown; toggling changes exactly one marker byte.
function parse(markdown,plainText,pages){
 const blocks=[];let offset=0,fence='',front=false,first=true,paragraph=[],format=0,rendered=false;
 const flush=()=>{
  const source=paragraph.join('\n').replace(/<!-- stonenotes-append:[a-f0-9]{64} -->/g,'').trim();paragraph=[];
  const parsed=format===8?{markup:source.replace(/[\x00-\x08\x0b-\x1f]/g,''),text:source,links:[]}:md.inline(source);
  if(parsed.changed)rendered=true;
  const parts=parsed.markup.split(/\x11(\d+)\x12/g);let style='\x01';
  for(let i=0;i<parts.length;i++){
   if(i%2){blocks.push(parsed.web[Number(parts[i])]);continue;}
   const part=(i?style:'')+parts[i];for(const ch of parts[i])if(md.isStyle(ch))style=ch;
   for(const markup of md.chunks(part))if(md.stripStyles(markup).trim())blocks.push({kind:'text',text:md.stripStyles(markup),markup,format});
  }
  blocks.push(...parsed.links);format=0;
 };
 for(const full of markdown.match(/[^\n]*\n|[^\n]+$/g)||[]){
  const line=full.replace(/\r?\n$/,'');const clean=line.replace(/^\uFEFF/,'');
  if(first&&clean==='---'){front=true;first=false;offset+=Buffer.byteLength(full);continue;}first=false;
  if(front){if(clean==='---')front=false;offset+=Buffer.byteLength(full);continue;}
  if(!fence&&paragraph.length===1&&/^\s*(?:===+|---+)\s*$/.test(line)){format=line.trim()[0]==='='?1:2;flush();offset+=Buffer.byteLength(full);continue;}
  const code=line.match(/^\s{0,3}(`{3,}|~{3,})/);
  if(code){if(!fence){flush();fence=code[1];format=8;}else if(code[1][0]===fence[0]&&code[1].length>=fence.length){flush();fence='';}else paragraph.push(line);offset+=Buffer.byteLength(full);continue;}
  const task=!fence&&line.match(/^(\s*(?:>\s*)*(?:[-+*]|\d+[.)])\s+\[)([ xX])(\]\s+)(.*)$/);
  if(task){
   flush();const parsed=md.inline(task[4]),text=parsed.text||'(Untitled task)';
   // Keep one checkbox/byte offset while carrying every UTF-8 character across
   // bounded watch blocks. Continuations are ordinary scrolling text.
   md.chunks(text).map(md.stripStyles).forEach((part,i)=>blocks.push(i?{kind:'text',text:part,markup:part,format:0}:{kind:'task',id:String(offset+Buffer.byteLength(task[1])),checked:task[2]!==' ',text:part,markup:part}));
   blocks.push(...parsed.links);
  }
  else if(!fence){
   const heading=line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*$/),quote=line.match(/^\s*>\s?(.*)$/),list=line.match(/^\s*([-+*]|\d+[.)])\s+(.+)$/);
   if(heading||quote||list||/^\s*(?:---+|\*\*\*+|___+)\s*$/.test(line)){
    flush();format=heading?heading[1].length:quote?7:list?9:10;paragraph.push(heading?heading[2]:quote?quote[1]:list?(/\d/.test(list[1])?list[1]+' ':'• ')+list[2]:'—');flush();offset+=Buffer.byteLength(full);continue;
   }

   const pattern=/`+[^`]*`+|!\[\[([^\]]+)\]\]|!\[([^\]]*)\]\(\s*(<[^>]+>|(?:[^\s()]|\([^)]*\))+)(?:\s+"[^"]*")?\s*\)/g;let last=0,match,found=false;
   while((match=pattern.exec(line))){if(match[0][0]==='`')continue;found=true;paragraph.push(line.slice(last,match.index));flush();const wiki=match[1]&&match[1].split('|');const ref=wiki?wiki[0]:match[3].replace(/^<|>$/g,'');blocks.push({kind:'image',ref,text:wiki?wiki[0]:match[2]||ref});last=pattern.lastIndex;}
   if(found)paragraph.push(line.slice(last));else if(!line.trim())flush();else paragraph.push(line);
  }else paragraph.push(line);
  offset+=Buffer.byteLength(full);
 }
 flush();return {revision:hash(Buffer.from(markdown)),blocks,rich:rendered||blocks.some(b=>b.kind!=='text'||b.format||b.markup!==b.text)};
}
// Excalidraw's plugin also creates ordinary .md filenames with a frontmatter marker.
function isDrawing(file,data){
 if(/\.excalidraw(?:\.md)?$/i.test(file))return true;
 if(!/\.md$/i.test(file))return false;
 const front=data.toString('utf8').match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
 return !!front&&/^excalidraw-plugin:\s*['"]?(?:parsed|raw)['"]?\s*$/m.test(front[1]);
}
module.exports={parse,hash,isDrawing};
