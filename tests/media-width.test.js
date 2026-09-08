const {test}=require('node:test'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
test('full-width media preserves source proportions and fills every visible pixel without full-size bitmap allocation',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'notesy-media-width-'));
 try{fs.writeFileSync(path.join(root,'test.c'),`
#include <stdint.h>
#include <assert.h>
#include <string.h>
#include <stdlib.h>
typedef struct{int x,y;}GPoint;typedef struct{int w,h;}GSize;typedef struct{GPoint origin;GSize size;}GRect;
#define GRect(x,y,w,h) ((GRect){{x,y},{w,h}})
#define IMAGE_HEIGHT 150
#define GCornerNone 0
typedef struct{uint8_t argb;}GColor;
typedef struct{int w,h,stride;uint8_t *pixels;}GBitmap;
typedef struct{int w,h,offset,calls;uint8_t color;uint8_t pixels[200*228];}GContext;
static GRect gbitmap_get_bounds(GBitmap*b){return GRect(0,0,b->w,b->h);}
static int gbitmap_get_bytes_per_row(GBitmap*b){return b->stride;}
static uint8_t *gbitmap_get_data(GBitmap*b){return b->pixels;}
static void graphics_context_set_fill_color(GContext*c,GColor color){c->color=color.argb;}
static void graphics_fill_rect(GContext*c,GRect r,int radius,int corners){
 c->calls++;
 for(int y=r.origin.y;y<r.origin.y+r.size.h;y++)for(int x=r.origin.x;x<r.origin.x+r.size.w;x++){
  int sy=y+c->offset;assert(x>=0&&x<c->w);if(sy>=0&&sy<c->h)c->pixels[sy*c->w+x]=c->color;
 }
}
#include "${path.join(__dirname,'../src/c/media.h')}"
static void check(int width,int original_w,int original_h,int stored_w,int stored_h,int offset){
 GRect target=media_rect(width,original_w,original_h);assert(target.size.w==width);
 assert(abs(target.size.h*original_w-width*original_h)<=original_w);
 int stride=(stored_w+3)&~3;uint8_t pixels[30000];memset(pixels,0,sizeof(pixels));
 for(int y=0;y<stored_h;y++)for(int x=0;x<stored_w;x++)pixels[y*stride+x]=192+(x+y*3)%64;
 GBitmap bitmap={stored_w,stored_h,stride,pixels};GContext ctx={.w=width,.h=228,.offset=offset};
 media_draw(&ctx,&bitmap,target,offset,ctx.h);
 for(int y=0;y<228;y++)for(int x=0;x<width;x++){
  int local=y-offset-target.origin.y;
  if(local<0||local>=target.size.h)assert(ctx.pixels[y*width+x]==0);
  else {int sx=x*stored_w/target.size.w,sy=local*stored_h/target.size.h;assert(ctx.pixels[y*width+x]==pixels[sy*stride+sx]);}
 }
 assert(ctx.calls>0);
}
int main(void){
 check(200,100,150,100,150,0);check(200,100,150,100,150,-200);
 check(144,120,100,104,80,0);check(144,80,100,60,75,-80);
 check(200,176,70,176,70,0);check(144,120,40,104,40,0);
 check(200,1,1,1,1,0);
 GRect extreme=media_rect(200,1,150);assert(extreme.size.h==2048&&extreme.size.w>=1&&extreme.size.w<200);assert((extreme.size.h+34)*15<32767);
 GRect pending=media_rect(144,0,0);assert(pending.size.w==144&&pending.size.h==150);
}
`);execFileSync('cc',[path.join(root,'test.c'),'-o',path.join(root,'test')]);execFileSync(path.join(root,'test'));}finally{fs.rmSync(root,{recursive:true,force:true});}
});
