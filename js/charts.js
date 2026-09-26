import {sumsByCurrency, filterTransactions} from './transactions.js';
import currency from './currency.js';

export function drawMonthsChart(ctx, transactions, currencyFilter){
  // simple bar chart rendering on canvas
  const dpr = window.devicePixelRatio || 1;
  const width = ctx.canvas.width; const height = ctx.canvas.height;
  ctx.canvas.width = width * dpr; ctx.canvas.height = height * dpr; ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,width,height);
  const months = {};
  transactions.forEach(t=>{ if(currencyFilter && t.currency!==currencyFilter) return; const m = t.date.slice(0,7); months[m] = months[m] || {income:0,expense:0}; months[m][t.type]+=t.amount; });
  const keys = Object.keys(months).sort();
  if(keys.length===0){ ctx.fillStyle='#666'; ctx.font='14px sans-serif'; ctx.fillText('Ma’lumot yo‘q',20,30); return; }
  const padding=40; const barW = (width - padding*2) / keys.length / 2;
  const max = Math.max(...keys.map(k=>months[k].income+months[k].expense));
  keys.forEach((k,i)=>{
    const x = padding + i*((barW*2)+10);
    const incomeH = (months[k].income / max) * (height - 80);
    const expenseH = (months[k].expense / max) * (height - 80);
    // income bar
    ctx.fillStyle = '#10b981'; ctx.fillRect(x, height - 30 - incomeH, barW, incomeH);
    // expense bar
    ctx.fillStyle = '#ef4444'; ctx.fillRect(x + barW, height - 30 - expenseH, barW, expenseH);
    // label
    ctx.fillStyle = '#333'; ctx.font='12px sans-serif'; ctx.fillText(k, x, height-8);
  });
}

export function drawCategoriesChart(ctx, transactions, currencyFilter){
  const dpr = window.devicePixelRatio || 1;
  const width = ctx.canvas.width; const height = ctx.canvas.height;
  ctx.canvas.width = width * dpr; ctx.canvas.height = height * dpr; ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,width,height);
  const map = {};
  transactions.forEach(t=>{ if(t.type!=='expense') return; if(currencyFilter && t.currency!==currencyFilter) return; const cat = t.category||'Boshqa'; map[cat]=(map[cat]||0)+t.amount; });
  const keys = Object.keys(map);
  if(keys.length===0){ ctx.fillStyle='#666'; ctx.font='14px sans-serif'; ctx.fillText('Ma’lumot yo‘q',20,30); return; }
  const total = keys.reduce((s,k)=>s+map[k],0);
  let start= -Math.PI/2;
  keys.forEach((k,i)=>{
    const slice = (map[k]/total)*(Math.PI*2);
    ctx.beginPath(); ctx.moveTo(width/2,height/2); ctx.arc(width/2,height/2, Math.min(width,height)/3, start, start+slice); ctx.closePath();
    const hue = (i*47)%360; ctx.fillStyle = `hsl(${hue} 70% 50%)`;
    ctx.fill();
    start += slice;
  });
}

export default {drawMonthsChart,drawCategoriesChart}