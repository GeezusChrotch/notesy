#!/usr/bin/env python3
"""Keep SDK debug source maps in the local build, not in the shared watch package."""
from pathlib import Path
import zipfile,re,json
root=Path(__file__).resolve().parents[1]
target=root/'dist'/('Notesy-'+json.loads((root/'package.json').read_text())['version']+'.pbw')
target.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(root/'build/StoneNotes.pbw') as source, zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED) as output:
    for info in source.infolist():
        if info.filename.endswith('.map'):continue
        data=source.read(info.filename)
        if re.search(rb'/Users/[A-Za-z]',data):raise SystemExit('Developer path found in '+info.filename)
        output.writestr(info,data)
with zipfile.ZipFile(target) as package:
    expected=json.loads((root/'package.json').read_text())['version']
    actual=json.loads(package.read('appinfo.json'))['versionLabel']
    if actual!=expected:raise SystemExit('Stale SDK package version: expected '+expected+', got '+actual+'. Clean the build and retry.')
    if package.testzip():raise SystemExit('Release archive failed validation.')
print('Created public Notesy package without SDK debug source maps.')
