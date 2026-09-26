import storage from './storage.js';

function uid(){
  return 'tx_' + Math.random().toString(36).slice(2,11);
}

export function addTransaction(state, tx){
  // validate
  if(!tx || !tx.type || !['income','expense'].includes(tx.type)) throw new Error('Noto‘g‘ri tur');
  const amount = parseInt(tx.amount,10);
  if(!Number.isFinite(amount) || amount<=0) throw new Error('Noto‘g‘ri summa');
  if(!tx.currency || !['UZS','USD'].includes(tx.currency)) throw new Error('Noto‘g‘ri valyuta');
  const date = tx.date;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Noto‘g‘ri sana');
  const newTx = Object.assign({},tx,{id:uid(), createdAt:(new Date()).toISOString(), amount});
  state.transactions.push(newTx);
  storage.saveAll(state);
  return newTx;
}

export function editTransaction(state, id, patch){
  const idx = state.transactions.findIndex(t=>t.id===id);
  if(idx===-1) throw new Error('Topilmadi');
  const existing = state.transactions[idx];
  const updated = Object.assign({}, existing, patch);
  // validate same as add
  if(!['income','expense'].includes(updated.type)) throw new Error('Noto‘g‘ri tur');
  const amount = parseInt(updated.amount,10);
  if(!Number.isFinite(amount) || amount<=0) throw new Error('Noto‘g‘ri summa');
  if(!['UZS','USD'].includes(updated.currency)) throw new Error('Noto‘g‘ri valyuta');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(updated.date)) throw new Error('Noto‘g‘ri sana');
  updated.amount = amount;
  state.transactions[idx]=updated;
  storage.saveAll(state);
  return updated;
}

export function deleteTransaction(state,id){
  const idx = state.transactions.findIndex(t=>t.id===id);
  if(idx===-1) throw new Error('Topilmadi');
  const [removed]=state.transactions.splice(idx,1);
  storage.saveAll(state);
  return removed;
}

export function filterTransactions(state, opts={}){
  let list = state.transactions.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  if(opts.type && opts.type!=='all') list = list.filter(t=>t.type===opts.type);
  if(opts.currency && opts.currency!=='all') list = list.filter(t=>t.currency===opts.currency);
  if(opts.from) list = list.filter(t=>t.date>=opts.from);
  if(opts.to) list = list.filter(t=>t.date<=opts.to);
  if(opts.query) list = list.filter(t=> (t.note||'').toLowerCase().includes(opts.query.toLowerCase()));
  return list;
}

export function sumsByCurrency(transactions){
  const out = {UZS:0,USD:0};
  transactions.forEach(t=>{
    out[t.currency] = (out[t.currency]||0) + (t.type==='income'? t.amount: -t.amount);
  });
  return out;
}

export default {addTransaction,editTransaction,deleteTransaction,filterTransactions,sumsByCurrency}