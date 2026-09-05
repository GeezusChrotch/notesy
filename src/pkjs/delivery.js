'use strict';
// One atomic localStorage record keeps the queue and acknowledgements consistent.
function Delivery(storage, send, notify) {
  var state = JSON.parse(storage.getItem('stonenotes.delivery') || '{"pending":[],"done":[]}');
  if (!Array.isArray(state.pending) || !Array.isArray(state.done)) throw Error('Pending notes could not be loaded.');
  var busy = false;
  function commit(next) { storage.setItem('stonenotes.delivery', JSON.stringify(next)); state = next; }
  this.enqueue = function(id, text, config, targetId) {
    targetId=targetId||'';
    if(targetId&&!/^[a-f0-9]{64}$/.test(targetId))throw Error('Invalid append destination.');
    if (state.done.indexOf(id) >= 0) { notify('saved', id); return; }
    var existing=state.pending.filter(function(p) { return p.id === id; })[0];
    if (existing) { if(existing.text!==text||(existing.targetId||'')!==targetId)throw Error('Draft ID conflict. Your original pending note was preserved.');notify('queued', id); return; }
    if (!config || !config.vaultId) throw Error('Pair StoneNotes in phone Settings first.');
    if (state.pending.length >= 20) throw Error('20 notes are waiting. Connect to your Mac before adding more.');
    commit({pending:state.pending.concat([{id:id,text:text,targetId:targetId,vaultId:config.vaultId,origin:config.gatewayURL}]),done:state.done});
    notify('queued', id);
  };
  this.pump = function(config) {
    if (busy || !state.pending.length || !config) return;
    var note = state.pending[0];
    if (note.origin !== config.gatewayURL || note.vaultId !== config.vaultId) { notify('blocked', note.id, 'Pending note belongs to a different connection or vault. Restore its pairing in Settings.'); return; }
    busy = true;
    send(config, {requestId:note.id,text:note.text,vaultId:note.vaultId,targetId:note.targetId||''}, function(error, value) {
      busy = false;
      if (error || !value || !value.saved) { notify('waiting', note.id, error && error.message); return; }
      try {
        commit({pending:state.pending.filter(function(p) { return p.id !== note.id; }),done:state.done.concat([note.id]).slice(-128)});
      } catch (e) { notify('waiting',note.id,'Phone storage is full. Delivery will be checked again.'); return; }
      notify('saved', note.id);
    });
  };
  this.pending = function() { return state.pending.slice(); };
}
module.exports = Delivery;
