const {test}=require('node:test'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
test('native Double Back dispatches each view binding and finishes active stitching',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../src/c/main.c'),'utf8');
 const body=source.slice(source.indexOf('static void double_back('),source.indexOf('static void view_clicks(void){'));
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'notesy-back-'));
 try{fs.writeFileSync(path.join(dir,'test.c'),`
#include <stdbool.h>
#include <assert.h>
typedef void *ClickRecognizerRef;
static bool s_stitch;static void *s_body;static int s_buttons[14]={0,0,0,4,5,1,0,0,0,4,2,6,5,5};
static int action,back;
static void perform(int value){action=value;}
static void back_click(void*r,void*c){back++;}
${body}
int main(void){
 double_back(0,0);assert(action==5);
 s_buttons[12]=11;double_back(0,0);assert(action==14);
 s_body=(void*)1;double_back(0,0);assert(action==5);
 for(int i=1;i<=12;i++){s_buttons[13]=i;double_back(0,0);assert(action==(i>=8?i+3:i));}
 s_stitch=true;action=0;double_back(0,0);assert(back==1&&action==0);
}
`);execFileSync('cc',[path.join(dir,'test.c'),'-o',path.join(dir,'test')]);execFileSync(path.join(dir,'test'));}
 finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('reader status overlays hide automatically and cancel safely when the reader closes',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../src/c/main.c'),'utf8');
 const body=source.slice(source.indexOf('static AppTimer *s_reader_status_timer;'),source.indexOf('static void set_status('));
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'notesy-status-'));
 try{fs.writeFileSync(path.join(dir,'test.c'),`
#include <stdbool.h>
#include <stddef.h>
#include <assert.h>
typedef void Layer;typedef void AppTimer;
static void *s_page_label=(void*)1,*s_reader=(void*)2;static bool hidden;static int cancels,fronts;static const char *shown;static void (*callback)(void*);
static void layer_set_hidden(void*l,bool h){hidden=h;}static void *text_layer_get_layer(void*l){return l;}
static void text_layer_set_text(void*l,const char*t){shown=t;}static void layer_remove_from_parent(void*l){}
static void *window_get_root_layer(void*w){return w;}static void layer_add_child(void*p,void*l){fronts++;}
static void app_timer_cancel(void*t){cancels++;}static void *app_timer_register(int ms,void(*cb)(void*),void*c){assert(ms==4000);callback=cb;return (void*)3;}
${body}
int main(void){
 reader_status(NULL);assert(hidden&&!s_reader_status_timer);
 reader_status("Saved");assert(!hidden&&shown[0]=='S'&&fronts==1);callback(NULL);assert(hidden&&!s_reader_status_timer);
 reader_status("Error");reader_status("Retry");assert(cancels==1&&fronts==3);
 reader_status(NULL);assert(hidden&&cancels==2&&!s_reader_status_timer);
 s_page_label=NULL;reader_status("Closed");assert(!s_reader_status_timer);
}
`);execFileSync('cc',[path.join(dir,'test.c'),'-o',path.join(dir,'test')]);execFileSync(path.join(dir,'test'));}
 finally{fs.rmSync(dir,{recursive:true,force:true});}
});
