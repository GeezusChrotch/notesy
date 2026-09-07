// Exercise every active copy of the touch helper against the same SDK model.
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const repos = [path.resolve(__dirname, '..')];
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'organik-menu-start-'));
const sdk = `
#include <stdbool.h>
#include <assert.h>
#include <stddef.h>
typedef struct {int x,y;} GPoint;
#define GPoint(x,y) ((GPoint){x,y})
typedef int GRect;
typedef struct {int section,row;} MenuIndex;
typedef int MenuRowAlign;
typedef int MenuLayerCallbacks;
typedef struct {GPoint offset;} ScrollLayer;
typedef struct {ScrollLayer scroll; bool centered; int selected;} MenuLayer;
static MenuLayer instance;
static int generated_offset;
static MenuLayer *menu_layer_create(GRect bounds) {instance=(MenuLayer){0};return &instance;}
static void menu_layer_set_center_focused(MenuLayer *menu,bool enabled) {menu->centered=enabled;}
static ScrollLayer *menu_layer_get_scroll_layer(MenuLayer *menu) {return &menu->scroll;}
static GPoint scroll_layer_get_content_offset(ScrollLayer *scroll) {return scroll->offset;}
static void scroll_layer_set_content_offset(ScrollLayer *scroll,GPoint point,bool animated) {assert(!animated);scroll->offset=point;}
static void menu_layer_reload_data(MenuLayer *menu) {menu->scroll.offset=GPoint(0,generated_offset);}
static void menu_layer_set_callbacks(MenuLayer *menu,void *context,MenuLayerCallbacks callbacks) {menu_layer_reload_data(menu);}
static void menu_layer_set_selected_index(MenuLayer *menu,MenuIndex index,MenuRowAlign align,bool animated) {menu->selected=index.row;menu_layer_reload_data(menu);}
`;
try {
  fs.writeFileSync(path.join(dir,'pebble.h'),sdk);
  for(const repo of repos) {
    const header=path.join(repo,'src/c/touch_menu.h');
    const code=`#include "${header}"
int main(void) {
  MenuLayer *menu=organik_menu_create(240);
#if defined(PBL_TOUCH)
  assert(menu->centered);
#else
  assert(!menu->centered);
#endif
  for(int y=-500;y<=240;y++) {
    generated_offset=y;
    menu_layer_set_callbacks(menu,NULL,0);assert(menu->scroll.offset.y==(y>0?0:y));
    menu_layer_reload_data(menu);assert(menu->scroll.offset.y==(y>0?0:y));
    menu_layer_set_selected_index(menu,(MenuIndex){0,3},0,false);
    assert(menu->scroll.offset.y==(y>0?0:y));assert(menu->selected==3);
  }
  organik_menu_clamp_start(NULL);
}`;
    fs.writeFileSync(path.join(dir,'test.c'),code);
    for(const touch of [false,true]) {
      cp.execFileSync('cc',['-std=c99','-I',dir,...(touch?['-DPBL_TOUCH']:[]),path.join(dir,'test.c'),'-o',path.join(dir,'test')]);
      cp.execFileSync(path.join(dir,'test'));
    }
    console.log('Notesy: startup, refresh, selection restore, scrolled history, and two-step touch invariants passed');
  }
} finally {fs.rmSync(dir,{recursive:true,force:true});}
