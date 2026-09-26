import storage from './storage.js';
import transactions from './transactions.js';

export function exportJsonFile(){
  const text = storage.exportJson();
  const blob = new Blob([text],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='hisobim_export_'+Date.now()+'.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

export function exportCsv(transactionsList){
  const lines = ['"id","type","amount","currency","category","date","note","createdAt"'];
  transactionsList.forEach(t=>{
    const esc = (v)=> '"'+String(v||'').replace(/"/g,'""')+'"';
    lines.push([esc(t.id),esc(t.type),esc(t.amount),esc(t.currency),esc(t.category),esc(t.date),esc(t.note),esc(t.createdAt)].join(','));
  });
  const blob = new Blob(["\uFEFF"+lines.join('\n')],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='hisobim_tx_'+Date.now()+'.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

export async function importJsonFile(file, state){
  const text = await file.text();
  const incoming = storage.importJson(text);
  // merge carefully
  // show counts
  const nTx = incoming.transactions.length || 0;
  return {incoming, counts:{transactions:nTx}};
}

export default {exportJsonFile,exportCsv,importJsonFile}