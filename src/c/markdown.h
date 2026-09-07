#pragma once
// Bounded inline layout: the measuring and drawing paths are identical, including
// style changes, UTF-8, long words and overflow scrolling. No full-note bitmap.
static GFont s_italic_font;static int s_italic_size;
static GFont markdown_font(uint8_t style,uint8_t format){
  if(style&2){int size=s_theme_size<=18?18:s_theme_size<=24?24:30;
    if(!s_italic_font||size!=s_italic_size){if(s_italic_font)fonts_unload_custom_font(s_italic_font);s_italic_size=size;s_italic_font=fonts_load_custom_font(resource_get_handle(size==18?RESOURCE_ID_ITALIC_18:size==24?RESOURCE_ID_ITALIC_24:RESOURCE_ID_ITALIC_30));}
    return s_italic_font;
  }
  if(format>=1&&format<=6)return fonts_get_system_font(format==1?FONT_KEY_GOTHIC_28_BOLD:format==2?FONT_KEY_GOTHIC_24_BOLD:FONT_KEY_GOTHIC_18_BOLD);
  return theme_title_font();
}
static int markdown_char(const char *p,char *out){
  int n=1;unsigned char c=(unsigned char)*p;if(c>=0xf0)n=4;else if(c>=0xe0)n=3;else if(c>=0xc0)n=2;
  for(int i=1;i<n;i++)if(!p[i]||((unsigned char)p[i]&0xc0)!=0x80){n=1;break;}
  memcpy(out,p,n);out[n]=0;return n;
}
static int markdown_width(const char *glyph,GFont font){
  // Pebble reports an empty box for a space on some fonts.
  if(glyph[0]==' '&&!glyph[1])return s_theme_size/4+1;
  int width=graphics_text_layout_get_content_size(glyph,font,GRect(0,0,512,128),GTextOverflowModeFill,GTextAlignmentLeft).w;
  return width>0?width:1;
}
static int markdown_layout(GContext *ctx,const RichItem *item,int width,int top){
  int inset=item->format==7||item->format==8?8:0,x=0,y=0;
  int line=item->format>=1&&item->format<=6?(item->format==1?34:item->format==2?30:24):s_theme_size+10;
  if(item->format>=1&&item->format<=6&&line<s_theme_size+10)line=s_theme_size+10;
  width-=inset;bool word_start=true;uint8_t style=0;const char *p=item->text;char glyph[5];
  while(*p){
    unsigned char c=(unsigned char)*p;if(c>=1&&c<=16){style=c-1;p++;continue;}
    if(c=='\n'){x=0;y+=line;p++;word_start=true;continue;}
    // Wrap a whole word when it fits on a line; split only oversized words.
    if(c!=' '&&word_start){
      const char *q=p;int word=0;uint8_t look=style;
      while(*q&&*q!=' '&&*q!='\n'){unsigned char z=(unsigned char)*q;if(z>=1&&z<=16){look=z-1;q++;continue;}int n=markdown_char(q,glyph);word+=markdown_width(glyph,markdown_font(look,item->format));q+=n;}
      if(x&&word<=width&&x+word>width){x=0;y+=line;}
    }
    int n=markdown_char(p,glyph);GFont font=markdown_font(style,item->format);int advance=markdown_width(glyph,font);
    if(x&&x+advance>width){x=0;y+=line;if(c==' '){p+=n;continue;}}
    if(ctx&&top+y+line>=0&&top+y<IMAGE_HEIGHT+160){
      GRect box=GRect(6+inset+x,top+y,advance+8,line+8);
      graphics_draw_text(ctx,glyph,font,box,GTextOverflowModeFill,GTextAlignmentLeft,NULL);
      if(style&1){box.origin.x++;graphics_draw_text(ctx,glyph,font,box,GTextOverflowModeFill,GTextAlignmentLeft,NULL);}
      if(style&8)graphics_draw_line(ctx,GPoint(6+inset+x,top+y+line/2),GPoint(6+inset+x+advance,top+y+line/2));
      if(style&4)graphics_draw_line(ctx,GPoint(6+inset+x,top+y+line-4),GPoint(6+inset+x+advance,top+y+line-4));
    }
    x+=advance;p+=n;word_start=c==' ';
  }
  if(ctx&&(item->format==7||item->format==8))graphics_draw_line(ctx,GPoint(8,top),GPoint(8,top+y+line));
  return y+line+16;
}
