import {build} from 'esbuild';import fs from 'node:fs';import path from 'node:path';
const root=path.dirname(new URL(import.meta.url).pathname),out=path.join(root,'dist');fs.mkdirSync(out,{recursive:true});
await build({entryPoints:[path.join(root,'entry.js')],bundle:true,minify:true,format:'iife',legalComments:'external',platform:'browser',define:{'process.env.NODE_ENV':'"production"'},outfile:path.join(out,'renderer.js'),loader:{'.woff2':'dataurl','.woff':'dataurl','.ttf':'dataurl'}});
fs.cpSync(path.join(root,'node_modules/@excalidraw/excalidraw/dist/prod/fonts'),path.join(out,'fonts'),{recursive:true});
fs.writeFileSync(path.join(out,'index.html'),`<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; font-src 'self' data:; img-src data: blob:; connect-src 'self';"><script>window.EXCALIDRAW_ASSET_PATH='./';</script><script src="renderer.js"></script>`);
fs.cpSync(path.join(root,'node_modules/lz-string/libs/lz-string.js'),path.join(out,'lz-string.js'));
fs.cpSync(path.join(root,'node_modules/lz-string/LICENSE'),path.join(out,'LZString-LICENSE.txt'));
fs.cpSync(path.join(root,'Excalidraw-LICENSE.txt'),path.join(out,'Excalidraw-LICENSE.txt'));

fs.cpSync(path.join(root,'Font-Notices.txt'),path.join(out,'Font-Notices.txt'));
