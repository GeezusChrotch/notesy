const {test}=require('node:test');const assert=require('node:assert/strict');const Delivery=require('../src/pkjs/delivery');
function storage(){const data={};return {getItem:k=>data[k]||null,setItem:(k,v)=>{data[k]=v;}};}
const config={gatewayURL:'https://example.ts.net',vaultId:'vault'};
test('offline capture survives phone process restart; duplicate watch retries do not enqueue twice',()=>{
 const s=storage(),events=[];let d=new Delivery(s,(_c,_n,cb)=>cb(Error('offline')),(...a)=>events.push(a));
 d.enqueue('capture-1','Remember this',config);d.pump(config);assert.equal(d.pending().length,1);
 d=new Delivery(s,(_c,_n,cb)=>cb(null,{saved:true}),(...a)=>events.push(a));d.enqueue('capture-1','Remember this',config);assert.equal(d.pending().length,1);d.pump(config);assert.equal(d.pending().length,0);
 d=new Delivery(s,()=>assert.fail('already saved'),(...a)=>events.push(a));d.enqueue('capture-1','Remember this',config);assert.equal(events.at(-1)[0],'saved');
});
test('storage failure cannot acknowledge capture or delete a delivered note prematurely',()=>{
 const s=storage(),events=[];let send;const d=new Delivery(s,(_c,_n,cb)=>{send=cb;},(...a)=>events.push(a));
 d.enqueue('capture-2','Keep me',config);d.pump(config);s.setItem=()=>{throw Error('full');};send(null,{saved:true});assert.equal(d.pending().length,1);assert.equal(events.at(-1)[0],'waiting');
 assert.throws(()=>d.enqueue('capture-3','Another note',config),/full/);assert.equal(d.pending().length,1);
});
test('queued notes never move to a newly selected vault or Mac',()=>{
 const s=storage(),events=[];const d=new Delivery(s,()=>assert.fail('wrong destination'),(...a)=>events.push(a));d.enqueue('capture-4','For original vault',config);d.pump({...config,vaultId:'other'});d.pump({...config,gatewayURL:'https://other.ts.net'});assert.equal(d.pending().length,1);assert.equal(events.at(-1)[0],'blocked');
});
