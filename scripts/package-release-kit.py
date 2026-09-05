#!/usr/bin/env python3
"""Package public source/artwork from an explicit allowlist; never include local state/history."""
from pathlib import Path
import hashlib,json,re,zipfile
root=Path(__file__).resolve().parents[1];version=json.loads((root/'package.json').read_text())['version'];dist=root/'dist';dist.mkdir(exist_ok=True)
pbw=dist/f'Notesy-{version}.pbw'
assert pbw.is_file(),'Build the watch package first'
listing=(root/'APPSTORE_LISTING.md').read_text().split('## Description\n\n',1)[1].strip()
assert len(listing)<=1600, 'Store description exceeds 1600 characters'
roots=['src','gateway','renderer','resources','scripts','tests','docs','appstore-assets','.github']
files=[]
for folder in roots:
 for p in (root/folder).rglob('*'):
  if p.is_file() and not any(x in {'node_modules','dist','build','__pycache__','.DS_Store'} for x in p.relative_to(root).parts):files.append(p)
files += [root/p for p in ['README.md','ACKNOWLEDGMENTS.md','LICENSE','PRIVACY.md','THIRD_PARTY_NOTICES.md','CONTRIBUTING.md','SECURITY.md','CHANGELOG.md','RELEASING.md','APPSTORE_LISTING.md','package.json','wscript','.gitignore','index.html']]
for p in files:
 data=p.read_bytes()
 if p.suffix.lower() not in {'.png','.ttf','.woff','.woff2','.otf'}:
  patterns=[rb'/Users/[A-Za-z][^/\s]*/',rb'tail[0-9a-f]{6}\.ts\.net',rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----']
  if p.name!='package-release-kit.py' and any(re.search(pattern,data) for pattern in patterns):
   raise SystemExit('Private configuration marker in '+str(p.relative_to(root)))
def archive(target,entries,prefix):
 with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
  for p in sorted(entries):z.write(p,prefix+str(p.relative_to(root)))
 with zipfile.ZipFile(target) as z:assert z.testzip() is None
source=dist/f'Notesy-{version}-source.zip';archive(source,files,f'notesy-{version}/')
art=dist/f'Notesy-{version}-store-assets.zip';archive(art,[p for p in files if 'appstore-assets' in p.parts]+[root/'APPSTORE_LISTING.md'],'')
artifacts=[pbw,source,art]
(dist/'SHA256SUMS').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in artifacts))
manifest={'app':'Notesy','version':version,'status':'release-candidate-not-published','uuid':json.loads((root/'package.json').read_text())['pebble']['uuid'],'license':'MIT','artifacts':[{'name':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in artifacts]}
(dist/'release-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Public PBW, source, store assets and SHA-256 manifest ready. Publication remains pending.')
