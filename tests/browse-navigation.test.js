const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
test('native focus changes page in both directions with overlap and never page during restoration',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../src/c/main.c'),'utf8');
 function fn(name){const start=source.indexOf('static void '+name+'('),a=source.indexOf('{',start);let i=a+1,depth=1;while(depth){depth+=(source[i]==='{')-(source[i]==='}');i++;}return source.slice(start,i);}
 // Use the definition, not the forward declaration.
 const begin=source.indexOf('static void browse_boundary('),end=source.indexOf('static void press(',begin),body=source.slice(begin,end);
 assert.match(source,/\.selection_changed=browse_selection/);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'notesy-paging-'));
 try{fs.writeFileSync(path.join(dir,'test.c'),`
#include <stdbool.h>
#include <stddef.h>
#include <assert.h>
typedef void MenuLayer;typedef void AppTimer;
typedef struct {int row;} MenuIndex;
static bool s_loading,s_restoring_list;
static void *s_body;static MenuLayer *s_menu=(void*)1;
static AppTimer *s_browse_timer;
static int s_browse_direction,s_count=15,s_offset,s_total=48,s_restore_row,selected,loaded=-1;
static MenuIndex menu_layer_get_selected_index(MenuLayer*m){return (MenuIndex){selected};}
static void load_notes(int offset){loaded=offset;s_loading=true;}
static void marquee_reset(void){}
static void app_timer_cancel(AppTimer*t){}
static AppTimer *app_timer_register(int ms,void(*cb)(void*),void*c){return (void*)1;}
${body}
int main(void){
 selected=15;browse_selection(s_menu,(MenuIndex){15},(MenuIndex){14},NULL);assert(s_browse_timer);browse_boundary(NULL);assert(loaded==14&&s_restore_row==1);
 s_offset=14;s_loading=false;s_restoring_list=true;selected=1;browse_selection(s_menu,(MenuIndex){1},(MenuIndex){15},NULL);assert(!s_browse_timer);s_restoring_list=false;
 selected=2;browse_selection(s_menu,(MenuIndex){2},(MenuIndex){1},NULL);assert(!s_browse_timer);
 selected=15;browse_selection(s_menu,(MenuIndex){15},(MenuIndex){14},NULL);browse_boundary(NULL);assert(loaded==28);
 s_offset=28;s_loading=false;selected=1;browse_selection(s_menu,(MenuIndex){1},(MenuIndex){2},NULL);browse_boundary(NULL);assert(loaded==14&&s_restore_row==15);
 s_loading=false;s_offset=42;s_count=6;selected=6;browse_selection(s_menu,(MenuIndex){6},(MenuIndex){5},NULL);assert(!s_browse_timer);
 s_offset=0;selected=1;browse_selection(s_menu,(MenuIndex){1},(MenuIndex){2},NULL);assert(!s_browse_timer);
}
`);execFileSync('cc',[path.join(dir,'test.c'),'-o',path.join(dir,'test')]);execFileSync(path.join(dir,'test'));}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('Return to top cancels the old request, leaves the reader and preserves sort/filter',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../src/c/main.c'),'utf8');const a=source.indexOf('static void return_to_top(void){'),b=source.indexOf('static void perform(int action){',a);const body=source.slice(a,b);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'notesy-top-'));
 try{fs.writeFileSync(path.join(dir,'test.c'),`
#include <stdbool.h>
#include <assert.h>
static void *s_body=(void*)1;
static int s_request=10,s_count=15,s_offset=42,s_restore_row,s_sort=3,loaded=-1,pops,cleared;
static char s_snapshot[25]="snapshot",s_tag[65]="tag";
static bool s_loading=true,s_search=true;
static void window_stack_pop(bool animated){pops++;s_body=0;}
static void clear_timeout(void){cleared++;}
static void load_notes(int offset){loaded=offset;}
${body}
int main(void){return_to_top();assert(pops==1&&cleared==1&&s_request==11);assert(!s_loading&&!s_search&&!s_snapshot[0]);assert(s_count==0&&s_offset==0&&s_restore_row==1&&loaded==0);assert(s_sort==3&&s_tag[0]=='t');}
`);execFileSync('cc',[path.join(dir,'test.c'),'-o',path.join(dir,'test')]);execFileSync(path.join(dir,'test'));}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
