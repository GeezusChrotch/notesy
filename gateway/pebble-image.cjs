'use strict';
// Shared Organik image quantizer, v1. No network or native dependencies.
// Room palette samples derived from czmanix/pebble-color-optimizer, MIT,
// commit d0609657e0a1d41241c84954855b19a7547ba9c6. These approximate one lighting
// condition, not a factory calibration. Normalize its black/white endpoints.
// Copyright (c) 2026 czmanix
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
const ROOM = [[20,19,24],[23,28,40],[23,33,54],[19,40,64],[30,37,40],[30,37,40],[35,52,64],[33,56,73],[43,56,46],[43,58,56],[44,64,67],[42,66,76],[52,67,52],[49,69,61],[54,79,77],[48,80,84],[39,25,30],[47,30,39],[40,38,57],[40,38,57],[51,45,40],[48,48,48],[50,50,59],[55,62,77],[57,54,47],[62,64,61],[62,67,71],[58,69,78],[68,72,56],[66,72,64],[67,78,73],[68,82,87],[47,30,39],[60,42,56],[60,42,56],[59,48,68],[69,50,47],[66,52,57],[65,56,64],[68,63,78],[73,62,54],[72,66,63],[74,72,75],[74,72,78],[79,74,61],[81,77,70],[80,79,77],[79,84,88],[74,37,40],[68,41,57],[68,41,57],[74,53,74],[74,49,46],[82,58,61],[79,60,71],[75,63,75],[88,64,58],[84,66,64],[82,69,73],[86,77,85],[91,76,68],[91,76,68],[90,80,78],[91,86,87]];
const clamp = v => Math.max(0, Math.min(255, v));
const palette = ROOM.map(rgb => rgb.map((v,c) => clamp((v-ROOM[0][c])*255/(ROOM[63][c]-ROOM[0][c]))));
function normalizeImageMode(value) { return ['natural','high-contrast','original'].includes(value) ? value : 'natural'; }
function quantizeImage({width,height,rgba,mode='natural',kind='photo'}) {
  if (!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>200||height>228||!rgba||rgba.length!==width*height*4) throw new Error('Invalid watch image dimensions');
  mode=normalizeImageMode(mode);
  const output=new Uint8Array(width*height), data=new Float32Array(width*height*3);
  const drawing=kind==='drawing', contrast=mode==='high-contrast'?1.3:(drawing?1.12:1.06);
  for(let p=0;p<output.length;p++) {
    const alpha=rgba[p*4+3]/255;
    for(let c=0;c<3;c++) {
      const value=rgba[p*4+c]*alpha+255*(1-alpha);
      data[p*3+c]=mode==='original'?value:clamp((value-128)*contrast+128);
    }
  }
  const neighbors=[[1,0],[2,0],[-1,1],[0,1],[1,1],[0,2]];
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
    const p=y*width+x, i=p*3;
    const rgb=[clamp(data[i]),clamp(data[i+1]),clamp(data[i+2])];
    let color=0;
    if(mode==='original') color=(Math.round(rgb[0]/85)<<4)|(Math.round(rgb[1]/85)<<2)|Math.round(rgb[2]/85);
    else {
      let best=Infinity;
      for(let k=0;k<64;k++) {
        const r=rgb[0]-palette[k][0],g=rgb[1]-palette[k][1],b=rgb[2]-palette[k][2];
        const distance=0.299*r*r+0.587*g*g+0.114*b*b;
        if(distance<best){best=distance;color=k;}
      }
    }
    output[p]=0xc0|color;
    // Atkinson's partial error diffusion leaves edges crisp. Never dither line art.
    if(mode!=='original'&&!drawing) for(const [dx,dy] of neighbors) {
      const nx=x+dx,ny=y+dy;if(nx<0||nx>=width||ny>=height)continue;
      for(let c=0;c<3;c++)data[(ny*width+nx)*3+c]+=(rgb[c]-palette[color][c])/8;
    }
  }
  return output;
}
module.exports={quantizeImage,normalizeImageMode};
