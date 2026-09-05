'use strict';
function normalize(text){return text.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();}
// Bounded edit distance, including the adjacent transpositions common in typos.
function similar(a,b){
 if(a===b)return 1;
 if(a.length>=3&&b.startsWith(a))return .9;
 if(a.length<4||Math.abs(a.length-b.length)>2)return 0;
 const limit=a.length>=7?2:1;let older=[],previous=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){
  const row=[i];let low=i;
  for(let j=1;j<=b.length;j++){
   row[j]=Math.min(row[j-1]+1,previous[j]+1,previous[j-1]+(a[i-1]===b[j-1]?0:1));
   if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])row[j]=Math.min(row[j],older[j-2]+1);
   low=Math.min(low,row[j]);
  }
  if(low>limit)return 0;older=previous;previous=row;
 }
 return previous[b.length]<=limit?.72:0;
}
function score(query,title,folder,body=''){
 const terms=query.split(' '),name=normalize(title),location=normalize(folder),content=normalize(body);
 const titleWords=name.split(' '),pathWords=location.split(' '),bodyWords=new Set(content.split(' '));
 let result=0;
 for(const term of terms){
  const titleMatch=Math.max(0,...titleWords.map(word=>similar(term,word)));
  const folderMatch=Math.max(0,...pathWords.map(word=>similar(term,word)));
  // Body matches are literal or prefixes; fuzzy title/path matches remain inexpensive
  // even for a large vault and rank above incidental matches deep in note content.
  let bodyMatch=bodyWords.has(term)?1:0;
  if(!bodyMatch&&term.length>=3)bodyMatch=content.includes(term)?.7:0;
  const best=Math.max(titleMatch*6,folderMatch*2,bodyMatch);
  if(!best)return 0;result+=best;
 }
 if(name===query)result+=20;else if(name.includes(query))result+=8;
 return result;
}
module.exports={normalize,score};
