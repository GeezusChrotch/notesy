const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
test('reader tap focuses a different row, activates on the next tap and respects bounds/loading',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../src/c/main.c'),'utf8'),begin=source.indexOf('static void notesy_touch_reader_tap(const Recognizer *recognizer,RecognizerEvent event){'),end=source.indexOf('\n#endif',begin),body=source.slice(begin,end);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'notesy-reader-tap-'));try{fs.writeFileSync(path.join(dir,'test.c'),`
#include <stdbool.h>
#include <stddef.h>
#include <assert.h>
typedef void Recognizer;typedef int RecognizerEvent;enum {RecognizerEvent_Completed=1};typedef void MenuLayer;
typedef struct {int x,y;} GPoint;typedef struct {int w,h;} GSize;typedef struct {GPoint origin;GSize size;} GRect;typedef struct {int section,row;} MenuIndex;
#define MenuIndex(s,r) ((MenuIndex){s,r})
#define GPointZero ((GPoint){0,0})
static bool s_loading,s_stitch,s_rich=true,enabled=true;static MenuLayer *s_rich_menu=(void*)1;static int s_rich_count=4,selected=0,activated=-1,actions;static GPoint point,offset={0,-20};
static bool touch_service_is_enabled(void){return enabled;}
static GPoint tap_recognizer_get_tap_point(const Recognizer*r){return point;}
static void *menu_layer_get_layer(MenuLayer*m){return m;}
static GPoint layer_convert_point_to_screen(void*l,GPoint p){return (GPoint){0,0};}
static GRect layer_get_bounds(void*l){return (GRect){{0,0},{200,208}};}
static void *menu_layer_get_scroll_layer(MenuLayer*m){return m;}
static GPoint scroll_layer_get_content_offset(void*l){return offset;}
static int rich_height(MenuLayer*m,MenuIndex*i,void*c){return i->row==0?100:50;}
static MenuIndex menu_layer_get_selected_index(MenuLayer*m){return MenuIndex(0,selected);}
static void rich_focus(int row,bool down){selected=row;}
static void notesy_rich_selected(MenuLayer*m,MenuIndex*i,void*c){activated=i->row;}
static void open_actions(void*a,void*b){actions++;}
${body}
int main(void){
 point=(GPoint){40,100};notesy_touch_reader_tap(NULL,1);assert(selected==1&&activated==-1);notesy_touch_reader_tap(NULL,1);assert(activated==1);
 activated=-1;point.y=215;notesy_touch_reader_tap(NULL,1);assert(activated==-1);point.y=100;s_loading=true;notesy_touch_reader_tap(NULL,1);assert(activated==-1);s_loading=false;
 enabled=false;notesy_touch_reader_tap(NULL,1);assert(activated==-1);enabled=true;s_rich=false;notesy_touch_reader_tap(NULL,1);assert(actions==1);
}
`);execFileSync('cc',[path.join(dir,'test.c'),'-o',path.join(dir,'test')]);execFileSync(path.join(dir,'test'));}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
