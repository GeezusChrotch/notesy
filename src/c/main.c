#include <pebble.h>
#define MAX_NOTES 15
#define DRAFT_SIZE 768
typedef struct { char id[65]; char title[112]; } Note;
static Window *s_main, *s_reader;
static MenuLayer *s_menu;
static ScrollLayer *s_scroll;
static TextLayer *s_body, *s_heading, *s_page_label;
static DictationSession *s_dictation;
static Note s_notes[MAX_NOTES];
static int s_count, s_next = -1, s_offset, s_page, s_pages;
static uint32_t s_request;
static char s_status[160] = "Connecting to phone…";
static char s_body_text[1024], s_title[128], s_current_id[65];
static char s_draft[DRAFT_SIZE], s_draft_id[96];
static bool s_pending, s_ready, s_auto, s_auto_used, s_loading;
static int s_theme;
static GColor s_background, s_foreground, s_highlight;
static AppTimer *s_timeout;
static ClickConfigProvider s_menu_clicks;

static void set_status(const char *text) {
  snprintf(s_status, sizeof(s_status), "%s", text);
  if (s_menu) menu_layer_reload_data(s_menu);
}
static void clear_timeout(void) { if (s_timeout) { app_timer_cancel(s_timeout); s_timeout = NULL; } }
static void timed_out(void *unused) {
  s_timeout = NULL; s_loading = false;
  set_status(s_pending ? "Draft kept · select to retry" : "No reply · hold Down to refresh");
}
static void send_command(int command, const char *id, int page, const char *text) {
  DictionaryIterator *iter;
  if (app_message_outbox_begin(&iter) != APP_MSG_OK) { set_status("Phone busy · please retry"); return; }
  dict_write_int(iter, MESSAGE_KEY_COMMAND, &command, sizeof(command), true);
  dict_write_uint32(iter, MESSAGE_KEY_REQUEST, ++s_request);
  dict_write_int(iter, MESSAGE_KEY_PAGE, &page, sizeof(page), true);
  if (id) dict_write_cstring(iter, MESSAGE_KEY_NOTE_ID, id);
  if (text) dict_write_cstring(iter, MESSAGE_KEY_TEXT, text);
  if (app_message_outbox_send() != APP_MSG_OK) { set_status("Phone unavailable · draft kept"); return; }
  clear_timeout(); s_timeout = app_timer_register(18000, timed_out, NULL);
}
static void load_notes(int offset) {
  if (!s_ready) { set_status("Open Pebble on your phone"); return; }
  s_offset = offset; s_loading = true;
  set_status("Loading notes…"); send_command(1, NULL, offset, NULL);
}
static void apply_theme(void) {
  s_background = s_theme == 1 ? GColorDarkGreen : s_theme == 2 ? GColorOxfordBlue : GColorWhite;
  s_foreground = s_theme == 0 ? GColorBlack : GColorWhite;
  s_highlight = s_theme == 1 ? GColorMintGreen : s_theme == 2 ? GColorVividCerulean : GColorBlack;
  window_set_background_color(s_main, s_background);
  menu_layer_set_normal_colors(s_menu, s_background, s_foreground);
  menu_layer_set_highlight_colors(s_menu, s_highlight, s_theme == 0 ? GColorWhite : GColorBlack);
  if (s_body) {
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
  if (persist_write_string(101, s_draft_id) < 0) return false;
  return persist_write_int(100, len) > 0;
}
static void clear_draft(void) {
  persist_delete(100); persist_delete(101);
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
  time_t now; uint16_t ms; time_ms(&now, &ms);
  snprintf(s_draft_id, sizeof(s_draft_id), "%lu-%u-%lu-%lu", (unsigned long)now, ms, (unsigned long)rand(), (unsigned long)rand());
  s_pending = true;
  if (!persist_draft()) { set_status("Watch storage full · keep app open and retry"); return; }
  retry_draft();
}
static void dictate(void) {
  if (s_pending) { retry_draft(); return; }
  if (!s_ready) { set_status("Open Pebble on your phone first"); return; }
  if (s_dictation) { s_loading=false; clear_timeout(); dictation_session_start(s_dictation); }
  else set_status("Dictation requires a microphone and phone");
}
static uint16_t row_count(MenuLayer *menu, uint16_t section, void *context) { return 1+s_count+(s_next>=0?1:0)+1; }
static int16_t row_height(MenuLayer *menu, MenuIndex *index, void *context) { return index->row == 0 ? 64 : 48; }
static void draw_row(GContext *ctx, const Layer *cell, MenuIndex *index, void *context) {
  int row = index->row;
  if (row == 0) menu_cell_basic_draw(ctx, cell, s_pending ? "Retry draft" : "New note", s_status, NULL);
  else if (row <= s_count) menu_cell_basic_draw(ctx, cell, s_notes[row-1].title, NULL, NULL);
  else if (s_next>=0 && row == s_count+1) menu_cell_basic_draw(ctx, cell, "More notes", "Next 15", NULL);
  else menu_cell_basic_draw(ctx, cell, "Refresh", "Newest notes", NULL);
}
static void render_note(void) {
  GRect bounds = layer_get_bounds(window_get_root_layer(s_reader));
  layer_set_frame(text_layer_get_layer(s_body), GRect(4, 0, bounds.size.w-8, 3000));
  text_layer_set_text(s_body, s_body_text);
  GSize size = text_layer_get_content_size(s_body);
  layer_set_frame(text_layer_get_layer(s_body), GRect(4, 0, bounds.size.w-8, size.h+10));
  scroll_layer_set_content_size(s_scroll, GSize(bounds.size.w, size.h+10));
  scroll_layer_set_content_offset(s_scroll, GPointZero, false);
  text_layer_set_text(s_heading, s_title);
  static char label[64];
  snprintf(label, sizeof(label), "%d/%d · Select next", s_page+1, s_pages);
  text_layer_set_text(s_page_label, s_pages>1 ? label : "Hold Select: new note");
}
static void next_page(ClickRecognizerRef recognizer, void *context) {
  if (s_loading) return;
  if (s_page+1<s_pages) { s_loading=true; send_command(2, s_current_id, s_page+1, NULL); }
  else vibes_short_pulse();
}
static void previous_page(ClickRecognizerRef recognizer, void *context) {
  if (s_loading) return;
  if (s_pages<=1) { dictate(); return; }
  if (s_page>0) { s_loading=true; send_command(2, s_current_id, s_page-1, NULL); }
}
static void reader_clicks(void *context) {
  window_single_click_subscribe(BUTTON_ID_SELECT, next_page);
  window_long_click_subscribe(BUTTON_ID_SELECT, 600, previous_page, NULL);
}
static void reader_unload(Window *window) {
  s_loading=false; ++s_request; clear_timeout();
  text_layer_destroy(s_body); text_layer_destroy(s_heading); text_layer_destroy(s_page_label); scroll_layer_destroy(s_scroll);
  s_body=NULL; s_heading=NULL; s_page_label=NULL; s_scroll=NULL;
}
static void reader_load(Window *window) {
  GRect bounds=layer_get_bounds(window_get_root_layer(window));
  s_heading=text_layer_create(GRect(4,0,bounds.size.w-8,30)); text_layer_set_font(s_heading,fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD));
  s_scroll=scroll_layer_create(GRect(0,32,bounds.size.w,bounds.size.h-53));
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
static void select_row(MenuLayer *menu, MenuIndex *index, void *context) {
  int row=index->row;
  if (row==0) { dictate(); return; }
  if (s_loading) return;
  if (row<=s_count) {
    snprintf(s_current_id,sizeof(s_current_id),"%s",s_notes[row-1].id);
    snprintf(s_title,sizeof(s_title),"%s",s_notes[row-1].title);
    snprintf(s_body_text,sizeof(s_body_text),"Loading…"); s_page=0; s_pages=1;
    if(s_reader)window_destroy(s_reader);
    s_reader=window_create();window_set_window_handlers(s_reader,(WindowHandlers){.load=reader_load,.unload=reader_unload});
    window_stack_push(s_reader,true);s_loading=true;send_command(2,s_current_id,0,NULL);
  } else load_notes(s_next>=0&&row==s_count+1?s_next:0);
}
static void hold_new(MenuLayer *menu, MenuIndex *index, void *context) { dictate(); }
static void hold_refresh(ClickRecognizerRef recognizer, void *context) { load_notes(0); }
static void main_clicks(void *context) { if(s_menu_clicks)s_menu_clicks(context); window_long_click_subscribe(BUTTON_ID_DOWN,700,hold_refresh,NULL); }
static void inbox(DictionaryIterator *iter, void *context) {
  Tuple *type=dict_find(iter,MESSAGE_KEY_TYPE);if(!type)return;
  Tuple *request=dict_find(iter,MESSAGE_KEY_REQUEST);int kind=type->value->int32;
  if(request&&request->value->uint32!=0&&request->value->uint32!=s_request)return;
  Tuple *text=dict_find(iter,MESSAGE_KEY_TEXT), *id=dict_find(iter,MESSAGE_KEY_NOTE_ID), *title=dict_find(iter,MESSAGE_KEY_TITLE);
  if(kind==6) {
    s_ready=true;Tuple *theme=dict_find(iter,MESSAGE_KEY_THEME),*aut=dict_find(iter,MESSAGE_KEY_AUTO);
    if(theme){s_theme=theme->value->int32;apply_theme();}s_auto=aut&&aut->value->int32;
    if(s_pending)retry_draft();else if(s_auto&&!s_auto_used){s_auto_used=true;dictate();}else load_notes(0);
  } else if(kind==1) {
    Tuple *count=dict_find(iter,MESSAGE_KEY_COUNT),*next=dict_find(iter,MESSAGE_KEY_PAGE);
    s_count=count?count->value->int32:0;if(s_count>MAX_NOTES)s_count=MAX_NOTES;if(s_count<0)s_count=0;
    s_next=next?next->value->int32:-1;memset(s_notes,0,sizeof(s_notes));
  } else if(kind==2) {
    Tuple *index=dict_find(iter,MESSAGE_KEY_INDEX);int i=index?index->value->int32:-1;
    if(i>=0&&i<s_count&&id&&title){snprintf(s_notes[i].id,sizeof(s_notes[i].id),"%s",id->value->cstring);snprintf(s_notes[i].title,sizeof(s_notes[i].title),"%s",title->value->cstring);}
  } else if(kind==3) {
    clear_timeout();s_loading=false;
    bool complete=true;for(int i=0;i<s_count;i++){if(!s_notes[i].id[0])complete=false;}
    if(!complete){s_count=0;s_next=-1;set_status("List interrupted · refresh");return;}
    set_status(s_count?"Dictate a thought":"No notes yet · dictate one");
    menu_layer_set_selected_index(s_menu,MenuIndex(0,0),MenuRowAlignTop,false);
  } else if(kind==4&&s_body) {
    clear_timeout();s_loading=false;Tuple *page=dict_find(iter,MESSAGE_KEY_PAGE),*count=dict_find(iter,MESSAGE_KEY_COUNT);
    s_page=page?page->value->int32:0;s_pages=count?count->value->int32:1;
    if(text)snprintf(s_body_text,sizeof(s_body_text),"%s",text->value->cstring);
    if(title)snprintf(s_title,sizeof(s_title),"%s",title->value->cstring);
    render_note();
  } else if(kind==7||kind==8) {
    if(kind==8&&s_pending&&id&&strcmp(id->value->cstring,s_draft_id)!=0){set_status("Earlier note saved · draft kept");return;}
    if(s_pending&&id&&strcmp(id->value->cstring,s_draft_id)==0){clear_timeout();clear_draft();}
    set_status(kind==8?"Saved to vault":"On phone · waiting for Mac");if(kind==8)vibes_short_pulse();
  } else if(kind==5||kind==9) {
    if(kind==9){clear_timeout();s_loading=false;}
    if(text)set_status(text->value->cstring);
    if(kind==9&&s_body){snprintf(s_body_text,sizeof(s_body_text),"%s",s_status);render_note();}
  }
}
static void outbox_failed(DictionaryIterator *iter, AppMessageResult reason, void *context) { clear_timeout();s_loading=false;set_status(s_pending?"Draft kept · select to retry":"Phone unavailable · retry"); }
static void main_load(Window *window) {
  s_menu=menu_layer_create(layer_get_bounds(window_get_root_layer(window)));
  menu_layer_set_callbacks(s_menu,NULL,(MenuLayerCallbacks){.get_num_rows=row_count,.get_cell_height=row_height,.draw_row=draw_row,.select_click=select_row,.select_long_click=hold_new});
  menu_layer_set_click_config_onto_window(s_menu,window);
  s_menu_clicks=window_get_click_config_provider(window);
  window_set_click_config_provider_with_context(window,main_clicks,s_menu);
  layer_add_child(window_get_root_layer(window),menu_layer_get_layer(s_menu));apply_theme();
}
static void main_unload(Window *window) {menu_layer_destroy(s_menu);s_menu=NULL;}
int main(void) {
  srand(time(NULL));
  if(persist_exists(100)){
    int len=persist_read_int(100);if(len>0&&len<=DRAFT_SIZE&&persist_read_string(101,s_draft_id,sizeof(s_draft_id))>0){
      bool ok=true;for(int i=0;i<len;i+=192){int size=len-i<192?len-i:192;if(persist_read_data(110+i/192,s_draft+i,size)!=size)ok=false;}
      s_draft[DRAFT_SIZE-1]=0;s_pending=ok&&s_draft[0]&&s_draft_id[0];
    }
  }
  s_main=window_create();window_set_window_handlers(s_main,(WindowHandlers){.load=main_load,.unload=main_unload});window_stack_push(s_main,true);
  app_message_register_inbox_received(inbox);app_message_register_outbox_failed(outbox_failed);app_message_open(2048,1536);
  s_dictation=dictation_session_create(DRAFT_SIZE,dictation_done,NULL);if(s_dictation)dictation_session_enable_confirmation(s_dictation,true);
  app_event_loop();clear_timeout();if(s_dictation)dictation_session_destroy(s_dictation);if(s_reader)window_destroy(s_reader);window_destroy(s_main);
}
