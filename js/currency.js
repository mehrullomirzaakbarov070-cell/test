import storage from './storage.js';

export function setRate(state, rate){
  const r = Number(rate);
  if(!Number.isFinite(r) || r<=0) throw new Error('Kurs noto‘g‘ri');
  state.settings.usdRate = r;
  storage.saveAll(state);
}

export function formatAmount(amount, currency){
  const locale = 'uz-UZ';
  const opts = {style:'currency',currency:currency,maximumFractionDigits:0};
  try{
    return new Intl.NumberFormat(locale,opts).format(amount);
  }catch(e){
    return amount + ' ' + currency;
  }
}

export function toBase(amount, currency, baseCurrency, rate){
  if(baseCurrency===currency) return amount;
  if(!rate) return null;
  if(currency==='USD' && baseCurrency==='UZS') return Math.round(amount * rate);
  if(currency==='UZS' && baseCurrency==='USD') return Math.round(amount / rate);
  return null;
}

export default {setRate,formatAmount,toBase}