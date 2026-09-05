#!/usr/bin/env python3
"""Export Notesy's original, pixel-aligned 25px launcher glyph without imaging dependencies."""
from pathlib import Path
import struct,zlib
root=Path(__file__).resolve().parents[1]
w=h=25
pixels=[[(0,0,0,0) for _ in range(w)] for _ in range(h)]
white=(255,255,255,255);ink=(0,0,0,255)
for y in range(2,23):
 for x in range(4,22):
  if (y in (2,22) and x in (4,21)):continue
  pixels[y][x]=white
for y in (6,18):
 for x in range(8,18):pixels[y][x]=ink;pixels[y+1][x]=ink
for x,height in [(8,2),(10,4),(12,8),(14,4),(16,2)]:
 for y in range(12-height//2,12+(height+1)//2):pixels[y][x]=ink
for y in range(19,23):
 for x in range(18,22):
  if x+y>=40:pixels[y][x]=(0,0,0,0)
def chunk(name,data):return struct.pack('!I',len(data))+name+data+struct.pack('!I',zlib.crc32(name+data)&0xffffffff)
raw=b''.join(b'\0'+bytes(v for pixel in row for v in pixel) for row in pixels)
png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',w,h,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(raw))+chunk(b'IEND',b'')
(root/'resources/images/notesy-menu-icon.png').write_bytes(png)
