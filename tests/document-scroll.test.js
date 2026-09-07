const {test}=require('node:test'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
test('document scroll uses pixels, focuses only controls, loads visible images and pages in both directions',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../src/c/main.c'),'utf8'),begin=source.indexOf('static bool rich_interactive('),end=source.indexOf('static void rich_select(void){',begin),body=source.slice(begin,end);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'notesy-document-'));try{fs.writeFileSync(path.join(dir,'test.c'),`
#include <stdbool.h>
#include <stddef.h>
#include <assert.h>
typedef void MenuLayer;typedef struct {int section,row;} MenuIndex;typedef struct {int x,y;} GPoint;typedef struct {int w,h;} GSize;typedef struct {GPoint origin;GSize size;} GRect;
#define MenuIndex(s,r) ((MenuIndex){s,r})
#define GPoint(x,y) ((GPoint){x,y})
static MenuLayer *s_rich_menu=(void*)1;static int s_rich_count=5,s_rich_active=-1,s_rich_scroll,s_rich_offset,s_rich_total=40,s_rich_restore,s_image_index=-1,s_request,s_theme_size=22;
static bool s_loading,s_image_loading;static char s_image_error[96];static char s_current_id[65];static int command,page,images;static GPoint offset;
static struct {int kind;} s_rich_items[5]={{0},{2},{3},{1},{0}};
static int heights[]={200,180,60,60,200};
static void *menu_layer_get_layer(void*m){return m;}static void *menu_layer_get_scroll_layer(void*m){return m;}
static GRect layer_get_bounds(void*l){return (GRect){{0,0},{200,200}};}
static int rich_height(void*m,MenuIndex*i,void*c){return heights[i->row];}
static void scroll_layer_set_content_offset(void*l,GPoint p,bool animated){offset=p;}
static void layer_mark_dirty(void*l){}static void clear_timeout(void){}
static void image_clear(void){s_image_loading=false;s_image_index=-1;}
static void send_command(int cmd,const char*id,int p,void*x){command=cmd;page=p;if(cmd==9)images++;}
${body}
int main(void){
 rich_position(0,false);assert(s_rich_active==-1&&offset.y==0);
 rich_move(true);assert(s_rich_scroll==32&&offset.y==-32&&s_rich_active==-1);
 rich_position(210,true);assert(s_image_index==1&&images==1&&s_rich_active==-1);
 rich_position(350,true);assert(s_rich_active==2||s_rich_active==3);assert(images==1);
 rich_position(500,true);assert(s_rich_active==-1);rich_move(true);assert(command==2&&page==1&&s_rich_restore==0);
 s_loading=false;s_rich_offset=15;rich_position(0,true);rich_move(false);assert(command==2&&page==0&&s_rich_restore==14);
 s_loading=false;rich_position(9999,false);assert(s_rich_scroll==500);rich_position(-50,false);assert(s_rich_scroll==0);
}
`);execFileSync('cc',[path.join(dir,'test.c'),'-o',path.join(dir,'test')]);execFileSync(path.join(dir,'test'));}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
