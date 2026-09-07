const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
test('reader tap focuses a different row, activates on the next tap and respects bounds/loading',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../src/c/main.c'),'utf8'),begin=source.indexOf('static void notesy_reader_tap_at(GPoint point){'),end=source.indexOf('static bool s_reader_touch_tracking',begin),body=source.slice(begin,end);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'notesy-reader-tap-'));try{fs.writeFileSync(path.join(dir,'test.c'),`
#include <stdbool.h>
#include <stddef.h>
#include <assert.h>
typedef void Recognizer;typedef int RecognizerEvent;enum {RecognizerEvent_Completed=1};typedef void MenuLayer;
typedef struct {int x,y;} GPoint;typedef struct {int w,h;} GSize;typedef struct {GPoint origin;GSize size;} GRect;typedef struct {int section,row;} MenuIndex;
#define MenuIndex(s,r) ((MenuIndex){s,r})
#define GPointZero ((GPoint){0,0})
static bool s_loading,s_stitch,s_rich=true,enabled=true;static MenuLayer *s_rich_menu=(void*)1;static int s_rich_count=4,s_rich_active=-1,activated=-1,actions;static GPoint point,offset={0,-20};
static bool touch_service_is_enabled(void){return enabled;}
static GPoint tap_recognizer_get_tap_point(const Recognizer*r){return point;}
static void *menu_layer_get_layer(MenuLayer*m){return m;}
static GPoint layer_convert_point_to_screen(void*l,GPoint p){return (GPoint){0,0};}
static GRect layer_get_bounds(void*l){return (GRect){{0,0},{200,208}};}
static void *menu_layer_get_scroll_layer(MenuLayer*m){return m;}
static GPoint scroll_layer_get_content_offset(void*l){return offset;}
static int rich_height(MenuLayer*m,MenuIndex*i,void*c){return i->row==0?100:50;}
static bool rich_interactive(int row){return row==1||row==3;}
static void layer_mark_dirty(void*l){}
static void notesy_rich_selected(MenuLayer*m,MenuIndex*i,void*c){activated=i->row;}
static void open_actions(void*a,void*b){actions++;}
${body}
int main(void){
 point=(GPoint){40,100};notesy_reader_tap_at(point);assert(s_rich_active==1&&activated==-1);notesy_reader_tap_at(point);assert(activated==1);
 activated=-1;point.y=25;notesy_reader_tap_at(point);assert(activated==-1);point.y=150;notesy_reader_tap_at(point);assert(activated==-1);point.y=215;notesy_reader_tap_at(point);assert(activated==-1);point.y=100;s_loading=true;notesy_reader_tap_at(point);assert(activated==-1);s_loading=false;
 enabled=false;notesy_reader_tap_at(point);assert(activated==-1);enabled=true;s_rich=false;notesy_reader_tap_at(point);assert(actions==0);
}
`);execFileSync('cc',[path.join(dir,'test.c'),'-o',path.join(dir,'test')]);execFileSync(path.join(dir,'test'));}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('raw reader touch rejects drags, supports both swipe directions and ignores covered/loading views',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../src/c/main.c'),'utf8'),begin=source.indexOf('static bool s_reader_touch_tracking'),end=source.indexOf('\n#endif',begin),body=source.slice(begin,end);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'notesy-raw-touch-'));try{fs.writeFileSync(path.join(dir,'test.c'),`
#include <stdbool.h>
#include <stddef.h>
#include <assert.h>
typedef struct {int x,y;} GPoint;
#define GPoint(x,y) ((GPoint){x,y})
enum {TouchEvent_Touchdown,TouchEvent_PositionUpdate,TouchEvent_Liftoff};
typedef struct {int type;bool non_navigational;int x,y;} TouchEvent;
static void *s_reader=(void*)1,*top=(void*)1;static bool s_loading,s_stitch,s_rich=true;static int taps,up,down,backs;
static void *window_stack_get_top_window(void){return top;}
static void notesy_reader_tap_at(GPoint p){taps++;}
static void scroll_note(bool d){if(d)down++;else up++;}
static void rich_scroll_by(int d){scroll_note(d>0);}
static void back_click(void*r,void*c){backs++;}
${body}
static void event(int kind,int x,int y){TouchEvent e={kind,false,x,y};notesy_reader_touch(&e,NULL);}
int main(void){
 event(TouchEvent_Liftoff,40,100);assert(!taps);
 event(TouchEvent_Touchdown,40,100);event(TouchEvent_Liftoff,42,103);assert(taps==1);
 event(TouchEvent_Touchdown,40,100);event(TouchEvent_PositionUpdate,80,100);event(TouchEvent_Liftoff,40,100);assert(taps==1);
 event(TouchEvent_Touchdown,40,170);event(TouchEvent_Liftoff,40,60);assert(down==1&&taps==1);
 event(TouchEvent_Touchdown,40,60);event(TouchEvent_Liftoff,40,170);assert(up==1);
 event(TouchEvent_Touchdown,30,100);event(TouchEvent_Liftoff,140,110);assert(backs==1&&taps==1);
 event(TouchEvent_Touchdown,140,100);event(TouchEvent_Liftoff,30,100);assert(backs==1);
 event(TouchEvent_Touchdown,40,100);s_loading=true;event(TouchEvent_Liftoff,40,100);s_loading=false;assert(taps==1);
 event(TouchEvent_Touchdown,40,100);top=NULL;event(TouchEvent_Liftoff,40,100);top=s_reader;assert(taps==1);
 event(TouchEvent_Touchdown,40,100);TouchEvent ignored={TouchEvent_Liftoff,true,40,100};notesy_reader_touch(&ignored,NULL);assert(taps==1);
}
`);execFileSync('cc',[path.join(dir,'test.c'),'-o',path.join(dir,'test')]);execFileSync(path.join(dir,'test'));}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
