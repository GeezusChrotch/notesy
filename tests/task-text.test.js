const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const {makeServer}=require('../gateway/server');
test('long UTF-8 task text survives paging with one checkbox and byte-exact checking',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'notesy-task-text-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const vault=path.join(root,'vault');fs.mkdirSync(vault);
 const task='Café 🐈 '+('A complete task sentence with details and spaces. '.repeat(100))+'the end.';
 const original='---\ntitle: Test\n---\n- [ ] '+task+'\n',file=path.join(vault,'Task.md');fs.writeFileSync(file,original);
 const b=makeServer({vault,state:path.join(root,'state'),token:'test-token'.repeat(5)}).browser,id=b.remember('Task.md',false),view=b.content(id),blocks=[];
 for(let page=0;page<Math.ceil(view.total/15);page++)blocks.push(...b.content(id,page).blocks);
 assert.ok(view.total>15);assert.equal(blocks.filter(b=>b.kind==='task').length,1);assert.equal(blocks.map(b=>b.markup||b.text).join(''),task);
 for(const block of blocks){assert.ok(Buffer.byteLength(block.markup||block.text)<=220);assert.ok(!(block.markup||block.text).includes('\ufffd'));}
 const first=blocks[0],body={vaultId:b.vaultId,taskId:first.id,revision:view.revision,requestId:'long_task_toggle',checked:true};b.task(id,body);
 const expected=Buffer.from(original);expected[Number(first.id)]=120;assert.deepEqual(fs.readFileSync(file),expected);
 assert.equal(b.content(id).blocks[0].checked,true);assert.equal(b.content(id,1).blocks[0].kind,'text');
});
test('task row measures the selected font at checkbox text width and keeps every wrapped line visible',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../src/c/main.c'),'utf8'),start=source.indexOf('static int16_t rich_height('),end=source.indexOf('static void rich_draw(',start),body=source.slice(start,end);
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'notesy-task-height-'));
 try{fs.writeFileSync(path.join(root,'test.c'),`
#include <assert.h>
#include <stdint.h>
#include <string.h>
typedef struct {int x,y;} GPoint;typedef struct {int w,h;} GSize;typedef struct {GPoint origin;GSize size;} GRect;
#define GRect(x,y,w,h) ((GRect){{x,y},{w,h}})
typedef struct {int width;} Layer;typedef struct {int section,row;} MenuIndex;typedef int GFont;
typedef struct {char text[241];int kind,text_height;} RichItem;
static RichItem s_rich_items[1];static int s_rich_count=1,s_theme_size,measurements,last_width,last_font;
#define IMAGE_HEIGHT 150
#define GTextOverflowModeWordWrap 1
#define GTextAlignmentLeft 0
static GRect layer_get_bounds(Layer *layer){return GRect(0,0,layer->width,228);}
static GFont theme_title_font(void){return s_theme_size;}
static GSize graphics_text_layout_get_content_size(const char *text,GFont font,GRect bounds,int wrap,int align){
 measurements++;last_width=bounds.size.w;last_font=font;assert(wrap==1&&align==0);
 int perline=bounds.size.w/(font/2),lines=((int)strlen(text)+perline-1)/perline;return (GSize){bounds.size.w,lines*(font+4)};
}
static int rich_text_height(Layer *layer,RichItem *item){return 42;}
${body}
int main(void){
 MenuIndex index={0,0};s_rich_items[0].kind=1;memset(s_rich_items[0].text,'X',220);s_rich_items[0].text[220]=0;
 for(int width=144;width<=200;width+=56)for(int font=14;font<=42;font+=4){
  Layer layer={width};s_theme_size=font;s_rich_items[0].text_height=0;int before=measurements,h=rich_height(&layer,&index,0);
  assert(last_width==width-34&&last_font==font&&h>font+40);int perline=(width-34)/(font/2);int measured=((220+perline-1)/perline)*(font+4);
  assert(h-8>=measured);assert(rich_height(&layer,&index,0)==h&&measurements==before+1);
 }
 s_rich_items[0].text[0]=0;s_rich_items[0].text_height=0;Layer layer={144};assert(rich_height(&layer,&index,0)>=36);
}
`);execFileSync('cc',[path.join(root,'test.c'),'-o',path.join(root,'test')]);execFileSync(path.join(root,'test'));}finally{fs.rmSync(root,{recursive:true,force:true});}
 assert.match(source,/for\(int i=0;i<15;i\+\+\)s_rich_items\[i\]\.text_height=0/);
 assert.match(source,/if\(s_rich&&s_document_view\)\{document_reload\(\);rich_position\(s_rich_scroll,false\)/);
});
