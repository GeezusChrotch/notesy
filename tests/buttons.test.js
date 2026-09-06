'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Buttons=require('../src/pkjs/buttons');
test('legacy shortcuts cannot replace single-press navigation in either view',()=>{
 const old=[3,9,1,4,5,1,2,10,3,4,2,6];
 assert.deepEqual(Buttons.normalize(old),[0,9,0,4,5,1,0,10,0,4,2,6]);
});
test('settings omit navigation selectors and preserve customizable shortcuts on save',()=>{
 const saved=[3,9,1,4,5,1,2,10,3,4,2,6],box={innerHTML:''};
 const elements={buttons:box};
 for(const i of [1,3,4,5,7,9,10,11])elements['button-'+i]={value:String(saved[i])};
 global.document={getElementById:id=>elements[id]};
 try{
  const read=Buttons.setup(saved);
  for(const i of [0,2,6,8])assert.ok(!box.innerHTML.includes('id="button-'+i+'"'));
  assert.deepEqual(read(),[0,9,0,4,5,1,0,10,0,4,2,6]);
 }finally{delete global.document;}
});
