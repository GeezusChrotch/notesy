#!/usr/bin/env python3
"""Use Pebble's publisher/auth flow, uploading the exact reviewed dist PBW.

Run with the Python environment that provides pebble_tool. All command arguments
are passed through to `pebble publish`. The SDK still performs its build/preflight;
only its upload artifact selection is overridden to preserve release checksums
and exclude the SDK's local debug source maps. No installed SDK files are edited.
"""
from pathlib import Path
import hashlib,json,sys,zipfile
from pebble_tool import run_tool
from pebble_tool.commands.publish import PublishCommand
root=Path(__file__).resolve().parents[1]
version=json.loads((root/'package.json').read_text())['version']
artifact=root/'dist'/f'Notesy-{version}.pbw'
manifest=json.loads((root/'dist/release-manifest.json').read_text())
expected=next(a['sha256'] for a in manifest['artifacts'] if a['name']==artifact.name)
def release_path(cls,project):
    if Path(project.project_dir).resolve()!=root:raise RuntimeError('Run from the Notesy project root.')
    if hashlib.sha256(artifact.read_bytes()).hexdigest()!=expected:raise RuntimeError('Release artifact checksum changed.')
    with zipfile.ZipFile(artifact) as z:
        if z.testzip() or any(n.endswith('.map') for n in z.namelist()):raise RuntimeError('Invalid public package.')
    return str(artifact)
PublishCommand._pbw_path_for_project=classmethod(release_path)
sys.argv[1:1]=['publish']
sys.exit(run_tool())
