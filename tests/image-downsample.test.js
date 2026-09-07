const {test}=require('node:test'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
test('streaming preview downsampling fills every output pixel without writing outside bitmap rows',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../src/c/main.c'),'utf8'),start=source.indexOf('int x=(s_image_pixel%s_image_source_width)'),end=source.indexOf('s_image_pixel++;',start),body=source.slice(start,end);
 if(start<0||end<0)throw Error('Missing production downsample loop');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'notesy-image-map-'));try{fs.writeFileSync(path.join(dir,'test.c'),`
#include <stdint.h>
#include <assert.h>
#include <string.h>
static void check(int s_image_source_width,int s_image_source_height,int w,int h){
 uint8_t buffer[30000];memset(buffer,0,sizeof(buffer));uint8_t *dest=buffer+1,color=7;int stride=(w+3)&~3;struct{struct{int w,h;}size;}size={{w,h}};
 buffer[0]=19;buffer[1+stride*h]=23;
 for(int s_image_pixel=0;s_image_pixel<s_image_source_width*s_image_source_height;s_image_pixel++){${body}}
 assert(buffer[0]==19&&buffer[1+stride*h]==23);
 for(int y=0;y<h;y++){for(int x=0;x<w;x++)assert(dest[y*stride+x]==7);for(int x=w;x<stride;x++)assert(dest[y*stride+x]==0);}
}
int main(void){check(120,100,104,80);check(176,150,176,150);check(81,99,81,80);check(1,1,1,1);}
`);execFileSync('cc',[path.join(dir,'test.c'),'-o',path.join(dir,'test')]);execFileSync(path.join(dir,'test'));}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
