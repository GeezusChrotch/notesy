"""Create a test-only package with production C and inert phone JS.
Never distribute or install this fixture package on a physical watch.
"""
from pathlib import Path
import zipfile,json
root=Path(__file__).resolve().parents[1]
source=root/'dist'/('Notesy-'+json.loads((root/'package.json').read_text())['version']+'.pbw');destination=root/'build/Notesy-fixture.pbw'
with zipfile.ZipFile(source) as original,zipfile.ZipFile(destination,'w',zipfile.ZIP_DEFLATED) as fixture:
    for entry in original.infolist():
        content=b'Pebble.addEventListener("ready",function(){});' if entry.filename=='pebble-js-app.js' else original.read(entry.filename)
        fixture.writestr(entry,content)
print('Created emulator-only fixture package in build/')
