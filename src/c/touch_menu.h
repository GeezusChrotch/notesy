#pragma once
#include <pebble.h>

// Touch menus focus a different row first; tapping the focused row activates it.
// Center-focused mode supplies this behavior through the SDK widget recognizer.
static MenuLayer *organik_menu_create(GRect bounds) {
  MenuLayer *menu = menu_layer_create(bounds);
#if defined(PBL_TOUCH)
  if (menu) menu_layer_set_center_focused(menu, true);
#endif
  return menu;
}
// Center-focused mode is required for two-step touch activation, but its
// positive scroll offset leaves blank space above the first row. Clamp only
// that overscroll after layout changes; preserve negative scrolled positions.
static void organik_menu_clamp_start(MenuLayer *menu) {
  if (!menu) return;
  ScrollLayer *scroll = menu_layer_get_scroll_layer(menu);
  GPoint offset = scroll_layer_get_content_offset(scroll);
  if (offset.y > 0) scroll_layer_set_content_offset(scroll, GPoint( offset.x, 0), false);
}

static void organik_menu_reload_data(MenuLayer *menu) {
  menu_layer_reload_data(menu);
  organik_menu_clamp_start(menu);
}

static void organik_menu_set_callbacks(MenuLayer *menu, void *context, MenuLayerCallbacks callbacks) {
  menu_layer_set_callbacks(menu, context, callbacks);
  organik_menu_clamp_start(menu);
}

static void organik_menu_set_selected_index(MenuLayer *menu, MenuIndex index,
                                           MenuRowAlign align, bool animated) {
  menu_layer_set_selected_index(menu, index, align, animated);
  organik_menu_clamp_start(menu);
}

// Route each app's existing layout calls through the same startup invariant.
#define menu_layer_reload_data organik_menu_reload_data
#define menu_layer_set_callbacks organik_menu_set_callbacks
#define menu_layer_set_selected_index organik_menu_set_selected_index
