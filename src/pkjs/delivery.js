'use strict';
// One atomic localStorage record keeps the queue and acknowledgements consistent.
function Delivery(storage, send, notify) {
  var state = JSON.parse(storage.getItem('stonenotes.delivery') || '{"pending":[],"done":[]}');
  if (!Array.isArray(state.pending) || !Array.isArray(state.done)) throw Error('Pending notes could not be loaded.');
  var busy = false;
  function commit(next) { storage.setItem('stonenotes.delivery', JSON.stringify(next)); state = next; }
  this.enqueue = function(id, text, config, targetId, location) {
    targetId=targetId||'';location=location||{};
    var api=location.api===2?2:1,folderId=location.folderId||'',vaultId=api===2?location.vaultId:config&&config.vaultId;
    if(api===2&&(!/^[a-f0-9]{64}$/.test(vaultId)||!/^[a-f0-9]{64}$/.test(folderId)))throw Error('Reload the vault before dictating.');
    if(targetId&&!/^[a-f0-9]{64}$/.test(targetId))throw Error('Invalid append destination.');
    var completed=state.done.filter(function(d){return (typeof d==='string'?d:d.id)===id;})[0];
    if (completed) { notify('saved', id, null, completed.targetId||''); return; }
    var existing=state.pending.filter(function(p) { return p.id === id; })[0];
    if (existing) { if(existing.text!==text||(existing.targetId||'')!==targetId||(existing.api||1)!==api||(existing.folderId||'')!==folderId)throw Error('Draft ID conflict. Your original pending note was preserved.');notify('queued', id); return; }
    if (!config || !config.vaultId) throw Error('Pair Notesy in phone Settings first.');
    if (state.pending.length >= 20) throw Error('20 notes are waiting. Connect to your Mac before adding more.');
    commit({pending:state.pending.concat([{id:id,text:text,targetId:targetId,vaultId:vaultId,origin:config.gatewayURL,api:api,folderId:folderId}]),done:state.done});
    notify('queued', id);
  };
  this.pump = function(config) {
    if (busy || !state.pending.length || !config) return;
    var note = state.pending[0];
    if (note.origin !== config.gatewayURL || note.vaultId !== (note.api===2?config.browserId:config.vaultId)) { notify('blocked', note.id, 'Pending note belongs to a different connection or vault. Restore its pairing in Settings.'); return; }
    busy = true;
    send(config, {requestId:note.id,text:note.text,vaultId:note.vaultId,targetId:note.targetId||'',api:note.api||1,folderId:note.folderId||''}, function(error, value) {
      busy = false;
      if (error || !value || !value.saved) { notify('waiting', note.id, error && error.message); return; }
      try {
        commit({pending:state.pending.filter(function(p) { return p.id !== note.id; }),done:state.done.concat([{id:note.id,targetId:value.id||note.targetId||''}]).slice(-128)});
      } catch (e) { notify('waiting',note.id,'Phone storage is full. Delivery will be checked again.'); return; }
      notify('saved', note.id, null, value.id||note.targetId||'');
    });
  };
  this.pending = function() { return state.pending.slice(); };
}
module.exports = Delivery;
