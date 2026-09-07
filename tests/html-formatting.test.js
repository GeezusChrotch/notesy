const {test}=require('node:test'),assert=require('node:assert/strict');
const md=require('../gateway/markdown'),{parse}=require('../gateway/content');
function styles(markup){let style=0;const chars=[];for(const ch of markup){if(md.isStyle(ch)){const n=ch.charCodeAt(0);style=n>=24?n-16:n-1;}else chars.push([ch,style]);}return chars;}
test('HTML spans, nested emphasis and CSS produce text styles rather than literal tags',()=>{
 const v=md.inline('<span style="color: red; font-weight:700">Bold <span style="font-style:italic">both</span> bold</span> plain <s>old</s> normal');
 assert.equal(v.text,'Bold both bold plain old normal');assert.ok(!v.markup.includes('<span'));
 const out=styles(v.markup);assert.deepEqual(out.slice(5,9).map(x=>x[1]),[3,3,3,3]);assert.ok(out.slice(-7).every(x=>x[1]===0));
 assert.equal(md.inline('<span style="text-decoration:none">plain</span>').text,'plain');assert.ok(styles(md.inline('<span style="text-decoration:none">plain</span>').markup).every(x=>x[1]===0));
});
test('line breaks survive formatting and never become strike markers, including across chunks',()=>{
 const v=md.inline('first\nsecond\n**bold**\nnormal\twords');assert.equal(v.text,'first\nsecond\nbold\nnormal    words');assert.ok(styles(v.markup).every(x=>(x[1]&8)===0));
 const input='**~~'+('old\ntext '.repeat(80))+'~~**\nnormal';const chunks=md.chunks(md.inline(input).markup);
 assert.equal(chunks.map(md.stripStyles).join(''),'old\ntext '.repeat(80)+'\nnormal');
 assert.ok(chunks.every(s=>Buffer.byteLength(s)<=220));assert.equal(styles(chunks[1])[0][1],9);assert.ok(styles(chunks.at(-1)).slice(-6).every(x=>x[1]===0));
});
test('HTML entities and breaks render, while code stays literal and hidden HTML is omitted',()=>{
 assert.equal(md.inline('A&nbsp;&amp; B<br>next &#x2019;').text,'A & B\nnext ’');
 assert.equal(md.inline('before<!-- hidden --><script>bad [[Hidden]]</script><style>.bad{}</style>after').text,'beforeafter');
 assert.deepEqual(md.inline('<script>[[Hidden]]</script>').links,[]);
 assert.equal(md.inline('`<span style="color:red">literal</span>`').text,'<span style="color:red">literal</span>');
 assert.equal(md.inline('&lt;span&gt;escaped&lt;/span&gt;').text,'<span>escaped</span>');
 assert.equal(md.inline('<code>a_b **literal** &lt;tag&gt;</code>').text,'a_b **literal** <tag>');
 assert.equal(md.inline('x < y > z').text,'x < y > z');
 assert.equal(md.inline('&#9;x&#2;y').text,'    xy');
});
test('HTML formatting preserves note links and task byte offsets without changing Markdown',()=>{
 const source='<span style="font-weight:bold">[[Target|Name]]</span>\n\n- [ ] <span style="color:blue">Do this</span>\n\n```html\n<span>literal</span>\n```';
 const v=parse(source);assert.equal(v.blocks.find(b=>b.kind==='link').ref,'Target');const task=v.blocks.find(b=>b.kind==='task');assert.equal(task.text,'Do this');assert.equal(Number(task.id),source.indexOf('[ ]')+1);assert.ok(v.blocks.some(b=>b.format===8&&b.text==='<span>literal</span>'));
});
