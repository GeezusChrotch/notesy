const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {makeServer}=require('../gateway/server'),media=require('../gateway/media');
function pdf(count=17,rotate=0){
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Count '+count+' /Kids ['+Array.from({length:count},(_,i)=>(3+i*2)+' 0 R').join(' ')+'] >>'];
 for(let i=0;i<count;i++){
  objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 300] /Rotate '+rotate+' /Contents '+(4+i*2)+' 0 R /Resources << >> >>');
  const stream=(i%2?'0 1 0':'1 0 0')+' rg 0 150 200 150 re f\n0 0 1 rg 0 0 200 150 re f\n';objects.push('<< /Length '+Buffer.byteLength(stream)+' >>\nstream\n'+stream+'endstream');
 }
 let out='%PDF-1.4\n',offsets=[0];objects.forEach((o,i)=>{offsets.push(Buffer.byteLength(out));out+=(i+1)+' 0 obj\n'+o+'\nendobj\n';});
 const offset=Buffer.byteLength(out);out+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n'+offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+offset+'\n%%EOF\n';return Buffer.from(out);
}
function fixture(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'notesy-pdf-test-')),vault=path.join(root,'vault');fs.mkdirSync(vault);t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const b=makeServer({vault,state:path.join(root,'state'),token:'pdf-test-'.repeat(5)}).browser;return {root,vault,b,add(name,data){const file=path.join(vault,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,data);return b.remember(name,false);}};}
function unpack(image){const out=[],r=Buffer.from(image.data,'base64');for(let i=0;i<r.length;i+=2)out.push(...Array(r[i]).fill(r[i+1]));assert.equal(out.length,image.width*image.height);return out;}
test('PDF files browse, pin, link and page in both directions without rasterizing the whole document',async t=>{
 const f=fixture(t),bytes=pdf(),id=f.add('Guide.pdf',bytes),view=f.b.content(id);
 assert.ok(f.b.list().items.some(i=>i.id===id));f.b.pin(id,true);assert.ok(f.b.item(id).pinned);assert.deepEqual(f.b.noteTags(id),[]);
 assert.equal(view.total,17);assert.equal(view.blocks.length,15);assert.equal(view.blocks[0].pdfPage,1);
 const last=f.b.content(id,1);assert.deepEqual(last.blocks.map(b=>b.pdfPage),[16,17]);assert.match(last.blocks[1].text,/Page 17 of 17/);assert.equal(f.b.content(id,0).blocks[0].pdfPage,1);
 const note=f.add('Link.md','[[Guide.pdf]]');assert.equal(f.b.content(note).blocks.find(b=>b.kind==='link').target,id);
 for(const mode of ['natural','high-contrast','original']){
  const a=await media.render(f.b,id,0,view.revision,120,100,mode),b=await media.render(f.b,id,1,view.revision,120,100,mode);
  assert.ok(a.width<=120&&a.height<=100);assert.notDeepEqual(unpack(a),unpack(b));if(mode==='original'){assert.equal(unpack(a)[Math.floor(a.width/2)+a.width*5],0xf0);assert.equal(unpack(a)[Math.floor(a.width/2)+a.width*(a.height-6)],0xc3);}
 }
 assert.deepEqual(fs.readFileSync(path.join(f.vault,'Guide.pdf')),bytes);
 assert.throws(()=>f.b.append(id,{}),/alongside this PDF/);assert.throws(()=>f.b.task(id,{}),/read-only/);assert.throws(()=>f.b.remove(id,{}),/Obsidian/);
});
test('embedded PDFs preserve surrounding text, specific Obsidian page embeds, task offsets and rotated pages',async t=>{
 const f=fixture(t);f.add('Assets/Guide.pdf',pdf(3));const id=f.add('Embedded.md','Before\n\n![[Assets/Guide.pdf]]\n\n- [ ] After\n\n![[Assets/Guide.pdf#page=2]]');
 const v=f.b.content(id);assert.equal(v.blocks.filter(b=>b.pdfPage).length,4);assert.deepEqual(v.blocks.filter(b=>b.pdfPage).map(b=>b.pdfPage),[1,2,3,2]);assert.ok(v.blocks.some(b=>b.text==='Before'));assert.ok(v.blocks.some(b=>b.kind==='task'&&b.text==='After'));
 const r=f.add('Rotated.pdf',pdf(1,90)),rv=f.b.content(r),image=await media.render(f.b,r,0,rv.revision,176,150,'original');assert.ok(image.width>image.height);unpack(image);
 const invalid=f.add('Invalid.md','![[Assets/Guide.pdf#page=9]]');assert.match(f.b.content(invalid).blocks[0].text,/unavailable/);
});
test('broken PDFs show explicit fallback, hidden PDFs stay out of navigation, symlinks are rejected',t=>{
 const f=fixture(t),id=f.add('Broken.pdf','invalid');assert.match(f.b.content(id).blocks[0].text,/Cannot preview/);assert.doesNotMatch(f.b.content(id).blocks[0].text,/Users|var\/folders|Command failed/);
 f.add('Hidden/Guide.pdf',pdf(1));f.b.setHidden({vaultId:f.b.vaultId,hidden:['Hidden']});assert.ok(!f.b.list().items.some(i=>i.title==='Hidden'));
 fs.symlinkSync(path.join(f.vault,'Broken.pdf'),path.join(f.vault,'Escape.pdf'));assert.throws(()=>f.b.checked('Escape.pdf',false));
});
