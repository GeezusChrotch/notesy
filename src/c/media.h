#pragma once
// Fit the logical preview to the reader, independently of bitmap storage size.
// Bound pathological aspect ratios so 15 document rows fit Pebble's coordinates.
static GRect media_rect(int width,int source_width,int source_height){
  int height=source_width>0?(width*source_height+source_width/2)/source_width:IMAGE_HEIGHT;
  int drawn_width=width;
  if(height>2048){height=2048;drawn_width=source_height>0?height*source_width/source_height:width;}
  if(height<1)height=1;
  if(drawn_width<1)drawn_width=1;
  return GRect((width-drawn_width)/2,26,drawn_width,height);
}
// Pebble's bitmap draw call does not scale. Expand bounded bitmap runs directly
// into the clipped cell instead of allocating a full-width portrait bitmap.
static void media_draw(GContext *ctx,GBitmap *bitmap,GRect target,int screen_top,int screen_height){
  GRect source=gbitmap_get_bounds(bitmap);int stride=gbitmap_get_bytes_per_row(bitmap);
  const uint8_t *pixels=gbitmap_get_data(bitmap);
  for(int y=0;y<source.size.h;y++){
    int top=target.origin.y+(y*target.size.h+source.size.h-1)/source.size.h;
    int bottom=target.origin.y+((y+1)*target.size.h+source.size.h-1)/source.size.h;
    if(bottom<=top||screen_top+bottom<=0||screen_top+top>=screen_height)continue;
    const uint8_t *row=pixels+y*stride;
    for(int x=0;x<source.size.w;){
      int end=x+1;while(end<source.size.w&&row[end]==row[x])end++;
      int left=target.origin.x+(x*target.size.w+source.size.w-1)/source.size.w;
      int right=target.origin.x+(end*target.size.w+source.size.w-1)/source.size.w;
      if(right>left){graphics_context_set_fill_color(ctx,(GColor){.argb=row[x]});graphics_fill_rect(ctx,GRect(left,top,right-left,bottom-top),0,GCornerNone);}
      x=end;
    }
  }
}
