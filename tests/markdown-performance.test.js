const {test}=require('node:test'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
test('repeated styled redraws reuse glyph metrics and ordinary paragraphs draw in one call',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'notesy-metrics-')),header=path.resolve(__dirname,'../src/c/markdown.h');
 try{fs.writeFileSync(path.join(dir,'test.c'),`
#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>
#include <string.h>
#include <assert.h>
typedef int GFont;typedef void GContext;typedef struct {int x,y;} GPoint;typedef struct {int w,h;} GSize;typedef struct {GPoint origin;GSize size;} GRect;
#define GRect(x,y,w,h) ((GRect){{x,y},{w,h}})
#define GPoint(x,y) ((GPoint){x,y})
#define IMAGE_HEIGHT 150
#define RESOURCE_ID_ITALIC_18 11
#define RESOURCE_ID_ITALIC_24 12
#define RESOURCE_ID_ITALIC_30 13
#define FONT_KEY_GOTHIC_28_BOLD 14
#define FONT_KEY_GOTHIC_24_BOLD 15
#define FONT_KEY_GOTHIC_18_BOLD 16
#define GTextOverflowModeFill 0
#define GTextOverflowModeWordWrap 1
#define GTextAlignmentLeft 0
static int measured,drawn,lines,s_theme_size=22;
typedef struct {char text[241];uint8_t format;uint16_t text_height;} RichItem;
static GFont theme_title_font(void){return 1;}static GFont fonts_get_system_font(int k){return k;}static GFont fonts_load_custom_font(int h){return h;}static void fonts_unload_custom_font(GFont f){}static int resource_get_handle(int i){return i;}
static GSize graphics_text_layout_get_content_size(const char*t,GFont f,GRect b,int o,int a){measured++;return (GSize){(int)strlen(t)*6,24};}
static void graphics_draw_text(GContext*c,const char*t,GFont f,GRect b,int o,int a,void*v){drawn++;}
static void graphics_draw_line(GContext*c,GPoint a,GPoint b){lines++;}
#include "${header}"
int main(void){
 RichItem item={.text="\\2Repeated words repeated words repeated words\\1",.format=0};item.text_height=markdown_layout(NULL,&item,188,0);int warm=measured;assert(warm<25);
 for(int i=0;i<100;i++)markdown_layout((void*)1,&item,188,0);assert(measured==warm);
 RichItem plain={.text="An ordinary paragraph with several linked note labels",.format=0};plain.text_height=markdown_layout(NULL,&plain,188,0);int before=drawn;markdown_layout((void*)1,&plain,188,0);assert(drawn==before+1);
 markdown_reset_metrics();markdown_layout(NULL,&item,188,0);assert(measured>warm+1);
 RichItem multiline={.text="First\\nSecond\\nThird",.format=9};lines=0;markdown_layout((void*)1,&multiline,188,0);assert(lines==0);
 RichItem strike={.text="\\030old\\1 normal",.format=0};lines=0;markdown_layout((void*)1,&strike,188,0);assert(lines==3);
 RichItem combined={.text="\\031bold old\\nnext\\1 normal",.format=0};lines=0;markdown_layout((void*)1,&combined,188,0);assert(lines==12);
 assert(markdown_style('\\n')<0&&markdown_style('\\t')<0&&markdown_style(24)==8&&markdown_style(25)==9);
}
`);execFileSync('cc',[path.join(dir,'test.c'),'-o',path.join(dir,'test')],{stdio:'pipe'});execFileSync(path.join(dir,'test'));}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
