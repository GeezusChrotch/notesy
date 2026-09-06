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
