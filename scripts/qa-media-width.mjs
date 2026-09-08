// Isolated, synthetic-only visual QA. Never connects to the phone or live gateway.
// Usage: node scripts/qa-media-emulator.mjs /path/to/SDK/version
import {spawn, execFileSync} from 'node:child_process';
import {mkdtempSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import net from 'node:net';

const sdk = process.argv[2]; if (!sdk) throw new Error('SDK directory required');
const output = mkdtempSync(join(tmpdir(),'notesy-media-qa-'));
const firmware = join(sdk,'sdk-core/pebble/emery/qemu');
writeFileSync(join(output,'flash.bin'),execFileSync('bzip2',['-dc',join(firmware,'qemu_spi_flash.bin.bz2')],{maxBuffer:32*1024*1024}));
async function freePort() {const server=net.createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;await new Promise(r=>server.close(r));return port;}
const port=await freePort(), monitor=await freePort();
const emulator=spawn(join(sdk,'toolchain/bin/qemu-pebble'),['-rtc','base=localtime','-serial','null','-serial',`tcp:127.0.0.1:${port},server=on,wait=off`,
  '-serial','null','-kernel',join(firmware,'qemu_micro_flash.bin'),'-monitor',`tcp:127.0.0.1:${monitor},server=on,wait=off`,
  '-machine','pebble-emery','-cpu','cortex-m33','-drive',`if=mtd,format=raw,file=${join(output,'flash.bin')}`,'-audio','driver=none,id=audio0','-display','none'],{stdio:'ignore'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const cli=(command,args=[])=>execFileSync('pebble',[command,'--qemu',`127.0.0.1:${port}`,...args],{timeout:20000,maxBuffer:1024*1024});
function send(strings={},ints={},bytes) {
  const args=[];
  if(Object.keys(strings).length)args.push('--string',...Object.entries(strings).map(([k,v])=>`${k}=${v}`));
  if(Object.keys(ints).length)args.push('--int',...Object.entries(ints).map(([k,v])=>`${k}=${v}`));
  if(bytes)args.push('--bytes',`33=${bytes.toString('hex')}`);
  cli('send-app-message',args);
}
async function screenshot(name) {
  const path=join(output,name+'.ppm');
  await new Promise((resolve,reject)=>{
    const s=net.connect(monitor,'127.0.0.1');let sent=false;
    s.on('error',reject);s.on('data',()=>{if(!sent){sent=true;s.write(`screendump ${path}\n`);setTimeout(()=>{s.end();resolve();},200);}});
    s.setTimeout(2000,()=>{s.destroy();reject(new Error('Monitor timeout'));});
  });
  execFileSync('sips',['-s','format','png',path,'--out',join(output,name+'.png')]);
}
async function show(width,height,title) {
 send({4:'Preview',28:'a'.repeat(64)},{1:12,7:2,23:2,6:0});
 send({29:'0',5:title},{1:13,8:0,20:2});
 send({29:'1',5:'Text after preview'},{1:13,8:1,20:0});send({},{1:14});
 const runs=[];for(let y=0;y<height;y++)runs.push(width,y<height/3?0xf0:y<height*2/3?0xcc:0xc3);
 send({},{1:16,31:width,32:height,23:runs.length});
 for(let i=0;i<runs.length;i+=256)send({},{1:17,8:i},Buffer.from(runs.slice(i,i+256)));
 send({},{1:18});await wait(300);
}
try {
 await wait(1800);cli('install',[resolve('dist/Notesy-1.4.8.pbw')]);
 send({26:'a'.repeat(64),18:'b'.repeat(64)},{1:6,25:2,11:255,12:192,13:192,14:255,15:5,16:22});
 send({4:'Vault'},{1:1,7:1,23:1,6:0});send({3:'c'.repeat(64),4:'Media test'},{1:2,8:0});send({},{1:3});
 cli('emu-button',['click','down']);cli('emu-button',['click','select']);await wait(300);
 await show(100,150,'Portrait photo / PDF');await screenshot('portrait-top');
 for(let i=0;i<12;i++)cli('emu-button',['click','down']);await wait(300);await screenshot('portrait-bottom');
 await show(176,70,'Landscape drawing');await screenshot('landscape');
 console.log(JSON.stringify({output}));
} finally {emulator.kill('SIGTERM');}
