// main bundled fallback for file:// environments
// This file inlines the previous module files to avoid CORS/ESM file protocol issues.
console.log('Hisobim: main.js initializing');
window.addEventListener('error', (ev)=>{
	try{ console.error('Global error', ev.error || ev.message); toast('Xato: '+(ev.message||ev.error||'unknown'),'danger'); }catch(e){}
});

/* storage.js */
const STORAGE_KEY = 'hisobim_v1';
const SCHEMA_VERSION = 1;
function safeParse(json){ try{return JSON.parse(json)}catch(e){return null} }
function loadAll(){ const raw = localStorage.getItem(STORAGE_KEY); if(!raw) return getEmpty(); const data = safeParse(raw); if(!data || data.schema !== SCHEMA_VERSION) return getEmpty(); return data; }
function saveAll(state){ try{ const toSave = Object.assign({}, state, {schema:SCHEMA_VERSION}); localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)); return true;}catch(e){ console.error('Saqlash xatosi',e); return false; }}
function clearAll(){ localStorage.removeItem(STORAGE_KEY); }
function getEmpty(){ return { schema:SCHEMA_VERSION, settings:{ theme: null, baseCurrency: 'UZS', usdRate: null }, categories:{ income:["Ish haqi","Freelance","Biznes","Sovg'a","Boshqa daromad"], expense:["Oziq-ovqat","Transport","Uy-joy","Kommunal","Sog'liq","Ta'lim","Ko'ngilochar","Xaridlar","Boshqa xarajat"] }, transactions:[], budgets:[], goals:[], demoLoaded:false } }
function exportJson(){ const data = loadAll(); const payload = {meta:{generated: (new Date()).toISOString(), schema:SCHEMA_VERSION},data}; return JSON.stringify(payload, null, 2); }
function importJson(raw){ const parsed = safeParse(raw); if(!parsed || !parsed.data) throw new Error('Noto‘g‘ri fayl tuzilishi'); const incoming = parsed.data; if(incoming.schema !== SCHEMA_VERSION) throw new Error('Schema versiyasi mos emas'); return incoming; }
function getSizeBytes(){ const raw = localStorage.getItem(STORAGE_KEY); return raw? new Blob([raw]).size:0; }

/* transactions.js */
function uid(){ return 'tx_' + Math.random().toString(36).slice(2,11); }
function addTransaction(state, tx){ if(!tx || !tx.type || !['income','expense'].includes(tx.type)) throw new Error('Noto‘g‘ri tur'); const amount = parseInt(tx.amount,10); if(!Number.isFinite(amount) || amount<=0) throw new Error('Noto‘g‘ri summa'); if(!tx.currency || !['UZS','USD'].includes(tx.currency)) throw new Error('Noto‘g‘ri valyuta'); const date = tx.date; if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Noto‘g‘ri sana'); const newTx = Object.assign({},tx,{id:uid(), createdAt:(new Date()).toISOString(), amount}); state.transactions.push(newTx); saveAll(state); return newTx; }
function editTransaction(state, id, patch){ const idx = state.transactions.findIndex(t=>t.id===id); if(idx===-1) throw new Error('Topilmadi'); const existing = state.transactions[idx]; const updated = Object.assign({}, existing, patch); if(!['income','expense'].includes(updated.type)) throw new Error('Noto‘g‘ri tur'); const amount = parseInt(updated.amount,10); if(!Number.isFinite(amount) || amount<=0) throw new Error('Noto‘g‘ri summa'); if(!['UZS','USD'].includes(updated.currency)) throw new Error('Noto‘g‘ri valyuta'); if(!/^\d{4}-\d{2}-\d{2}$/.test(updated.date)) throw new Error('Noto‘g‘ri sana'); updated.amount = amount; state.transactions[idx]=updated; saveAll(state); return updated; }
function deleteTransaction(state,id){ const idx = state.transactions.findIndex(t=>t.id===id); if(idx===-1) throw new Error('Topilmadi'); const [removed]=state.transactions.splice(idx,1); saveAll(state); return removed; }
function filterTransactions(state, opts={}){ let list = state.transactions.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)); if(opts.type && opts.type!=='all') list = list.filter(t=>t.type===opts.type); if(opts.currency && opts.currency!=='all') list = list.filter(t=>t.currency===opts.currency); if(opts.from) list = list.filter(t=>t.date>=opts.from); if(opts.to) list = list.filter(t=>t.date<=opts.to); if(opts.query) list = list.filter(t=> (t.note||'').toLowerCase().includes(opts.query.toLowerCase())); return list; }
function sumsByCurrency(transactions){ const out = {UZS:0,USD:0}; transactions.forEach(t=>{ out[t.currency] = (out[t.currency]||0) + (t.type==='income'? t.amount: -t.amount); }); return out; }

/* currency.js */
function setRate(state, rate){ const r = Number(rate); if(!Number.isFinite(r) || r<=0) throw new Error('Kurs noto‘g‘ri'); state.settings.usdRate = r; saveAll(state); }
function formatAmount(amount, currency){ const locale = 'uz-UZ'; const opts = {style:'currency',currency:currency,maximumFractionDigits:0}; try{ return new Intl.NumberFormat(locale,opts).format(amount); }catch(e){ return amount + ' ' + currency; } }
function toBase(amount, currency, baseCurrency, rate){ if(baseCurrency===currency) return amount; if(!rate) return null; if(currency==='USD' && baseCurrency==='UZS') return Math.round(amount * rate); if(currency==='UZS' && baseCurrency==='USD') return Math.round(amount / rate); return null; }

/* charts.js */
function drawMonthsChart(ctx, transactions, currencyFilter){ const dpr = window.devicePixelRatio || 1; const width = ctx.canvas.width; const height = ctx.canvas.height; ctx.canvas.width = width * dpr; ctx.canvas.height = height * dpr; ctx.scale(dpr,dpr); ctx.clearRect(0,0,width,height); const months = {}; transactions.forEach(t=>{ if(currencyFilter && t.currency!==currencyFilter) return; const m = t.date.slice(0,7); months[m] = months[m] || {income:0,expense:0}; months[m][t.type]+=t.amount; }); const keys = Object.keys(months).sort(); if(keys.length===0){ ctx.fillStyle='#666'; ctx.font='14px sans-serif'; ctx.fillText('Ma’lumot yo‘q',20,30); return; } const padding=40; const barW = (width - padding*2) / keys.length / 2; const max = Math.max(...keys.map(k=>months[k].income+months[k].expense)); keys.forEach((k,i)=>{ const x = padding + i*((barW*2)+10); const incomeH = (months[k].income / max) * (height - 80); const expenseH = (months[k].expense / max) * (height - 80); ctx.fillStyle = '#10b981'; ctx.fillRect(x, height - 30 - incomeH, barW, incomeH); ctx.fillStyle = '#ef4444'; ctx.fillRect(x + barW, height - 30 - expenseH, barW, expenseH); ctx.fillStyle = '#333'; ctx.font='12px sans-serif'; ctx.fillText(k, x, height-8); }); }
function drawMonthsChart(ctx, transactions, currencyFilter){ if(!ctx || !ctx.canvas) return; const dpr = window.devicePixelRatio || 1; const width = ctx.canvas.width; const height = ctx.canvas.height; ctx.canvas.width = width * dpr; ctx.canvas.height = height * dpr; ctx.scale(dpr,dpr); ctx.clearRect(0,0,width,height); const months = {}; transactions.forEach(t=>{ if(currencyFilter && t.currency!==currencyFilter) return; const m = t.date.slice(0,7); months[m] = months[m] || {income:0,expense:0}; months[m][t.type]+=t.amount; }); const keys = Object.keys(months).sort(); if(keys.length===0){ ctx.fillStyle='#666'; ctx.font='14px sans-serif'; ctx.fillText('Ma’lumot yo‘q',20,30); return; } const padding=40; const barW = (width - padding*2) / keys.length / 2; const max = Math.max(...keys.map(k=>months[k].income+months[k].expense)); keys.forEach((k,i)=>{ const x = padding + i*((barW*2)+10); const incomeH = (months[k].income / max) * (height - 80); const expenseH = (months[k].expense / max) * (height - 80); ctx.fillStyle = '#10b981'; ctx.fillRect(x, height - 30 - incomeH, barW, incomeH); ctx.fillStyle = '#ef4444'; ctx.fillRect(x + barW, height - 30 - expenseH, barW, expenseH); ctx.fillStyle = '#333'; ctx.font='12px sans-serif'; ctx.fillText(k, x, height-8); }); }
function drawCategoriesChart(ctx, transactions, currencyFilter){ const dpr = window.devicePixelRatio || 1; const width = ctx.canvas.width; const height = ctx.canvas.height; ctx.canvas.width = width * dpr; ctx.canvas.height = height * dpr; ctx.scale(dpr,dpr); ctx.clearRect(0,0,width,height); const map = {}; transactions.forEach(t=>{ if(t.type!=='expense') return; if(currencyFilter && t.currency!==currencyFilter) return; const cat = t.category||'Boshqa'; map[cat]=(map[cat]||0)+t.amount; }); const keys = Object.keys(map); if(keys.length===0){ ctx.fillStyle='#666'; ctx.font='14px sans-serif'; ctx.fillText('Ma’lumot yo‘q',20,30); return; } const total = keys.reduce((s,k)=>s+map[k],0); let start= -Math.PI/2; keys.forEach((k,i)=>{ const slice = (map[k]/total)*(Math.PI*2); ctx.beginPath(); ctx.moveTo(width/2,height/2); ctx.arc(width/2,height/2, Math.min(width,height)/3, start, start+slice); ctx.closePath(); const hue = (i*47)%360; ctx.fillStyle = `hsl(${hue} 70% 50%)`; ctx.fill(); start += slice; }); }
function drawCategoriesChart(ctx, transactions, currencyFilter){ if(!ctx || !ctx.canvas) return; const dpr = window.devicePixelRatio || 1; const width = ctx.canvas.width; const height = ctx.canvas.height; ctx.canvas.width = width * dpr; ctx.canvas.height = height * dpr; ctx.scale(dpr,dpr); ctx.clearRect(0,0,width,height); const map = {}; transactions.forEach(t=>{ if(t.type!=='expense') return; if(currencyFilter && t.currency!==currencyFilter) return; const cat = t.category||'Boshqa'; map[cat]=(map[cat]||0)+t.amount; }); const keys = Object.keys(map); if(keys.length===0){ ctx.fillStyle='#666'; ctx.font='14px sans-serif'; ctx.fillText('Ma’lumot yo‘q',20,30); return; } const total = keys.reduce((s,k)=>s+map[k],0); let start= -Math.PI/2; keys.forEach((k,i)=>{ const slice = (map[k]/total)*(Math.PI*2); ctx.beginPath(); ctx.moveTo(width/2,height/2); ctx.arc(width/2,height/2, Math.min(width,height)/3, start, start+slice); ctx.closePath(); const hue = (i*47)%360; ctx.fillStyle = `hsl(${hue} 70% 50%)`; ctx.fill(); start += slice; }); }

/* export-import.js */
function exportJsonFile(){ const text = exportJson(); const blob = new Blob([text],{type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='hisobim_export_'+Date.now()+'.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }
function exportCsv(transactionsList){ const lines = ['"id","type","amount","currency","category","date","note","createdAt"']; transactionsList.forEach(t=>{ const esc = (v)=> '"'+String(v||'').replace(/"/g,'""')+'"'; lines.push([esc(t.id),esc(t.type),esc(t.amount),esc(t.currency),esc(t.category),esc(t.date),esc(t.note),esc(t.createdAt)].join(',')); }); const blob = new Blob(["\uFEFF"+lines.join('\n')],{type:'text/csv;charset=utf-8;'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='hisobim_tx_'+Date.now()+'.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }
async function importJsonFile(file, state){ const text = await file.text(); const incoming = importJson(text); const nTx = incoming.transactions.length || 0; return {incoming, counts:{transactions:nTx}}; }
// improved import with validation and merge/replace
async function importJsonFile(file, currentState){ const text = await file.text(); const incoming = importJson(text); // may throw
	// basic schema validation
	const issues = [];
	if(!Array.isArray(incoming.transactions)) issues.push('transactions missing or not array');
	if(!incoming.categories || typeof incoming.categories !== 'object') issues.push('categories missing');
	if(!Array.isArray(incoming.budgets)) incoming.budgets = [];
	if(!Array.isArray(incoming.goals)) incoming.goals = [];
	// validate transaction entries minimally
	const cleanTx = [];
	(incoming.transactions||[]).forEach((t,i)=>{ try{ if(!t.id) throw new Error('id'); if(!t.type || !['income','expense'].includes(t.type)) throw new Error('type'); const amt = parseInt(t.amount,10); if(!Number.isFinite(amt)) throw new Error('amount'); if(!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(t.date)) throw new Error('date'); cleanTx.push(Object.assign({},t,{amount:amt})); }catch(e){ issues.push(`tx[${i}]: ${e.message}`); } });
	if(issues.length) throw new Error('Import xatolari: '+issues.slice(0,5).join('; '));
	// present merge vs replace choice to user via confirm (file:// simple UX)
	if(!confirm('Import: mavjud ma\'lumotlarni almashtirish (OK) yoki yangilash/qo\'shish (Bekor) ?\nOK = Replace, Cancel = Merge')) return {incoming:null, counts:{transactions:0}, action:'cancel'};
	// if user chose OK => replace
	const replace = true;
	if(replace){ // full replace
		saveAll(incoming);
		state = loadAll();
		renderAll(); renderBudgets(); renderGoals();
		return {incoming, counts:{transactions:cleanTx.length}, action:'replace'};
	} else {
		// merge (not currently used due to simple confirm flow)
		const merged = Object.assign({}, currentState);
		merged.transactions = merged.transactions.concat(cleanTx);
		merged.budgets = merged.budgets.concat(incoming.budgets||[]);
		merged.goals = merged.goals.concat(incoming.goals||[]);
		saveAll(merged);
		state = loadAll(); renderAll(); renderBudgets(); renderGoals();
		return {incoming, counts:{transactions:cleanTx.length}, action:'merge'};
	}
}

/* app.js */
let state = loadAll();
const els = {};
function qs(sel){return document.querySelector(sel)}
function safeGetCtx(sel){ const el = qs(sel); if(!el) return null; try{ return el.getContext && el.getContext('2d') || null;}catch(e){return null;} }
function init(){
	try{
		els.themeToggle = qs('#themeToggle');
		els.baseCurrency = qs('#baseCurrency');
		els.usdRate = qs('#usdRate');
		els.balances = qs('#balances');
		els.summaryIncome = qs('#summaryIncome');
		els.summaryExpense = qs('#summaryExpense');
		els.recentList = qs('#recentList');
		els.canvasMonths = safeGetCtx('#canvasMonths');
		els.canvasCat = safeGetCtx('#canvasCategories');

		const preferDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
		const userTheme = state.settings.theme ?? (preferDark? 'dark' : 'light');
		applyTheme(userTheme);
		if(els.themeToggle) els.themeToggle.checked = (userTheme==='dark');
		if(els.baseCurrency) els.baseCurrency.value = state.settings.baseCurrency || 'UZS';
		if(state.settings.usdRate && els.usdRate) els.usdRate.value = state.settings.usdRate;

		document.querySelectorAll('.sidebar button').forEach(b=>b.addEventListener('click', onNav));
		const demoBtn = qs('#demoLoad'); if(demoBtn) demoBtn.addEventListener('click', onDemoLoad);
		const clearBtn = qs('#clearAll'); if(clearBtn) clearBtn.addEventListener('click', onClearAll);
		if(els.themeToggle) els.themeToggle.addEventListener('change', ()=>{ const v = els.themeToggle.checked? 'dark':'light'; state.settings.theme=v; saveAll(state); applyTheme(v); });
		if(els.usdRate) els.usdRate.addEventListener('change', ()=>{ try{ setRate(state, els.usdRate.value); renderAll(); toast('Kurs saqlandi'); }catch(e){ toast(e.message,'danger'); }});

		const addBtn = qs('#addTx'); if(addBtn) addBtn.addEventListener('click', ()=>openTransactionModal());
		const addBudgetBtn = qs('#addBudget'); if(addBudgetBtn) addBudgetBtn.addEventListener('click', ()=> openBudgetModal());
		const addGoalBtn = qs('#addGoal'); if(addGoalBtn) addGoalBtn.addEventListener('click', ()=> openGoalModal());
		const expJson = qs('#exportJson'); if(expJson) expJson.addEventListener('click', ()=>exportJsonFile());
		const expCsv = qs('#exportCsv'); if(expCsv) expCsv.addEventListener('click', ()=>{ exportCsv(state.transactions); });
		const impFile = qs('#importFile'); if(impFile) impFile.addEventListener('change', async (e)=>{ if(!e.target.files.length) return; try{ const res = await importJsonFile(e.target.files[0], state); toast('Fayl yuklandi: '+res.counts.transactions+' tranzaksiya'); }catch(err){ toast(err.message,'danger'); } });

		renderAll();
		// render budgets and goals lists
		renderBudgets();
		renderGoals();
		// diagnostics
		const diag = qs('#diag');
		if(diag){
			const parts = [];
			parts.push('load OK');
			parts.push('storage size: '+getSizeBytes()+' bytes');
			parts.push('transactions: '+state.transactions.length);
			parts.push('canvasMonths: '+(els.canvasMonths? 'ok':'missing'));
			parts.push('canvasCategories: '+(els.canvasCat? 'ok':'missing'));
			diag.textContent = parts.join(' · ');
		}
	}catch(err){
		console.error('Init xatosi',err);
	}
}
function applyTheme(name){ if(name==='dark') document.documentElement.setAttribute('data-theme','dark'); else document.documentElement.removeAttribute('data-theme'); }


function onNav(e){ document.querySelectorAll('.sidebar button').forEach(b=>b.classList.remove('active')); e.currentTarget.classList.add('active'); const nav = e.currentTarget.dataset.nav; document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden')); qs('#view-'+nav).classList.remove('hidden'); if(nav==='budgets') renderBudgets(); if(nav==='goals') renderGoals(); }
function onDemoLoad(){ if(state.demoLoaded){ toast('Demo oldin yuklangan'); return; } if(!confirm('Demo ma\'lumotlarni yuklash tasdiqlaysizmi?')) return; const d = new Date(); const add = (t)=>{ try{ addTransaction(state,t);}catch(e){console.error(e)} }; add({type:'income',amount:1000000,currency:'UZS',category:'Ish haqi',date:formatDate(d)}); add({type:'income',amount:200,currency:'USD',category:'Freelance',date:formatDate(d)}); add({type:'expense',amount:200000,currency:'UZS',category:'Oziq-ovqat',date:formatDate(d)}); add({type:'expense',amount:50,currency:'USD',category:'Transport',date:formatDate(d)}); state.demoLoaded=true; saveAll(state); renderAll(); toast('Demo yuklandi'); }
function onClearAll(){ if(!confirm('Barcha ma\'lumotlarni o\'chirish — davom etilsinmi?')) return; if(!confirm('Bu amal qaytarilmaydi. Tasdiqlaysizmi?')) return; clearAll(); state = loadAll(); renderAll(); toast('Hammasi o\'chirildi'); }
function formatDate(d){ return d.toISOString().slice(0,10); }
function renderAll(){ state = loadAll(); renderBalances(); renderSummary(); renderRecent(); renderTransactionsList(); drawMonthsChart(els.canvasMonths, state.transactions, null); drawCategoriesChart(els.canvasCat, state.transactions, null); }
function renderBalances(){ const sums = sumsByCurrency(state.transactions); els.balances.innerHTML=''; ['UZS','USD'].forEach(c=>{ const div = document.createElement('div'); div.className='value'; div.innerHTML = `<div class="label">${c}</div><div class="amount">${formatAmount(sums[c]||0,c)}</div>`; els.balances.appendChild(div); }); }
function renderSummary(){ const incomes = state.transactions.filter(t=>t.type==='income'); const expenses = state.transactions.filter(t=>t.type==='expense'); const inc = incomes.reduce((s,t)=>s+t.amount,0); const exp = expenses.reduce((s,t)=>s+t.amount,0); els.summaryIncome.textContent = formatAmount(inc,'UZS') + ' / ' + formatAmount(inc,'USD'); els.summaryExpense.textContent = formatAmount(exp,'UZS') + ' / ' + formatAmount(exp,'USD'); }
function renderRecent(){ const list = state.transactions.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,6); els.recentList.innerHTML=''; list.forEach(t=>{ const div = document.createElement('div'); div.className='tx '+t.type; div.innerHTML = `<div class="left"><div><strong>${t.category||''}</strong><div class="meta">${t.date} • ${t.note||''}</div></div></div><div class="amount">${t.currency} ${t.amount}</div>`; els.recentList.appendChild(div); }); }
function renderTransactionsList(filters={}){ const container = qs('#transactionsContainer'); const list = filterTransactions(state,filters); container.innerHTML=''; if(list.length===0){ container.innerHTML='<p class="muted">Tranzaksiyalar yo‘q</p>'; return; } list.forEach(t=>{ const el = document.createElement('div'); el.className='tx '+t.type; el.innerHTML = `<div class="left"><div><strong>${t.category||''}</strong><div class="meta">${t.date} • ${t.note||''}</div></div></div><div><div class="amount">${t.currency} ${t.amount}</div><div class="actions"><button data-id="${t.id}" class="edit">Tahrirlash</button> <button data-id="${t.id}" class="del danger">O'chirish</button></div></div>`; container.appendChild(el); }); container.querySelectorAll('.edit').forEach(b=>b.addEventListener('click', (e)=> openTransactionModal(list.find(x=>x.id===e.target.dataset.id)))); container.querySelectorAll('.del').forEach(b=>b.addEventListener('click', (e)=>{ if(confirm('O\'chirishni tasdiqlaysizmi?')){ deleteTransaction(state,e.target.dataset.id); renderAll(); toast('O\'chirildi'); }})); }
function openTransactionModal(tx){ const modal = qs('#modal'); modal.classList.remove('hidden'); modal.innerHTML = ''; const dlg = document.createElement('div'); dlg.className='dialog'; const isEdit = !!tx; dlg.innerHTML = `<h3>${isEdit? 'Tranzaksiyani tahrirlash':'Yangi tranzaksiya'}</h3>     <form id="txForm">       <label>Tur<select name="type"><option value="income">Daromad</option><option value="expense">Xarajat</option></select></label>       <label>Summa<input name="amount" type="number" min="1" required></label>       <label>Valyuta<select name="currency"><option value="UZS">UZS</option><option value="USD">USD</option></select></label>       <label>Kategoriya<select name="category">${getCategoryOptions()}</select></label>       <label>Sana<input name="date" type="date" required></label>       <label>Izoh<input name="note" type="text"></label>       <div style="display:flex;gap:8px;margin-top:12px"><button type="submit">Saqlash</button><button type="button" id="cancel">Bekor qilish</button></div>     </form>`; modal.appendChild(dlg); const form = dlg.querySelector('#txForm'); if(isEdit){ form.type.value = tx.type; form.amount.value = tx.amount; form.currency.value = tx.currency; form.category.value = tx.category; form.date.value = tx.date; form.note.value = tx.note; } dlg.querySelector('#cancel').addEventListener('click', ()=>{ modal.classList.add('hidden'); modal.innerHTML=''; }); form.addEventListener('submit',(e)=>{ e.preventDefault(); const data = new FormData(form); const obj={type:data.get('type'), amount:data.get('amount'), currency:data.get('currency'), category:data.get('category'), date:data.get('date'), note:data.get('note')}; try{ if(isEdit) editTransaction(state, tx.id, obj); else addTransaction(state,obj); modal.classList.add('hidden'); modal.innerHTML=''; renderAll(); toast('Saqlandi'); }catch(err){ toast(err.message,'danger'); } }); }
function getCategoryOptions(){ const inc = state.categories.income.map(c=>`<option value="${c}">${c}</option>`).join(''); const exp = state.categories.expense.map(c=>`<option value="${c}">${c}</option>`).join(''); return inc+exp; }

/* Budgets & Goals */
function saveBudget(b){ b.id = b.id || 'b_'+Math.random().toString(36).slice(2,9); const idx = state.budgets.findIndex(x=>x.id===b.id); if(idx===-1) state.budgets.push(b); else state.budgets[idx]=b; saveAll(state); renderBudgets(); }
function deleteBudget(id){ const idx = state.budgets.findIndex(x=>x.id===id); if(idx!==-1) state.budgets.splice(idx,1); saveAll(state); renderBudgets(); }
function renderBudgets(){ const el = qs('#budgetsList'); if(!el) return; el.innerHTML=''; if(!state.budgets || state.budgets.length===0) { el.innerHTML='<p class="muted">Budjet yo\'q</p>'; return; } state.budgets.forEach(b=>{ const div = document.createElement('div'); div.className='budget-item'; const spent = state.transactions.filter(t=>t.type==='expense' && t.currency===b.currency && t.date.slice(0,7)===b.month).reduce((s,t)=>s+t.amount,0); const pct = Math.min(100, Math.round((spent / Math.max(1,b.amount))*100)); div.innerHTML = `<div><strong>${b.name}</strong><div class="muted">${b.month} • ${b.currency} ${b.amount}</div><div class="progress"><i style="width:${pct}%"></i></div></div><div><div class="muted">${b.currency} ${spent}</div><div style="margin-top:8px"><button data-id="${b.id}" class="editBudget">Tahrirlash</button> <button data-id="${b.id}" class="delBudget danger">O'chirish</button></div></div>`; el.appendChild(div); }); el.querySelectorAll('.editBudget').forEach(b=>b.addEventListener('click', (e)=> openBudgetModal(state.budgets.find(x=>x.id===e.target.dataset.id)))); el.querySelectorAll('.delBudget').forEach(b=>b.addEventListener('click', (e)=>{ if(confirm('Budjetni o\'chirishni tasdiqlaysizmi?')){ deleteBudget(e.target.dataset.id); toast('O\'chirildi'); }})); }

function openBudgetModal(b){ const modal = qs('#modal'); if(!modal) return; modal.classList.remove('hidden'); modal.innerHTML=''; const dlg = document.createElement('div'); dlg.className='dialog'; const isEdit = !!b; dlg.innerHTML = `<h3>${isEdit? 'Budjetni tahrirlash':'Yangi budjet'}</h3><form id="budgetForm"><label>Nomi<input name="name" required></label><label>Oy (YYYY-MM)<input name="month" type="month" required></label><label>Summa<input name="amount" type="number" min="1" required></label><label>Valyuta<select name="currency"><option value="UZS">UZS</option><option value="USD">USD</option></select></label><div style="display:flex;gap:8px;margin-top:12px"><button type="submit">Saqlash</button><button type="button" id="cancelBudget">Bekor</button></div></form>`; modal.appendChild(dlg); const form = dlg.querySelector('#budgetForm'); if(isEdit){ form.name.value=b.name; form.month.value=b.month; form.amount.value=b.amount; form.currency.value=b.currency; } dlg.querySelector('#cancelBudget').addEventListener('click', ()=>{ modal.classList.add('hidden'); modal.innerHTML=''; }); form.addEventListener('submit',(e)=>{ e.preventDefault(); const fd = new FormData(form); const obj = {id: b? b.id: undefined, name: fd.get('name'), month: fd.get('month'), amount: parseInt(fd.get('amount'),10), currency: fd.get('currency') }; try{ if(!obj.name || !obj.month || !obj.amount) throw new Error('Maydon to\'ldirilmagan'); saveBudget(obj); modal.classList.add('hidden'); modal.innerHTML=''; toast('Budjet saqlandi'); }catch(err){ toast(err.message,'danger'); } }); }
// close modal on Escape globally
window.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){ const m = qs('#modal'); if(m && !m.classList.contains('hidden')){ m.classList.add('hidden'); m.innerHTML=''; } } });

function renderGoals(){ const el = qs('#goalsList'); if(!el) return; el.innerHTML=''; if(!state.goals || state.goals.length===0){ el.innerHTML='<p class="muted">Jamg\'arma yo\'q</p>'; return; } state.goals.forEach(g=>{ const div = document.createElement('div'); div.className='goal-item'; const progress = Math.min(100, Math.round((g.saved / Math.max(1,g.target))*100)); div.innerHTML = `<div><strong>${g.name}</strong><div class="muted">${g.currency} ${g.target} • ${g.deadline||''}</div><div class="progress"><i style="width:${progress}%"></i></div></div><div><div class="muted">${g.currency} ${g.saved}</div><div style="margin-top:8px"><button data-id="${g.id}" class="addToGoal">Qo'shish</button> <button data-id="${g.id}" class="delGoal danger">O'chirish</button></div></div>`; el.appendChild(div); }); el.querySelectorAll('.addToGoal').forEach(b=>b.addEventListener('click', (e)=> openAddToGoalModal(state.goals.find(x=>x.id===e.target.dataset.id)))); el.querySelectorAll('.delGoal').forEach(b=>b.addEventListener('click', (e)=>{ if(confirm('Jamg\'armani o\'chirishni tasdiqlaysizmi?')){ const id = e.target.dataset.id; state.goals = state.goals.filter(x=>x.id!==id); saveAll(state); renderGoals(); toast('O\'chirildi'); }})); }

function openGoalModal(g){ const modal = qs('#modal'); if(!modal) return; modal.classList.remove('hidden'); modal.innerHTML=''; const dlg = document.createElement('div'); dlg.className='dialog'; const isEdit = !!g; dlg.innerHTML = `<h3>${isEdit? 'Jamg\'armani tahrirlash':'Yangi jamg\'arma'}</h3><form id="goalForm"><label>Nomi<input name="name" required></label><label>Ma\'qsad summa<input name="target" type="number" min="1" required></label><label>Valyuta<select name="currency"><option value="UZS">UZS</option><option value="USD">USD</option></select></label><label>Muddat<input name="deadline" type="date"></label><div style="display:flex;gap:8px;margin-top:12px"><button type="submit">Saqlash</button><button type="button" id="cancelGoal">Bekor</button></div></form>`; modal.appendChild(dlg); const form = dlg.querySelector('#goalForm'); if(isEdit){ form.name.value=g.name; form.target.value=g.target; form.currency.value=g.currency; form.deadline.value=g.deadline||''; } dlg.querySelector('#cancelGoal').addEventListener('click', ()=>{ modal.classList.add('hidden'); modal.innerHTML=''; }); form.addEventListener('submit',(e)=>{ e.preventDefault(); const fd = new FormData(form); const obj = {id: g? g.id: undefined, name: fd.get('name'), target: parseInt(fd.get('target'),10), currency: fd.get('currency'), deadline: fd.get('deadline') || null, saved: g? g.saved: 0 }; try{ if(!obj.name || !obj.target) throw new Error('Maydon to\'ldirilmagan'); obj.id = obj.id || 'g_'+Math.random().toString(36).slice(2,9); const idx = state.goals.findIndex(x=>x.id===obj.id); if(idx===-1) state.goals.push(obj); else state.goals[idx]=obj; saveAll(state); renderGoals(); modal.classList.add('hidden'); modal.innerHTML=''; toast('Jamg\'arma saqlandi'); }catch(err){ toast(err.message,'danger'); } }); }

function openAddToGoalModal(g){ const modal = qs('#modal'); if(!modal) return; modal.classList.remove('hidden'); modal.innerHTML=''; const dlg = document.createElement('div'); dlg.className='dialog'; dlg.innerHTML = `<h3>Jamg\'armaga qo'shish: ${g.name}</h3><form id="addGoalForm"><label>Summa<input name="amount" type="number" min="1" required></label><div style="display:flex;gap:8px;margin-top:12px"><button type="submit">Qo'shish</button><button type="button" id="cancelAddGoal">Bekor</button></div></form>`; modal.appendChild(dlg); dlg.querySelector('#cancelAddGoal').addEventListener('click', ()=>{ modal.classList.add('hidden'); modal.innerHTML=''; }); dlg.querySelector('#addGoalForm').addEventListener('submit',(e)=>{ e.preventDefault(); const fd = new FormData(e.target); const amt = parseInt(fd.get('amount'),10); if(!Number.isFinite(amt) || amt<=0){ toast('Noto\'g\'ri summa','danger'); return; } const idx = state.goals.findIndex(x=>x.id===g.id); if(idx!==-1){ state.goals[idx].saved = (state.goals[idx].saved||0) + amt; saveAll(state); renderGoals(); modal.classList.add('hidden'); modal.innerHTML=''; toast('Qo\'shildi'); } }); }
function toast(msg, type='ok'){ const t = document.createElement('div'); t.textContent=msg; t.style.position='fixed'; t.style.right='16px'; t.style.bottom='16px'; t.style.padding='10px 14px'; t.style.borderRadius='10px'; t.style.background= type==='danger'? 'var(--danger)': 'var(--accent)'; t.style.color='#fff'; document.body.appendChild(t); setTimeout(()=>t.remove(),3000); }
window.addEventListener('DOMContentLoaded', init);

// expose for console debugging
window.hisobim = {loadAll, saveAll, clearAll, exportJson, importJson, addTransaction, editTransaction, deleteTransaction, filterTransactions, sumsByCurrency, setRate, formatAmount, toBase, exportJsonFile, exportCsv, importJsonFile};
