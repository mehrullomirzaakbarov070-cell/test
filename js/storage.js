const STORAGE_KEY = 'hisobim_v1';
const SCHEMA_VERSION = 1;

function safeParse(json){
  try{return JSON.parse(json)}catch(e){return null}
}

export function loadAll(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return getEmpty();
  const data = safeParse(raw);
  if(!data || data.schema !== SCHEMA_VERSION) return getEmpty();
  return data;
}

export function saveAll(state){
  try{
    const toSave = Object.assign({}, state, {schema:SCHEMA_VERSION});
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    return true;
  }catch(e){
    console.error('Saqlash xatosi',e);
    return false;
  }
}

export function clearAll(){
  localStorage.removeItem(STORAGE_KEY);
}

function getEmpty(){
  return {
    schema:SCHEMA_VERSION,
    settings:{
      theme: null,
      baseCurrency: 'UZS',
      usdRate: null
    },
    categories:{
      income:["Ish haqi","Freelance","Biznes","Sovg'a","Boshqa daromad"],
      expense:["Oziq-ovqat","Transport","Uy-joy","Kommunal","Sog'liq","Ta'lim","Ko'ngilochar","Xaridlar","Boshqa xarajat"]
    },
    transactions:[],
    budgets:[],
    goals:[],
    demoLoaded:false
  }
}

export function exportJson(){
  const data = loadAll();
  const payload = {meta:{generated: (new Date()).toISOString(), schema:SCHEMA_VERSION},data};
  return JSON.stringify(payload, null, 2);
}

export function importJson(raw){
  const parsed = safeParse(raw);
  if(!parsed || !parsed.data) throw new Error('Noto‘g‘ri fayl tuzilishi');
  // basic merge: keep existing if import invalid
  const incoming = parsed.data;
  if(incoming.schema !== SCHEMA_VERSION) throw new Error('Schema versiyasi mos emas');
  // validate shapes simply
  return incoming;
}

export function getSizeBytes(){
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw? new Blob([raw]).size:0;
}

export default {loadAll, saveAll, clearAll, exportJson, importJson}