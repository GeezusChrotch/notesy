"""Native C + disposable gateway integration. Run with the Pebble tool's Python.
Install build/Notesy-fixture.pbw (same C binary, inert phone JS) in emulator first.
Phone JS is covered separately by phone.test.js. This never connects to a real watch.
"""
import base64,json,queue,subprocess,threading,time,uuid,urllib.request,urllib.parse,os
from pathlib import Path
from pebble_tool.sdk.emulator import ManagedEmulatorTransport
from pebble_tool.commands.emucontrol import send_data_to_qemu
from libpebble2.communication import PebbleConnection
from libpebble2.communication.transports.qemu.protocol import QemuButton
from libpebble2.services.appmessage import AppMessageService,CString,Int32,ByteArray
from libpebble2.services.screenshot import Screenshot
import png
ROOT=Path(__file__).resolve().parents[1]
fixture=subprocess.Popen(['node',str(ROOT/'tests/emulator-fixture.js')],stdout=subprocess.PIPE,text=True)
info=json.loads(fixture.stdout.readline());base='http://127.0.0.1:'+str(info['port'])
pebble=PebbleConnection(ManagedEmulatorTransport('emery'));pebble.connect();pebble.run_async()
service=AppMessageService(pebble);app=uuid.UUID('b9270b92-5e0e-491b-9993-165f849d7250')
saved_captures=[];hold_receipts=[False]
incoming=queue.Queue();calls=[];failures=[];acks=set();lock=threading.Lock();done=threading.Event()
service.register_handler('appmessage',lambda tx,u,data:incoming.put(data) if u==app else None)
service.register_handler('ack',lambda tx,u:acks.add(tx))
def send(data):
 with lock:
  tx=service.send_message(app,{k:CString(v) if isinstance(v,str) else ByteArray(v) if isinstance(v,bytes) else Int32(v) for k,v in data.items()})
  start=time.time()
  while tx not in acks:
   if time.time()-start>4:raise AssertionError('Watch did not acknowledge fixture message')
   time.sleep(.01)
  acks.remove(tx)
def http(route,body=None):
 req=urllib.request.Request(base+route,headers={'Authorization':'Bearer '+'fixture-token-'*4,'Content-Type':'application/json'},data=json.dumps(body).encode() if body is not None else None)
 return json.load(urllib.request.urlopen(req,timeout=5))
def worker():
 while not done.is_set():
  try:m=incoming.get(timeout=.2)
  except queue.Empty:continue
  try:
   calls.append(m);cmd=m[0];seq=m[2]
   if cmd in (1,7):
    v=http(('/v2/search?' if cmd==7 else '/v2/browse?')+urllib.parse.urlencode({'q':m.get(5,''),'folder':m.get(18,''),'offset':m.get(6,0),'snapshot':m.get(22,'')}))
    send({1:1,2:seq,7:len(v['items']),6:v['offset'],23:v['total'],18:v['id'],19:v['parent'],4:v['title'],22:v['snapshot']})
    for i,n in enumerate(v['items']):send({1:2,2:seq,8:i,3:n['id'],4:n['title'],5:n.get('location',''),20:int(n['folder']),21:int(n['pinned'])})
    send({1:3,2:seq})
   elif cmd==2:
    v=http(('/v3/notes/' if m.get(25)==3 else '/v2/notes/')+m[3]+'?page='+str(m.get(6,0)))
    if v.get('rich'):
     send({1:12,2:seq,4:v['title'],19:v['parent'],21:int(v['pinned']),28:v['revision'],6:v['offset'],23:v['total'],7:len(v['blocks'])})
     for i,b in enumerate(v['blocks']):send({1:13,2:seq,8:i,29:b['id'],5:b['text'],20:{'text':0,'task':1,'image':2}[b['kind']],30:int(b.get('checked',False))})
     send({1:14,2:seq})
    else:send({1:4,2:seq,4:v['title'],5:v['text'],6:v['page'],7:v['pages'],19:v['parent'],21:int(v['pinned'])})
   elif cmd==8:
    v=http('/v3/notes/'+m[3]+'/task',{'vaultId':info['vaultId'],'requestId':m[5],'taskId':m[29],'checked':bool(m[30]),'revision':m[28]});send({1:15,2:seq,29:v['taskId'],30:int(v['checked']),28:v['revision']})
   elif cmd==9:
    v=http('/v3/notes/'+m[3]+'/image?'+urllib.parse.urlencode({'index':m[8],'revision':m[28],'width':m[31],'height':m[32]}));data=base64.b64decode(v['data']);send({1:16,2:seq,31:v['width'],32:v['height'],23:len(data)})
    for offset in range(0,len(data),512):send({1:17,2:seq,8:offset,33:data[offset:offset+512]})
    send({1:18,2:seq})
   elif cmd==6:
    v=http('/v2/items/'+m[3]+'/pin',{'pinned':bool(m[21]),'vaultId':info['vaultId']});send({1:11,2:seq,3:v['id'],21:int(v['pinned'])})
   elif cmd==5:
    v=http('/v2/items/'+m[3]+'/delete',{'requestId':m[5],'vaultId':info['vaultId']});send({1:10,2:seq,3:v['id']})
   elif cmd==3:
    body={'requestId':m[3],'text':m[5],'vaultId':m[26],'folderId':m[18]}
    send({1:7,3:m[3]})
    v=http('/v2/items/'+m[17]+'/append' if m.get(17) else '/v2/notes',body)
    assert v['saved'];saved_captures.append((m,v))
    if not hold_receipts[0]:send({1:8,3:m[3],17:v['id']})
  except Exception as e:failures.append(str(e));print('FAIL',e,flush=True)
  finally:incoming.task_done()
threading.Thread(target=worker,daemon=True).start()
def settle():
 time.sleep(.25);incoming.join();time.sleep(.2)
 assert not failures,failures
buttons=[0,0,0,4,5,1,0,0,0,4,2,6]
def settings(bindings=buttons,marquee=30):
 send({1:6,27:marquee,25:2,26:info['vaultId'],18:info['root'],24:','.join(map(str,bindings)),11:255,12:192,13:192,14:255,15:5,16:22});settle()
def click(name,long=False):
 value={'up':QemuButton.Button.Up,'down':QemuButton.Button.Down,'select':QemuButton.Button.Select,'back':QemuButton.Button.Back}[name]
 send_data_to_qemu(pebble.transport,QemuButton(state=value));time.sleep(1.0 if long else .2);send_data_to_qemu(pebble.transport,QemuButton(state=0));settle()
def double_back():
 for _ in range(2):
  send_data_to_qemu(pebble.transport,QemuButton(state=QemuButton.Button.Back));time.sleep(.06);send_data_to_qemu(pebble.transport,QemuButton(state=0));time.sleep(.08)
 settle()
def shot(name):
 png.from_array(Screenshot(pebble).grab_image(),'RGB;8').save(str(ROOT/'build'/name))
def rich_checks():
 settings();shot('rich-root.png');click('down');click('select');assert calls[-1][0]==2 and calls[-1][25]==3;shot('rich-tasks.png')
 click('down');click('select');assert calls[-1][0]==8 and calls[-1][30]==1;shot('rich-task-checked.png')
 assert http('/v3/notes/'+info['note'])['blocks'][1]['checked']
 click('select');assert calls[-1][30]==0 and not http('/v3/notes/'+info['note'])['blocks'][1]['checked']
 click('down');click('down');settle();assert calls[-1][0]==9;shot('rich-image.png')
 click('down');settle();assert calls[-1][0]==9;shot('rich-drawing.png')
 for _ in range(34):click('down')
 assert any(m[0]==2 and m.get(6)==2 for m in calls),'Tasks did not reach the third batch'
 for _ in range(37):click('up')
 assert [m for m in calls if m[0]==2][-1][6]==0
 double_back();shot('rich-actions.png');click('back');click('back');assert calls[-1][0]==1
 print('PASS: mixed note text, task check/uncheck, inline color image and Excalidraw, rich paging in both directions, Actions and Back',flush=True)

def scroll_checks():
 settings();send({1:6,27:0,25:2,26:info['vaultId'],18:info['root'],24:','.join(map(str,buttons)),15:5,16:30});settle()
 click('down');click('select');shot('rich-scroll-start.png')
 click('down');shot('rich-scroll-middle.png')
 pixels=[value for row in Screenshot(pebble).grab_image() for value in row][:200*180*3]
 assert sum(v<64 for v in pixels)>300 and sum(v>192 for v in pixels)>300,'Scrolling text produced a blank screen'
 click('select')
 assert not any(m[0]==8 for m in calls),'Down skipped the rest of the oversized paragraph'
 shot('rich-scroll-actions.png');click('back')
 for _ in range(10):
  click('down')
  if calls[-1][0]==9:break
 assert calls[-1][0]==9 and calls[-1][8]==2;shot('rich-scroll-wide.png')
 click('down');assert calls[-1][0]==9 and calls[-1][8]==3;shot('rich-scroll-tall.png')
 click('down');shot('rich-scroll-after.png');click('select');assert calls[-1][0]==8
 assert http('/v3/notes/'+info['note'])['blocks'][4]['checked'],'The row after the pictures was skipped'
 click('up');click('up');assert calls[-1][0]==9 and calls[-1][8]==2
 click('up');click('up');shot('rich-scroll-bottom.png');click('up');shot('rich-scroll-backward.png')
 print('PASS: oversized text scrolls before selection moves; wide and tall images keep geometry; task after pictures toggles; reverse scrolling works',flush=True)

def marquee_checks():
 def frame():return tuple(tuple(row) for row in Screenshot(pebble).grab_image())
 def rows(speed):
  settings(marquee=speed);seq=calls[-1][2]
  send({1:1,2:seq,7:2,6:0,23:2,4:'Vault',22:''})
  send({1:2,2:seq,8:0,3:info['note'],4:'This is a very long note title that scrolls across the selected menu row',20:0,21:0})
  send({1:2,2:seq,8:1,3:info['projects'],4:'Short',20:1,21:0});send({1:3,2:seq});settle();click('down')
 for speed in [0,15,90]:
  rows(speed);a=frame();shot('marquee-'+str(speed)+'-start.png');time.sleep(2);b=frame();shot('marquee-'+str(speed)+'-later.png')
  assert (a==b)==(speed==0),('Marquee did not match speed',speed)
  click('down');a=frame();time.sleep(1.3);assert frame()==a,'Short title should remain still'
 print('PASS: Off stays still, Slow and Very fast animate selected long titles, short titles stay still',flush=True)
 # A large theme makes an Actions label overflow too.
 settings(marquee=90);send({1:6,27:90,25:2,26:info['vaultId'],18:info['root'],24:','.join(map(str,buttons)),15:5,16:30});settle();double_back()
 click('down');click('down');click('down');click('down');a=frame();shot('marquee-actions-start.png');time.sleep(1.6);b=frame();shot('marquee-actions-later.png');assert a!=b,'Long action should marquee'
 click('back');print('PASS: long Actions title scrolls and Back returns normally',flush=True)

def voice_checks():
 from libpebble2.services.voice import VoiceService,SetupResult,TranscriptionResult
 class FixtureVoice(VoiceService):
  # No real microphone audio is needed. Ignore late frames after a simulated result;
  # the SDK voice helper otherwise calls send_stop_audio with an unsupported argument.
  def _handle_audio_frame(self,session_id,frame):pass
 voice=FixtureVoice(pebble);search_words=['project','plna'];cancel_search=[False]
 def setup(u,encoder):
  voice.send_session_setup_result(SetupResult.Success,u)
  def finish():
   voice.send_stop_audio();voice.send_dictation_result(TranscriptionResult.Success,sentences=[(search_words if os.environ.get('WATCH_TEST_SEARCH_ONLY') else ['Fixture','dictation','capture'])],app_uuid=u)
  if not cancel_search[0]:threading.Timer(.7,finish).start()
 voice.register_handler('session_setup',setup)
 if os.environ.get('WATCH_TEST_SEARCH_ONLY'):
  settings();double_back();click('down');click('down');click('down');click('select');time.sleep(1.5);click('select');time.sleep(1.2);settle()
  assert calls[-1][0]==7 and calls[-1][5]=='project plna';assert not any(m[0]==3 for m in calls)
  shot('search-results.png');click('select');assert calls[-1][0]==2 and calls[-1][3]==info['note'];shot('search-reader.png')
  custom=buttons.copy();custom[11]=8;settings(custom);search_words[:]=['note'];click('down',True);time.sleep(1.5);click('select');time.sleep(1.2);settle();assert calls[-1][0]==7
  for _ in range(33):click('down')
  assert any(m[0]==7 and m.get(6)==30 for m in calls),'Search did not fetch third page'
  for _ in range(36):click('up')
  assert [m for m in calls if m[0]==7][-1][6]==0
  click('back');assert calls[-1][0]==1 and calls[-1][18]==info['root']
  custom=buttons.copy();custom[4]=8;settings(custom);cancel_search[0]=True;click('select',True);time.sleep(1.5);click('back');time.sleep(1.2);assert not any(m[0]==3 for m in calls)
  click('down');click('select');assert calls[-1][0]==2
  print('PASS: Actions search, fuzzy result opening, reader/main search bindings, Back restoration and cancelled search with zero note captures',flush=True)
  return
 settings();click('select');click('select');time.sleep(1.5);shot('vault-dictation-confirm.png')
 print('Simulated transcription reached the watch confirmation screen',flush=True)
 confirm='select'
 click(confirm);assert [m for m in calls if m[0]==3][-1][18]==info['root']
 assert not [m for m in calls if m[0]==3][-1].get(17)
 print('PASS: dictated root note carries root destination',flush=True)
 settings();listing=http('/v2/browse');row=next(i for i,n in enumerate(listing['items']) if n['id']==info['projects'])+1
 for _ in range(row):click('down')
 click('select');click('select');click('select');time.sleep(1.5);click(confirm)
 capture=[m for m in calls if m[0]==3][-1];assert capture[18]==info['projects'] and not capture.get(17)
 print('PASS: dictated folder note carries nested destination',flush=True)
 settings();listing=http('/v2/browse?folder='+info['projects']);row=next(i for i,n in enumerate(listing['items']) if n['id']==info['note'])+1
 for _ in range(row):click('down')
 click('select');click('select',True);time.sleep(1.5);click(confirm)
 capture=[m for m in calls if m[0]==3][-1];assert capture[17]==info['note']
 assert capture[5]=='Fixture dictation capture'
 print('PASS: dictation in reader appends to the open note',flush=True)
 custom=buttons.copy();custom[11]=1;settings(custom);click('down',True);time.sleep(1.5);click(confirm)
 capture=[m for m in calls if m[0]==3][-1];assert capture[18]==info['projects'] and not capture.get(17)
 print('PASS: configured New note in reader saves beside the open note',flush=True)
 click('back');settings();listing=http('/v2/browse?folder='+info['projects']);row=next(i for i,n in enumerate(listing['items']) if n['id']==info['note'])+1
 custom=buttons.copy();custom[4]=2;settings(custom)
 for _ in range(row):click('down')
 click('select',True);time.sleep(1.5);click(confirm)
 assert [m for m in calls if m[0]==3][-1][17]==info['note']
 print('PASS: configured Append in browser targets the selected note',flush=True)

def stitch_checks():
 from libpebble2.services.voice import VoiceService,SetupResult,TranscriptionResult
 class FixtureVoice(VoiceService):
  def _handle_audio_frame(self,session_id,frame):pass
 voice=FixtureVoice(pebble);sessions=[];results=[];automatic=[2]
 def wait_for(predicate,label):
  end=time.time()+10
  while not predicate():
   assert time.time()<end,(label,len(sessions),len(results),len(saved_captures))
   time.sleep(.1)
 def ready(number):
  wait_for(lambda:len(results)>=number,'transcription ready');time.sleep(3)
 def setup(u,encoder):
  sessions.append(u);number=len(sessions);voice.send_session_setup_result(SetupResult.Success,u)
  def finish():
   voice.send_stop_audio();voice.send_dictation_result(TranscriptionResult.Success,sentences=[['Section',str(number)]],app_uuid=u);results.append(number)
  if number<=automatic[0]:threading.Timer(.7,finish).start()
 voice.register_handler('session_setup',setup)
 if not os.environ.get('WATCH_TEST_STITCH_STOP_ONLY'):
  settings();click('select');shot('capture-modes.png');click('down');click('select');ready(1)
  click('select');ready(2)
  first=saved_captures[0];send({1:8,3:first[0][3],17:'f'*64});time.sleep(.5);assert len(sessions)==2
  click('select');wait_for(lambda:len(sessions)==3,'third listening session');time.sleep(.5);click('back');time.sleep(1);settle()
  assert len(saved_captures)==2 and not saved_captures[0][0].get(17)
  target=saved_captures[0][1]['id'];assert saved_captures[1][0][17]==target
  note=http('/v2/notes/'+target)['text'];assert 'Section 1' in note and 'Section 2' in note
  before=len(sessions);time.sleep(1);assert len(sessions)==before
  print('PASS: Stitch creates once, appends the next accepted section, ignores stale receipts and stops with Back',flush=True)
  settings();listing=http('/v2/browse');row=next(i for i,n in enumerate(listing['items']) if n['id']==target)+1
  for _ in range(row):click('down')
  click('select');click('select');shot('append-capture-modes.png');click('down')
  automatic[0]=len(sessions)+2;count=len(results);click('select');ready(count+1);shot('stitch-append-first.png')
  click('select');ready(count+2);shot('stitch-append-second.png');click('select')
  wait_for(lambda:len(sessions)==automatic[0]+1,'append third listening');time.sleep(.5);click('back');settle()
  assert len(saved_captures)==4 and all(m[17]==target for m,v in saved_captures[2:])
  print('PASS: Append Stitch keeps both sections in the open note',flush=True)
  return
 else:
  settings();target=info['note'];listing=http('/v2/browse');row=next(i for i,n in enumerate(listing['items']) if n['id']==target)+1
  for _ in range(row):click('down')
  click('select')
 automatic[0]=len(sessions)+1;before=len(sessions);count=len(results);click('select',True);ready(count+1);click('select');time.sleep(1)
 assert len(sessions)==before+1 and saved_captures[-1][0][17]==target
 print('PASS: Quick Dictate append stays a single recording',flush=True)
 custom=buttons.copy();custom[11]=10;settings(custom);hold_receipts[0]=True
 automatic[0]=len(sessions)+1;before=len(sessions);count=len(results);click('down',True);ready(count+1);click('select');wait_for(lambda:len(saved_captures)==2,'held section captured')
 assert len(sessions)==before+1
 click('back');last=saved_captures[-1];send({1:8,3:last[0][3],17:last[1]['id']});time.sleep(1)
 assert len(sessions)==before+1 and last[0][17]==target
 print('PASS: Stitch shortcut 10 works; stopping while saving prevents a late receipt from restarting dictation',flush=True)
 hold_receipts[0]=False;click('back');settings();automatic[0]=len(sessions)+1;before=len(sessions);count=len(results)
 click('select');click('select');ready(count+1);click('select');time.sleep(1)
 assert len(sessions)==before+1 and not saved_captures[-1][0].get(17)
 print('PASS: main Quick Dictate creates one note with one recording',flush=True)

try:
 if os.environ.get('WATCH_TEST_STITCH_ONLY') or os.environ.get('WATCH_TEST_STITCH_STOP_ONLY'):stitch_checks()
 elif os.environ.get('WATCH_TEST_SCROLL_ONLY'):scroll_checks()
 elif os.environ.get('WATCH_TEST_RICH_ONLY'):rich_checks()
 elif os.environ.get('WATCH_TEST_MARQUEE_ONLY'):marquee_checks()
 elif os.environ.get('WATCH_TEST_DICTATION_ONLY') or os.environ.get('WATCH_TEST_SEARCH_ONLY'):voice_checks()
 else:
  if not os.environ.get('WATCH_TEST_BINDINGS_ONLY'):
   settings();assert calls[-1][0]==1;shot('vault-browser-root.png')
   click('down');click('select');assert calls[-1][0]==2;shot('vault-browser-reader.png')
   for _ in range(90):click('down')
   assert any(m[0]==2 and m.get(6,0)>0 for m in calls),'Reader did not fetch another chunk'
   for _ in range(90):click('up')
   assert [m for m in calls if m[0]==2][-1][6]==0,'Reader did not return to first chunk'
   click('up',True);assert any(m[0]==6 for m in calls);click('back')
   click('down');click('down');click('select');assert calls[-1].get(18)==info['projects'];shot('vault-browser-folder.png')
   click('down');click('select');click('back');click('back')
   for _ in range(42):click('down')
   assert any(m[0]==1 and m.get(6)==30 for m in calls),'List did not reach its third page'
   shot('vault-browser-third-page.png')
   for _ in range(45):click('up')
   assert [m for m in calls if m[0]==1][-1].get(6)==0,'List did not page backward'
   print('PASS: root pins, folders, root notes, nested Back, and forward/backward list and note paging',flush=True)
  for index in range(6):
   custom=buttons.copy();custom[index]=4;settings(custom);double_back()
   for _ in range(10):click('down')
   click('select')
   previous=len([m for m in calls if m[0]==6]);click(['up','select','down'][index%3],index>=3)
   assert len([m for m in calls if m[0]==6])==previous+1,('Main binding failed',index)
  print('PASS: all six main-view press/long-press bindings',flush=True)
  # Open a known root note; folder pins can change the root ordering.
  settings();listing=http('/v2/browse');row=next(i for i,n in enumerate(listing['items']) if not n['folder'])+1
  for _ in range(row):click('down')
  click('select');assert calls[-1][0]==2
  for index in range(6,12):
   custom=buttons.copy();custom[index]=4;settings(custom)
   previous=len([m for m in calls if m[0]==6]);click(['up','select','down'][index%3],index%6>=3)
   assert len([m for m in calls if m[0]==6])==previous+1,('Note binding failed',index)
  print('PASS: all six note-view press/long-press bindings',flush=True)
  # Configure single Select as Delete, then prove one press produces one deletion.
  custom=buttons.copy();custom[7]=3;settings(custom);previous=len([m for m in calls if m[0]==5]);click('select')
  assert len([m for m in calls if m[0]==5])==previous+1
  # Even with Select rebound, double-pressing Back always opens the normal actions menu.
  custom=buttons.copy();custom[1]=6;settings(custom);double_back();shot('vault-browser-actions.png');click('back')
  print('PASS: immediate one-step delete and hardware Back actions fallback',flush=True)

except Exception:
 print('Commands at failure',[(m[0],m.get(6),m.get(21)) for m in calls[-8:]],flush=True)
 try:shot('vault-test-failure.png')
 except Exception as screenshot_error:print('Failure screenshot unavailable:',type(screenshot_error).__name__,flush=True)
 raise
finally:
 done.set();service.shutdown();fixture.terminate();fixture.wait(timeout=5)
