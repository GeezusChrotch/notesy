#include <pebble.h>
#define MAX_NOTES 15
#define DRAFT_SIZE 768
typedef struct { char id[65]; char title[112]; bool folder,pinned; } Note;
static Window *s_main, *s_reader, *s_actions;
static MenuLayer *s_action_menu;
static bool s_scroll_to_end;
static char s_capture_target[65],s_draft_target[65],s_last_append_id[96],s_last_append_target[65],s_delete_id[96];
static MenuLayer *s_menu;
static ScrollLayer *s_scroll;
static TextLayer *s_body, *s_heading, *s_page_label;
static DictationSession *s_dictation;
static Note s_notes[MAX_NOTES],s_incoming[MAX_NOTES];
static char s_folder[65],s_root[65],s_vault[65],s_snapshot[25],s_folder_title[112]="Vault",s_note_parent[65];
static char s_capture_vault[65],s_capture_folder[65],s_draft_folder[65],s_draft_vault[65];
static int s_draft_api=1;
static bool s_browser,s_note_pinned,s_pin_value;
static int s_total,s_incoming_count,s_incoming_offset,s_incoming_total,s_restore_row;
static char s_incoming_snapshot[25];
static uint8_t s_buttons[12]={0,0,0,4,5,1,0,0,0,4,2,6};
typedef struct {char id[65],title[112],snapshot[25];int offset,row;} Location;
static Location s_history[24];static int s_depth;
static void perform(int action);
static void refresh_list(void);
static void main_clicks(void *context);
static void reader_clicks(void *context);
static int s_count, s_offset, s_page, s_pages;
static uint32_t s_request;
static char s_status[160] = "Connecting to phone…";
static char s_body_text[1024], s_title[128], s_current_id[65], s_heading_title[128];
static char s_draft[DRAFT_SIZE], s_draft_id[96];
static bool s_pending, s_ready, s_auto, s_auto_used, s_loading;
static int s_theme;
static uint8_t s_theme_font, s_theme_size=24;
#if defined(PBL_PLATFORM_EMERY)
static GFont s_custom_theme_font;
static uint8_t s_custom_theme_font_id=255,s_custom_theme_font_size;
#endif
static GColor s_selection_text;
static bool s_custom_colors;
static GColor s_background, s_foreground, s_highlight;
static AppTimer *s_timeout;


static void set_status(const char *text) {
  snprintf(s_status, sizeof(s_status), "%s", text);
  if (s_menu) menu_layer_reload_data(s_menu);
  if(s_page_label)text_layer_set_text(s_page_label,s_status);
}
static void clear_timeout(void) { if (s_timeout) { app_timer_cancel(s_timeout); s_timeout = NULL; } }
static void timed_out(void *unused) {
  s_timeout = NULL; s_loading = false;s_scroll_to_end=false;
  if(s_page_label)text_layer_set_text(s_page_label,"No reply · scroll to retry");
  set_status(s_pending ? "Draft kept · select to retry" : "No reply · double Back for actions");
}
static void send_command(int command, const char *id, int page, const char *text) {
  DictionaryIterator *iter;
  if (app_message_outbox_begin(&iter) != APP_MSG_OK) { s_loading=false;set_status("Phone busy · please retry"); return; }
  dict_write_int(iter, MESSAGE_KEY_COMMAND, &command, sizeof(command), true);
  dict_write_uint32(iter, MESSAGE_KEY_REQUEST, ++s_request);
  dict_write_int(iter, MESSAGE_KEY_PAGE, &page, sizeof(page), true);
  dict_write_uint8(iter,MESSAGE_KEY_API,command==3?s_draft_api:2);
  if(command==1){dict_write_cstring(iter,MESSAGE_KEY_FOLDER_ID,s_folder);dict_write_cstring(iter,MESSAGE_KEY_SNAPSHOT,s_snapshot);}
  if(command==3&&s_draft_api==2){dict_write_cstring(iter,MESSAGE_KEY_FOLDER_ID,s_draft_folder);dict_write_cstring(iter,MESSAGE_KEY_VAULT_ID,s_draft_vault);}
  if(command==6)dict_write_uint8(iter,MESSAGE_KEY_PINNED,s_pin_value);
  if (id) dict_write_cstring(iter, MESSAGE_KEY_NOTE_ID, id);
  if (text) dict_write_cstring(iter, MESSAGE_KEY_TEXT, text);
  if(command==3&&s_draft_target[0])dict_write_cstring(iter,MESSAGE_KEY_TARGET_ID,s_draft_target);
  if (app_message_outbox_send() != APP_MSG_OK) { s_loading=false;set_status("Phone unavailable · draft kept"); return; }
  clear_timeout(); s_timeout = app_timer_register(18000, timed_out, NULL);
}
static void load_notes(int offset) {
  if (!s_ready||!s_browser) { set_status("Update the Mac connector, then reopen StoneNotes"); return; }
  s_loading = true;s_incoming_count=-1;
  set_status("Loading folder…"); send_command(1, NULL, offset, NULL);
}
#if defined(PBL_PLATFORM_EMERY)
static void unload_custom_theme_font(void) {
  if (s_custom_theme_font) {
    fonts_unload_custom_font(s_custom_theme_font);
    s_custom_theme_font = NULL;
  }
  s_custom_theme_font_id = 255;
  s_custom_theme_font_size = 0;
}

static uint8_t custom_size_index(void) {
  if (s_theme_size <= 14) return 0;
  if (s_theme_size <= 18) return 1;
  if (s_theme_size <= 22) return 2;
  if (s_theme_size <= 26) return 3;
  return 4;
}

static GFont time2_theme_font(void) {
  static const uint32_t font_resources[5][5] = {
    {RESOURCE_ID_INTER_14, RESOURCE_ID_INTER_18, RESOURCE_ID_INTER_22,
     RESOURCE_ID_INTER_26, RESOURCE_ID_INTER_30},
    {RESOURCE_ID_ROBOTO_14, RESOURCE_ID_ROBOTO_18, RESOURCE_ID_ROBOTO_22,
     RESOURCE_ID_ROBOTO_26, RESOURCE_ID_ROBOTO_30},
    {RESOURCE_ID_OPEN_SANS_14, RESOURCE_ID_OPEN_SANS_18, RESOURCE_ID_OPEN_SANS_22,
     RESOURCE_ID_OPEN_SANS_26, RESOURCE_ID_OPEN_SANS_30},
    {RESOURCE_ID_MONTSERRAT_14, RESOURCE_ID_MONTSERRAT_18, RESOURCE_ID_MONTSERRAT_22,
     RESOURCE_ID_MONTSERRAT_26, RESOURCE_ID_MONTSERRAT_30},
    {RESOURCE_ID_POPPINS_14, RESOURCE_ID_POPPINS_18, RESOURCE_ID_POPPINS_22,
     RESOURCE_ID_POPPINS_26, RESOURCE_ID_POPPINS_30},
  };
  uint8_t family = s_theme_font - 5;
  uint8_t size_index = custom_size_index();
  uint8_t actual_size = (uint8_t[]){14, 18, 22, 26, 30}[size_index];
  if (s_custom_theme_font && s_custom_theme_font_id == s_theme_font &&
      s_custom_theme_font_size == actual_size) {
    return s_custom_theme_font;
  }
  unload_custom_theme_font();
  s_custom_theme_font = fonts_load_custom_font(
    resource_get_handle(font_resources[family][size_index]));
  s_custom_theme_font_id = s_theme_font;
  s_custom_theme_font_size = actual_size;
  return s_custom_theme_font ? s_custom_theme_font :
    fonts_get_system_font(FONT_KEY_GOTHIC_24);
}
#endif

static GFont theme_title_font(void) {
#if defined(PBL_PLATFORM_EMERY)
  if (s_theme_font >= 5 && s_theme_font <= 9) return time2_theme_font();
  unload_custom_theme_font();
#endif
  if (s_theme_font == 2) return fonts_get_system_font(FONT_KEY_ROBOTO_CONDENSED_21);
  if (s_theme_font == 3) return fonts_get_system_font(FONT_KEY_DROID_SERIF_28_BOLD);
  if (s_theme_font == 4) return fonts_get_system_font(FONT_KEY_BITHAM_30_BLACK);
  if (s_theme_font == 1) {
    if (s_theme_size <= 14) return fonts_get_system_font(FONT_KEY_GOTHIC_14_BOLD);
    if (s_theme_size <= 18) return fonts_get_system_font(FONT_KEY_GOTHIC_18_BOLD);
    if (s_theme_size >= 28) return fonts_get_system_font(FONT_KEY_GOTHIC_28_BOLD);
    return fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD);
  }
  if (s_theme_size <= 14) return fonts_get_system_font(FONT_KEY_GOTHIC_14);
  if (s_theme_size <= 18) return fonts_get_system_font(FONT_KEY_GOTHIC_18);
  if (s_theme_size >= 28) return fonts_get_system_font(FONT_KEY_GOTHIC_28);
  return fonts_get_system_font(FONT_KEY_GOTHIC_24);
}


static void apply_theme(void) {
  if (!s_custom_colors) {
  s_background = s_theme == 1 ? GColorDarkGreen : s_theme == 2 ? GColorOxfordBlue : GColorWhite;
  s_foreground = s_theme == 0 ? GColorBlack : GColorWhite;
  s_highlight = s_theme == 1 ? GColorMintGreen : s_theme == 2 ? GColorVividCerulean : GColorBlack;
  s_selection_text=s_theme==0?GColorWhite:GColorBlack;
  }
  GFont font=theme_title_font();
  window_set_background_color(s_main, s_background);
  menu_layer_set_normal_colors(s_menu, s_background, s_foreground);
  menu_layer_set_highlight_colors(s_menu, s_highlight, s_selection_text);
  menu_layer_reload_data(s_menu);
  if (s_body) {
    text_layer_set_font(s_body,font);
    text_layer_set_font(s_heading,font);
    GRect bounds=layer_get_bounds(window_get_root_layer(s_reader));
    layer_set_frame(text_layer_get_layer(s_heading),GRect(4,0,bounds.size.w-8,s_theme_size+10));
    scroll_layer_set_frame(s_scroll,GRect(0,s_theme_size+12,bounds.size.w,bounds.size.h-s_theme_size-33));
    window_set_background_color(s_reader, s_background);
    TextLayer *layers[] = {s_body, s_heading, s_page_label};
    for (unsigned i=0; i<3; i++) { text_layer_set_background_color(layers[i], s_background); text_layer_set_text_color(layers[i], s_foreground); }
  }
}
static bool persist_draft(void) {
  size_t len = strlen(s_draft)+1;
  for (size_t i=0; i<len; i+=192) {
    size_t size = len-i < 192 ? len-i : 192;
    if (persist_write_data(110+i/192, s_draft+i, size) != (int)size) return false;
  }
  if(persist_write_string(102,s_draft_target)<0||persist_write_string(103,s_draft_folder)<0||persist_write_string(104,s_draft_vault)<0||persist_write_int(105,s_draft_api)<0)return false;
  if (persist_write_string(101, s_draft_id) < 0) return false;
  return persist_write_int(100, len) > 0;
}
static void clear_draft(void) {
  persist_delete(100); persist_delete(101);persist_delete(102);persist_delete(103);persist_delete(104);persist_delete(105);s_draft_target[0]=0;
  for (int i=0; i<4; i++) persist_delete(110+i);
  s_pending=false; s_draft[0]=0; s_draft_id[0]=0;
}
static void retry_draft(void) {
  set_status("Sending draft to phone…"); send_command(3, s_draft_id, 0, s_draft);
}
static void dictation_done(DictationSession *session, DictationSessionStatus status, char *text, void *context) {
  if (status != DictationSessionStatusSuccess) { set_status("Dictation cancelled or unavailable"); return; }
  if (!text || !text[0]) { set_status("No speech detected"); return; }
  if (strlen(text) >= sizeof(s_draft)) { set_status("Note too long · try a shorter thought"); return; }
  snprintf(s_draft, sizeof(s_draft), "%s", text);
  snprintf(s_draft_target,sizeof(s_draft_target),"%s",s_capture_target);
  snprintf(s_draft_folder,sizeof(s_draft_folder),"%s",s_capture_folder);snprintf(s_draft_vault,sizeof(s_draft_vault),"%s",s_capture_vault);s_draft_api=2;
  time_t now; uint16_t ms; time_ms(&now, &ms);
  snprintf(s_draft_id, sizeof(s_draft_id), "%lu-%u-%lu-%lu", (unsigned long)now, ms, (unsigned long)rand(), (unsigned long)rand());
  if(s_draft_target[0]){snprintf(s_last_append_id,sizeof(s_last_append_id),"%s",s_draft_id);snprintf(s_last_append_target,sizeof(s_last_append_target),"%s",s_draft_target);}
  s_pending = true;
  if (!persist_draft()) { set_status("Watch storage full · keep app open and retry"); return; }
  retry_draft();
}
static void dictate_to(const char *target,const char *folder) {
  if (s_pending) { retry_draft(); return; }
  if (!s_ready||!s_browser||!s_vault[0]||!folder[0]) { set_status("Open Pebble and reload the vault first"); return; }
  if (s_dictation) {
    snprintf(s_capture_target,sizeof(s_capture_target),"%s",target);
    snprintf(s_capture_folder,sizeof(s_capture_folder),"%s",folder);snprintf(s_capture_vault,sizeof(s_capture_vault),"%s",s_vault);
    s_loading=false;++s_request;clear_timeout();dictation_session_start(s_dictation);
  } else set_status("Dictation requires a microphone and phone");
}
static void dictate(void){dictate_to("",s_body?s_note_parent:s_folder);}
static uint16_t row_count(MenuLayer *menu, uint16_t section, void *context) { return 1+s_count; }
static int16_t row_height(MenuLayer *menu, MenuIndex *index, void *context) { return index->row == 0 ? 70 : s_theme_size+32; }
static const char *note_title(const char *full, char *date, size_t size) {
  if(strlen(full)>13 && full[4]=='-' && full[7]=='-' && full[10]==' ') {
    const char *split=strstr(full," - ");
    if(split){const char *second=strstr(split+3," - ");if(second && second-split>=8 && second-split<=11 && split[3]>='0' && split[3]<='9' && second[-1]=='m' && (second[-2]=='a'||second[-2]=='p'))split=second;
      if(date)snprintf(date,size,"%.*s",(int)(split-full),full);
      return split+3;}
  }
  if(date&&size)date[0]=0;
  return full;
}
static void draw_row(GContext *ctx, const Layer *cell, MenuIndex *index, void *context) {
  int row=index->row; const char *title,*subtitle=NULL;
  if(row==0){title=s_pending?"Retry draft":"New note";subtitle=s_status;}
  else if(row<=s_count){
    static char date[40],label[80];Note *n=&s_notes[row-1];title=n->folder?n->title:note_title(n->title,date,sizeof(date));
    snprintf(label,sizeof(label),"%s%s%s",n->pinned?"Pinned / ":"",n->folder?"Folder":(date[0]?date:"Note"),"");subtitle=label;
  }else title="Loading…";
  GRect bounds=layer_get_bounds(cell);
  graphics_context_set_text_color(ctx,menu_cell_layer_is_highlighted(cell)?s_selection_text:s_foreground);
  int h=s_theme_size+8;
  graphics_draw_text(ctx,title,theme_title_font(),GRect(6,subtitle?0:(bounds.size.h-h)/2-2,bounds.size.w-12,h),GTextOverflowModeTrailingEllipsis,GTextAlignmentLeft,NULL);
  if(subtitle)graphics_draw_text(ctx,subtitle,fonts_get_system_font(FONT_KEY_GOTHIC_14),GRect(6,h,bounds.size.w-12,bounds.size.h-h),GTextOverflowModeWordWrap,GTextAlignmentLeft,NULL);
}
static void render_note(void) {
  GRect bounds = layer_get_bounds(window_get_root_layer(s_reader));
  layer_set_frame(text_layer_get_layer(s_body), GRect(4, 0, bounds.size.w-8, 3000));
  text_layer_set_text(s_body, s_body_text);
  GSize size = text_layer_get_content_size(s_body);
  layer_set_frame(text_layer_get_layer(s_body), GRect(4, 0, bounds.size.w-8, size.h+10));
  scroll_layer_set_content_size(s_scroll, GSize(bounds.size.w, size.h+10));
  int end=size.h+10-layer_get_frame(scroll_layer_get_layer(s_scroll)).size.h;
  scroll_layer_set_content_offset(s_scroll, s_scroll_to_end&&end>0?GPoint(0,-end):GPointZero, false);
  s_scroll_to_end=false;
  snprintf(s_heading_title,sizeof(s_heading_title),"%s",note_title(s_title,NULL,0));
  text_layer_set_text(s_heading, s_heading_title);
  text_layer_set_text(s_page_label, "Double Back: actions");
}
static void scroll_note(bool down) {
  if(s_loading||!s_scroll)return;
  GPoint offset=scroll_layer_get_content_offset(s_scroll);
  int content=scroll_layer_get_content_size(s_scroll).h;
  int visible=layer_get_frame(scroll_layer_get_layer(s_scroll)).size.h;
  int bottom=content>visible?visible-content:0;
  if((down&&offset.y<=bottom)||(!down&&offset.y>=0)){
    int target=s_page+(down?1:-1);
    if(target<0||target>=s_pages)return;
    s_scroll_to_end=!down;s_loading=true;
    text_layer_set_text(s_page_label,"Loading more…");
    send_command(2,s_current_id,target,NULL);return;
  }
  int step=s_theme_size+8;
  int y=offset.y+(down?-step:step);if(y<bottom)y=bottom;if(y>0)y=0;
  scroll_layer_set_content_offset(s_scroll,GPoint(0,y),false);
}
static void open_actions(ClickRecognizerRef recognizer,void *context);
static void move_selection(bool down){
  if(s_loading)return;
  int row=menu_layer_get_selected_index(s_menu).row;
  if(down&&row==s_count&&s_offset+s_count<s_total){s_restore_row=1;load_notes(s_offset+MAX_NOTES);return;}
  if(!down&&row<=1&&s_offset>0){s_restore_row=MAX_NOTES;load_notes(s_offset-MAX_NOTES);return;}
  int next=row+(down?1:-1);if(next<0||next>s_count)return;
  menu_layer_set_selected_index(s_menu,MenuIndex(0,next),MenuRowAlignCenter,true);
}
static void press(ClickRecognizerRef recognizer,void *context){
  int button=click_recognizer_get_button_id(recognizer)-BUTTON_ID_UP;
  if(button<0||button>2)return;
  int action=s_buttons[(s_body?6:0)+button];
  if(action)perform(action);
  else if(button==1)perform(s_body?5:8);
  else if(s_body)scroll_note(button==2);else move_selection(button==2);
}
static void long_press(ClickRecognizerRef recognizer,void *context){
  int button=click_recognizer_get_button_id(recognizer)-BUTTON_ID_UP;
  if(button>=0&&button<=2){int action=s_buttons[(s_body?9:3)+button];if(action)perform(action);else if(button==1)perform(s_body?5:8);else if(s_body)scroll_note(button==2);else move_selection(button==2);}
}
static void back_click(ClickRecognizerRef recognizer,void *context){
  if(s_body){window_stack_pop(true);if(!s_snapshot[0])refresh_list();return;}
  if(!s_depth){window_stack_pop(true);return;}
  ++s_request;clear_timeout();s_loading=false;
  Location *loc=&s_history[--s_depth];snprintf(s_folder,sizeof(s_folder),"%s",loc->id);snprintf(s_folder_title,sizeof(s_folder_title),"%s",loc->title);snprintf(s_snapshot,sizeof(s_snapshot),"%s",loc->snapshot);s_restore_row=loc->row;
  s_count=0;menu_layer_reload_data(s_menu);load_notes(loc->offset);
}
static void view_clicks(void){
  for(int i=BUTTON_ID_UP;i<=BUTTON_ID_DOWN;i++){
    window_single_click_subscribe(i,press);window_long_click_subscribe(i,600,long_press,NULL);
  }
  window_single_click_subscribe(BUTTON_ID_BACK,back_click);
  window_multi_click_subscribe(BUTTON_ID_BACK,2,2,300,true,open_actions);
}
static void main_clicks(void *context){view_clicks();}
static void reader_clicks(void *context){view_clicks();}
static Note *selected_note(void){int row=menu_layer_get_selected_index(s_menu).row;return row>0&&row<=s_count?&s_notes[row-1]:NULL;}
static uint16_t action_rows(MenuLayer *menu,uint16_t section,void *context){return s_body?7:8;}
static int action_code(int row){static const int browsing[]={8,1,2,4,3,7,9,10},reading[]={2,4,3,1,7,9,10};return s_body?reading[row]:browsing[row];}
static void action_draw(GContext *ctx,const Layer *cell,MenuIndex *index,void *context){
  int action=action_code(index->row);Note *n=selected_note();bool pinned=s_body?s_note_pinned:(n&&n->pinned);
  const char *title=action==8?"Open selected":action==1?"New note":action==2?"Append dictation":action==4?(pinned?"Unpin":"Pin to main page"):action==3?"Delete note":action==7?"Refresh":action==9?"Move up":"Move down";
  GRect bounds=layer_get_bounds(cell);graphics_context_set_text_color(ctx,menu_cell_layer_is_highlighted(cell)?s_selection_text:s_foreground);
  graphics_draw_text(ctx,title,theme_title_font(),GRect(6,4,bounds.size.w-12,bounds.size.h-4),GTextOverflowModeTrailingEllipsis,GTextAlignmentLeft,NULL);
}
static int16_t action_height(MenuLayer *menu,MenuIndex *index,void *context){return s_theme_size+18;}
static void action_selected(MenuLayer *menu,MenuIndex *index,void *context){int action=action_code(index->row);window_stack_pop(true);perform(action);}
static void actions_load(Window *window){
  s_action_menu=menu_layer_create(layer_get_bounds(window_get_root_layer(window)));
  menu_layer_set_callbacks(s_action_menu,NULL,(MenuLayerCallbacks){.get_num_rows=action_rows,.get_cell_height=action_height,.draw_row=action_draw,.select_click=action_selected});
  menu_layer_set_normal_colors(s_action_menu,s_background,s_foreground);menu_layer_set_highlight_colors(s_action_menu,s_highlight,s_selection_text);
  menu_layer_set_click_config_onto_window(s_action_menu,window);layer_add_child(window_get_root_layer(window),menu_layer_get_layer(s_action_menu));
}
static void actions_unload(Window *window){menu_layer_destroy(s_action_menu);s_action_menu=NULL;}
static void open_actions(ClickRecognizerRef recognizer,void *context){
  if(s_action_menu)return;
  if(s_actions)window_destroy(s_actions);
  s_actions=window_create();window_set_window_handlers(s_actions,(WindowHandlers){.load=actions_load,.unload=actions_unload});window_stack_push(s_actions,true);
}
static void reader_unload(Window *window) {
  s_loading=false; ++s_request; clear_timeout();
  text_layer_destroy(s_body); text_layer_destroy(s_heading); text_layer_destroy(s_page_label); scroll_layer_destroy(s_scroll);
  s_body=NULL; s_heading=NULL; s_page_label=NULL; s_scroll=NULL;
}
static void reader_load(Window *window) {
  GRect bounds=layer_get_bounds(window_get_root_layer(window));
  s_heading=text_layer_create(GRect(4,0,bounds.size.w-8,s_theme_size+10)); text_layer_set_font(s_heading,fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD));
  s_scroll=scroll_layer_create(GRect(0,s_theme_size+12,bounds.size.w,bounds.size.h-s_theme_size-33));
  s_body=text_layer_create(GRect(4,0,bounds.size.w-8,1500)); text_layer_set_font(s_body,fonts_get_system_font(FONT_KEY_GOTHIC_24));
  text_layer_set_overflow_mode(s_body,GTextOverflowModeWordWrap);
  s_page_label=text_layer_create(GRect(4,bounds.size.h-20,bounds.size.w-8,20)); text_layer_set_font(s_page_label,fonts_get_system_font(FONT_KEY_GOTHIC_14));
  layer_add_child(window_get_root_layer(window),text_layer_get_layer(s_heading));
  layer_add_child(window_get_root_layer(window),scroll_layer_get_layer(s_scroll));
  scroll_layer_add_child(s_scroll,text_layer_get_layer(s_body));
  layer_add_child(window_get_root_layer(window),text_layer_get_layer(s_page_label));
  scroll_layer_set_callbacks(s_scroll,(ScrollLayerCallbacks){.click_config_provider=reader_clicks});
  scroll_layer_set_click_config_onto_window(s_scroll,window);
  apply_theme(); render_note();
}
static void open_selected(void){
  if(s_loading)return;
  Note *n=selected_note();if(!n){dictate();return;}
  if(n->folder){
    if(s_depth>=24){set_status("Folder depth limit reached");return;}
    Location *loc=&s_history[s_depth++];snprintf(loc->id,sizeof(loc->id),"%s",s_folder);snprintf(loc->title,sizeof(loc->title),"%s",s_folder_title);snprintf(loc->snapshot,sizeof(loc->snapshot),"%s",s_snapshot);loc->offset=s_offset;loc->row=menu_layer_get_selected_index(s_menu).row;
    snprintf(s_folder,sizeof(s_folder),"%s",n->id);snprintf(s_folder_title,sizeof(s_folder_title),"%s",n->title);s_count=0;s_total=0;s_offset=0;refresh_list();return;
  }
  s_delete_id[0]=0;s_scroll_to_end=false;s_note_pinned=n->pinned;
  snprintf(s_current_id,sizeof(s_current_id),"%s",n->id);snprintf(s_title,sizeof(s_title),"%s",n->title);s_note_parent[0]=0;
  snprintf(s_body_text,sizeof(s_body_text),"Loading…");s_page=0;s_pages=1;
  if(s_reader)window_destroy(s_reader);
  s_reader=window_create();window_set_window_handlers(s_reader,(WindowHandlers){.load=reader_load,.unload=reader_unload});
  window_stack_push(s_reader,true);s_loading=true;send_command(2,s_current_id,0,NULL);
}
static void refresh_list(void){s_snapshot[0]=0;s_restore_row=0;load_notes(0);}
static void perform(int action){
  if(action==5){open_actions(NULL,NULL);return;}
  if(action==6)return;
  if(action==7){s_loading=false;if(s_body){s_page=0;s_loading=true;send_command(2,s_current_id,0,NULL);}else refresh_list();return;}
  if(action==9||action==10){if(s_body)scroll_note(action==10);else move_selection(action==10);return;}
  if(s_loading){set_status("Please wait for the current request");return;}
  if(action==1){dictate();return;}
  if(action==8){open_selected();return;}
  Note *n=selected_note();const char *id=s_body?s_current_id:(n?n->id:NULL);
  if(!id){set_status("Select a note or folder first");return;}
  if(action==4){s_pin_value=!(s_body?s_note_pinned:n->pinned);s_loading=true;set_status(s_pin_value?"Pinning…":"Unpinning…");send_command(6,id,0,NULL);return;}
  if(!s_body&&n->folder){set_status("Append and Delete apply to notes");return;}
  if(action==2){dictate_to(id,s_body?s_note_parent:s_folder);return;}
  if(action==3){
    // A fresh operation ID per explicit selection; server receipts make transport retries safe.
    snprintf(s_delete_id,sizeof(s_delete_id),"delete-%lu-%lu",(unsigned long)time(NULL),(unsigned long)rand());
    s_loading=true;set_status("Deleting…");send_command(5,id,0,s_delete_id);
  }
}
static void inbox(DictionaryIterator *iter, void *context) {
  Tuple *type=dict_find(iter,MESSAGE_KEY_TYPE);if(!type)return;
  Tuple *request=dict_find(iter,MESSAGE_KEY_REQUEST);int kind=type->value->int32;
  if(request&&request->value->uint32!=0&&request->value->uint32!=s_request)return;
  Tuple *text=dict_find(iter,MESSAGE_KEY_TEXT), *id=dict_find(iter,MESSAGE_KEY_NOTE_ID), *title=dict_find(iter,MESSAGE_KEY_TITLE);
  if(kind==6) {
    Tuple *api=dict_find(iter,MESSAGE_KEY_API),*vault=dict_find(iter,MESSAGE_KEY_VAULT_ID),*root=dict_find(iter,MESSAGE_KEY_FOLDER_ID),*buttons=dict_find(iter,MESSAGE_KEY_BUTTONS);
    s_browser=api&&api->value->int32==2;
    if(vault){if(strcmp(s_vault,vault->value->cstring)!=0){s_folder[0]=0;s_snapshot[0]=0;s_depth=0;}snprintf(s_vault,sizeof(s_vault),"%s",vault->value->cstring);}
    if(root){bool changed=strcmp(s_root,root->value->cstring)!=0;snprintf(s_root,sizeof(s_root),"%s",root->value->cstring);if(changed||!s_folder[0]){snprintf(s_folder,sizeof(s_folder),"%s",s_root);s_depth=0;s_snapshot[0]=0;s_count=0;s_offset=0;}}
    if(buttons){const char *value=buttons->value->cstring;for(int i=0;i<12&&*value;i++){if(*value>='0'&&*value<='7')s_buttons[i]=*value-'0';value=strchr(value,',');if(!value)break;value++;}}
    s_ready=true;Tuple *theme=dict_find(iter,MESSAGE_KEY_THEME),*aut=dict_find(iter,MESSAGE_KEY_AUTO);
    if(theme)s_theme=theme->value->int32;
    Tuple *bg=dict_find(iter,MESSAGE_KEY_THEME_BACKGROUND),*fg=dict_find(iter,MESSAGE_KEY_THEME_TEXT),*sel=dict_find(iter,MESSAGE_KEY_THEME_SELECTION),*st=dict_find(iter,MESSAGE_KEY_THEME_SELECTION_TEXT),*font=dict_find(iter,MESSAGE_KEY_THEME_FONT),*size=dict_find(iter,MESSAGE_KEY_THEME_SIZE);
    if(bg&&fg&&sel&&st){s_custom_colors=true;s_background.argb=bg->value->uint8;s_foreground.argb=fg->value->uint8;s_highlight.argb=sel->value->uint8;s_selection_text.argb=st->value->uint8;}
    if(font)s_theme_font=font->value->uint8<=9?font->value->uint8:0;
    if(size)s_theme_size=size->value->uint8>=14&&size->value->uint8<=30?size->value->uint8:24;
    apply_theme();s_auto=aut&&aut->value->int32;
    if(s_pending)retry_draft();else if(s_body){s_loading=true;send_command(2,s_current_id,s_page,NULL);}else if(s_auto&&!s_auto_used){s_auto_used=true;dictate();}else {s_restore_row=0;load_notes(0);}
  } else if(kind==1) {
    Tuple *count=dict_find(iter,MESSAGE_KEY_COUNT),*offset=dict_find(iter,MESSAGE_KEY_PAGE),*total=dict_find(iter,MESSAGE_KEY_TOTAL),*snapshot=dict_find(iter,MESSAGE_KEY_SNAPSHOT);
    s_incoming_count=count?count->value->int32:0;if(s_incoming_count>MAX_NOTES||s_incoming_count<0)s_incoming_count=-1;
    s_incoming_offset=offset?offset->value->int32:0;s_incoming_total=total?total->value->int32:0;
    if(snapshot)snprintf(s_incoming_snapshot,sizeof(s_incoming_snapshot),"%s",snapshot->value->cstring);
    if(title)snprintf(s_folder_title,sizeof(s_folder_title),"%s",title->value->cstring);
    memset(s_incoming,0,sizeof(s_incoming));
  } else if(kind==2) {
    Tuple *index=dict_find(iter,MESSAGE_KEY_INDEX),*folder=dict_find(iter,MESSAGE_KEY_ENTRY_KIND),*pinned=dict_find(iter,MESSAGE_KEY_PINNED);int i=index?index->value->int32:-1;
    if(i>=0&&i<s_incoming_count&&id&&title){snprintf(s_incoming[i].id,sizeof(s_incoming[i].id),"%s",id->value->cstring);snprintf(s_incoming[i].title,sizeof(s_incoming[i].title),"%s",title->value->cstring);s_incoming[i].folder=folder&&folder->value->int32;s_incoming[i].pinned=pinned&&pinned->value->int32;}
  } else if(kind==3) {
    clear_timeout();s_loading=false;
    bool complete=s_incoming_count>=0;for(int i=0;i<s_incoming_count;i++){if(!s_incoming[i].id[0])complete=false;}
    if(!complete){set_status("List interrupted · double Back to refresh");return;}
    memcpy(s_notes,s_incoming,sizeof(s_notes));s_count=s_incoming_count;s_offset=s_incoming_offset;s_total=s_incoming_total;
    snprintf(s_snapshot,sizeof(s_snapshot),"%s",s_incoming_snapshot);
    set_status(s_folder_title);
    int row=s_restore_row;if(row>s_count)row=s_count;if(row<0)row=0;
    menu_layer_set_selected_index(s_menu,MenuIndex(0,row),row?MenuRowAlignCenter:MenuRowAlignTop,false);
  } else if(kind==4&&s_body) {
    clear_timeout();s_loading=false;Tuple *page=dict_find(iter,MESSAGE_KEY_PAGE),*count=dict_find(iter,MESSAGE_KEY_COUNT);
    s_page=page?page->value->int32:0;s_pages=count?count->value->int32:1;
    if(text)snprintf(s_body_text,sizeof(s_body_text),"%s",text->value->cstring);
    if(title)snprintf(s_title,sizeof(s_title),"%s",title->value->cstring);
    Tuple *parent=dict_find(iter,MESSAGE_KEY_PARENT_ID),*pinned=dict_find(iter,MESSAGE_KEY_PINNED);
    if(parent){snprintf(s_note_parent,sizeof(s_note_parent),"%s",parent->value->cstring);}s_note_pinned=pinned&&pinned->value->int32;
    render_note();
  } else if(kind==11){
    clear_timeout();s_loading=false;Tuple *pinned=dict_find(iter,MESSAGE_KEY_PINNED);bool value=pinned&&pinned->value->int32;
    if(id){for(int i=0;i<s_count;i++)if(strcmp(s_notes[i].id,id->value->cstring)==0)s_notes[i].pinned=value;if(strcmp(s_current_id,id->value->cstring)==0)s_note_pinned=value;}
    s_snapshot[0]=0;for(int i=0;i<s_depth;i++)s_history[i].snapshot[0]=0;
    set_status(value?"Pinned to main page":"Unpinned");if(!s_body&&strcmp(s_folder,s_root)==0)refresh_list();
  } else if(kind==10) {
    clear_timeout();s_loading=false;
    if(id&&strcmp(id->value->cstring,s_current_id)==0&&s_body){if(s_action_menu)window_stack_pop(false);window_stack_pop(true);}
    s_delete_id[0]=0;for(int i=0;i<s_depth;i++)s_history[i].snapshot[0]=0;refresh_list();
  } else if(kind==7||kind==8) {
    if(kind==8&&s_pending&&id&&strcmp(id->value->cstring,s_draft_id)!=0){set_status("Earlier note saved · draft kept");return;}
    if(s_pending&&id&&strcmp(id->value->cstring,s_draft_id)==0){clear_timeout();clear_draft();}
    set_status(kind==8?"Saved to vault":"On phone · waiting for Mac");if(kind==8)vibes_short_pulse();
    if(s_body)text_layer_set_text(s_page_label,kind==8?"Saved to vault":"On phone / waiting for Mac");
    if(kind==8){s_snapshot[0]=0;for(int i=0;i<s_depth;i++)s_history[i].snapshot[0]=0;}
    if(kind==8&&id&&strcmp(id->value->cstring,s_last_append_id)==0){
      s_last_append_id[0]=0;
      if(s_body&&!s_loading&&strcmp(s_current_id,s_last_append_target)==0){s_loading=true;send_command(2,s_current_id,s_page,NULL);}
    }
    if((kind==8||(kind==7&&!s_count))&&!s_body&&!s_loading)refresh_list();
  } else if(kind==5||kind==9) {
    if(kind==9){clear_timeout();s_loading=false;s_snapshot[0]=0;}
    if(text)set_status(text->value->cstring);
    if(kind==9&&s_body){s_scroll_to_end=false;text_layer_set_text(s_page_label,s_status);}
  }
}
static void outbox_failed(DictionaryIterator *iter, AppMessageResult reason, void *context) { clear_timeout();s_loading=false;set_status(s_pending?"Draft kept · select to retry":"Phone unavailable · retry"); }
static void main_load(Window *window) {
  s_menu=menu_layer_create(layer_get_bounds(window_get_root_layer(window)));
  menu_layer_set_callbacks(s_menu,NULL,(MenuLayerCallbacks){.get_num_rows=row_count,.get_cell_height=row_height,.draw_row=draw_row});
  window_set_click_config_provider(window,main_clicks);
  layer_add_child(window_get_root_layer(window),menu_layer_get_layer(s_menu));apply_theme();
}
static void main_unload(Window *window) {menu_layer_destroy(s_menu);s_menu=NULL;}
int main(void) {
  srand(time(NULL));
  if(persist_exists(100)){
    int len=persist_read_int(100);if(len>0&&len<=DRAFT_SIZE&&persist_read_string(101,s_draft_id,sizeof(s_draft_id))>0){
      bool ok=true;for(int i=0;i<len;i+=192){int size=len-i<192?len-i:192;if(persist_read_data(110+i/192,s_draft+i,size)!=size)ok=false;}
      persist_read_string(102,s_draft_target,sizeof(s_draft_target));
      persist_read_string(103,s_draft_folder,sizeof(s_draft_folder));persist_read_string(104,s_draft_vault,sizeof(s_draft_vault));s_draft_api=persist_exists(105)?persist_read_int(105):1;
      s_draft[DRAFT_SIZE-1]=0;s_pending=ok&&s_draft[0]&&s_draft_id[0];
    }
  }
  s_main=window_create();window_set_window_handlers(s_main,(WindowHandlers){.load=main_load,.unload=main_unload});window_stack_push(s_main,true);
  app_message_register_inbox_received(inbox);app_message_register_outbox_failed(outbox_failed);app_message_open(2048,1536);
  s_dictation=dictation_session_create(DRAFT_SIZE,dictation_done,NULL);if(s_dictation)dictation_session_enable_confirmation(s_dictation,true);
  app_event_loop();clear_timeout();if(s_dictation)dictation_session_destroy(s_dictation);if(s_actions)window_destroy(s_actions);if(s_reader)window_destroy(s_reader);window_destroy(s_main);
#if defined(PBL_PLATFORM_EMERY)
  unload_custom_theme_font();
#endif
}
