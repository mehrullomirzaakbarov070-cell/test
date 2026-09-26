import storage from './storage.js';
import txModule from './transactions.js';
import currency from './currency.js';
import charts from './charts.js';
import expimp from './export-import.js';

let state = storage.loadAll();

const els = {};
function qs(sel){return document.querySelector(sel)}

function init(){
  els.themeToggle = qs('#themeToggle');
  els.baseCurrency = qs('#baseCurrency');
  els.usdRate = qs('#usdRate');
  els.balances = qs('#balances');
  els.summaryIncome = qs('#summaryIncome');
  els.summaryExpense = qs('#summaryExpense');
  els.recentList = qs('#recentList');
  els.canvasMonths = qs('#canvasMonths').getContext('2d');
  els.canvasCat = qs('#canvasCategories').getContext('2d');

  // restore settings
  const preferDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const userTheme = state.settings.theme ?? (preferDark? 'dark' : 'light');
  applyTheme(userTheme);
  els.themeToggle.checked = (userTheme==='dark');
  els.baseCurrency.value = state.settings.baseCurrency || 'UZS';
  if(state.settings.usdRate) els.usdRate.value = state.settings.usdRate;

  // nav
  document.querySelectorAll('.sidebar button').forEach(b=>b.addEventListener('click', onNav));

  qs('#demoLoad').addEventListener('click', onDemoLoad);
  qs('#clearAll').addEventListener('click', onClearAll);
  els.themeToggle.addEventListener('change', ()=>{ const v = els.themeToggle.checked? 'dark':'light'; state.settings.theme=v; storage.saveAll(state); applyTheme(v); });
  els.usdRate.addEventListener('change', ()=>{ try{ currency.setRate(state, els.usdRate.value); renderAll(); toast('Kurs saqlandi'); }catch(e){ toast(e.message,'danger'); }});

  qs('#addTx').addEventListener('click', ()=>openTransactionModal());
  qs('#exportJson').addEventListener('click', ()=>expimp.exportJsonFile());
  qs('#exportCsv').addEventListener('click', ()=>{ expimp.exportCsv(state.transactions); });
  qs('#importFile').addEventListener('change', async (e)=>{ if(!e.target.files.length) return; try{ const res = await expimp.importJsonFile(e.target.files[0], state); toast('Fayl yuklandi: '+res.counts.transactions+' tranzaksiya'); }catch(err){ toast(err.message,'danger'); } });

  renderAll();
}

function applyTheme(name){
  if(name==='dark') document.documentElement.setAttribute('data-theme','dark'); else document.documentElement.removeAttribute('data-theme');
}

function onNav(e){
  document.querySelectorAll('.sidebar button').forEach(b=>b.classList.remove('active'));
  e.currentTarget.classList.add('active');
  const nav = e.currentTarget.dataset.nav;
  document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
  qs('#view-'+nav).classList.remove('hidden');
}

function onDemoLoad(){
  if(state.demoLoaded){ toast('Demo oldin yuklangan'); return; }
  if(!confirm('Demo ma\'lumotlarni yuklash tasdiqlaysizmi?')) return;
  // create some demo tx
  const d = new Date();
  const add = (t)=>{ try{ txModule.addTransaction(state,t);}catch(e){console.error(e)} };
  add({type:'income',amount:1000000,currency:'UZS',category:'Ish haqi',date:formatDate(d)});
  add({type:'income',amount:200,currency:'USD',category:'Freelance',date:formatDate(d)});
  add({type:'expense',amount:200000,currency:'UZS',category:'Oziq-ovqat',date:formatDate(d)});
  add({type:'expense',amount:50,currency:'USD',category:'Transport',date:formatDate(d)});
  state.demoLoaded=true; storage.saveAll(state); renderAll(); toast('Demo yuklandi');
}

function onClearAll(){
  if(!confirm('Barcha ma\'lumotlarni o\'chirish — davom etilsinmi?')) return;
  if(!confirm('Bu amal qaytarilmaydi. Tasdiqlaysizmi?')) return;
  storage.clearAll(); state = storage.loadAll(); renderAll(); toast('Hammasi o\'chirildi');
}

function formatDate(d){ return d.toISOString().slice(0,10); }

function renderAll(){
  state = storage.loadAll();
  renderBalances();
  renderSummary();
  renderRecent();
  renderTransactionsList();
  // charts
  charts.drawMonthsChart(els.canvasMonths, state.transactions, null);
  charts.drawCategoriesChart(els.canvasCat, state.transactions, null);
}

function renderBalances(){
  const sums = txModule.sumsByCurrency(state.transactions);
  els.balances.innerHTML='';
  ['UZS','USD'].forEach(c=>{
    const div = document.createElement('div'); div.className='value';
    div.innerHTML = `<div class="label">${c}</div><div class="amount">${currency.formatAmount(sums[c]||0,c)}</div>`;
    els.balances.appendChild(div);
  });
}

function renderSummary(){
  const incomes = state.transactions.filter(t=>t.type==='income');
  const expenses = state.transactions.filter(t=>t.type==='expense');
  const inc = incomes.reduce((s,t)=>s+t.amount,0);
  const exp = expenses.reduce((s,t)=>s+t.amount,0);
  els.summaryIncome.textContent = currency.formatAmount(inc,'UZS') + ' / ' + currency.formatAmount(inc,'USD');
  els.summaryExpense.textContent = currency.formatAmount(exp,'UZS') + ' / ' + currency.formatAmount(exp,'USD');
}

function renderRecent(){
  const list = state.transactions.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,6);
  els.recentList.innerHTML='';
  list.forEach(t=>{
    const div = document.createElement('div'); div.className='tx '+t.type;
    div.innerHTML = `<div class="left"><div><strong>${t.category||''}</strong><div class="meta">${t.date} • ${t.note||''}</div></div></div><div class="amount">${t.currency} ${t.amount}</div>`;
    els.recentList.appendChild(div);
  });
}

function renderTransactionsList(filters={}){
  const container = qs('#transactionsContainer');
  const list = txModule.filterTransactions(state,filters);
  container.innerHTML='';
  if(list.length===0){ container.innerHTML='<p class="muted">Tranzaksiyalar yo‘q</p>'; return; }
  list.forEach(t=>{
    const el = document.createElement('div'); el.className='tx '+t.type;
    el.innerHTML = `<div class="left"><div><strong>${t.category||''}</strong><div class="meta">${t.date} • ${t.note||''}</div></div></div><div><div class="amount">${t.currency} ${t.amount}</div><div class="actions"><button data-id="${t.id}" class="edit">Tahrirlash</button> <button data-id="${t.id}" class="del danger">O'chirish</button></div></div>`;
    container.appendChild(el);
  });
  container.querySelectorAll('.edit').forEach(b=>b.addEventListener('click', (e)=> openTransactionModal(list.find(x=>x.id===e.target.dataset.id))));
  container.querySelectorAll('.del').forEach(b=>b.addEventListener('click', (e)=>{ if(confirm('O\'chirishni tasdiqlaysizmi?')){ txModule.deleteTransaction(state,e.target.dataset.id); renderAll(); toast('O\'chirildi'); }}));
}

function openTransactionModal(tx){
  const modal = qs('#modal'); modal.classList.remove('hidden');
  modal.innerHTML = '';
  const dlg = document.createElement('div'); dlg.className='dialog';
  const isEdit = !!tx;
  dlg.innerHTML = `<h3>${isEdit? 'Tranzaksiyani tahrirlash':'Yangi tranzaksiya'}</h3>
    <form id="txForm">
      <label>Tur<select name="type"><option value="income">Daromad</option><option value="expense">Xarajat</option></select></label>
      <label>Summa<input name="amount" type="number" min="1" required></label>
      <label>Valyuta<select name="currency"><option value="UZS">UZS</option><option value="USD">USD</option></select></label>
      <label>Kategoriya<select name="category">${getCategoryOptions()}</select></label>
      <label>Sana<input name="date" type="date" required></label>
      <label>Izoh<input name="note" type="text"></label>
      <div style="display:flex;gap:8px;margin-top:12px"><button type="submit">Saqlash</button><button type="button" id="cancel">Bekor qilish</button></div>
    </form>`;
  modal.appendChild(dlg);
  const form = dlg.querySelector('#txForm');
  if(isEdit){ form.type.value = tx.type; form.amount.value = tx.amount; form.currency.value = tx.currency; form.category.value = tx.category; form.date.value = tx.date; form.note.value = tx.note; }
  dlg.querySelector('#cancel').addEventListener('click', ()=>{ modal.classList.add('hidden'); modal.innerHTML=''; });
  form.addEventListener('submit',(e)=>{
    e.preventDefault();
    const data = new FormData(form); const obj={type:data.get('type'), amount:data.get('amount'), currency:data.get('currency'), category:data.get('category'), date:data.get('date'), note:data.get('note')};
    try{
      if(isEdit) txModule.editTransaction(state, tx.id, obj); else txModule.addTransaction(state,obj);
      modal.classList.add('hidden'); modal.innerHTML=''; renderAll(); toast('Saqlandi');
    }catch(err){ toast(err.message,'danger'); }
  });
}

function getCategoryOptions(){
  const inc = state.categories.income.map(c=>`<option value="${c}">${c}</option>`).join('');
  const exp = state.categories.expense.map(c=>`<option value="${c}">${c}</option>`).join('');
  return inc+exp;
}

// simple toast
function toast(msg, type='ok'){
  const t = document.createElement('div'); t.textContent=msg; t.style.position='fixed'; t.style.right='16px'; t.style.bottom='16px'; t.style.padding='10px 14px'; t.style.borderRadius='10px'; t.style.background= type==='danger'? 'var(--danger)': 'var(--accent)'; t.style.color='#fff'; document.body.appendChild(t);
  setTimeout(()=>t.remove(),3000);
}

window.addEventListener('DOMContentLoaded', init);