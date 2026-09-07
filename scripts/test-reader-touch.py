#!/usr/bin/env python3
"""Run real touchscreen events against the current build, using Pebble tool Python.
Stops local SDK emulators; never installs on a phone or physical watch.
Usage: /path/to/pebble-tool/bin/python scripts/test-reader-touch.py
"""
import os, socket, subprocess, sys, zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
os.chdir(ROOT)
with zipfile.ZipFile('build/StoneNotes.pbw') as src,zipfile.ZipFile('build/Notesy-fixture.pbw','w',zipfile.ZIP_DEFLATED) as out:
 for entry in src.infolist():
  out.writestr(entry,b'Pebble.addEventListener("ready",function(){});' if entry.filename=='pebble-js-app.js' else src.read(entry.filename))
subprocess.run(['pebble','kill'],check=True)
with socket.socket() as sock:
 sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
original_spawn=subprocess.Popen
def spawn(args,*a,**kw):
 if isinstance(args,list) and '-machine' in args and 'qemu' in str(args[0]):
  args=args+['-qmp',f'tcp:127.0.0.1:{port},server=on,wait=off']
 return original_spawn(args,*a,**kw)
subprocess.Popen=spawn
from pebble_tool import run_tool
sys.argv=['pebble','install','build/Notesy-fixture.pbw','--emulator','emery']
result=run_tool()
if result:raise SystemExit(result)
subprocess.Popen=original_spawn
env=dict(os.environ,WATCH_TEST_LINKS_ONLY='1',WATCH_TEST_TOUCH_ONLY='1',NOTESY_QMP_PORT=str(port))
raise SystemExit(subprocess.call([sys.executable,'tests/watch-emulator.py'],env=env))
