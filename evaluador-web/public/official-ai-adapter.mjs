import { evaluateEvidence as evaluateLocal, FREEZE_V5 } from '/engine_v4.mjs';

export { FREEZE_V5 };

const CODE_KEY = 'evaluador-v5-access-code';
const STATE_KEY = 'evaluador-v5-local-state-v2';
const PROFILE_KEY = 'evaluador-v5-ai-profile';
let askingCode = null;
let usageRefreshQueued = false;

const PROFILE_LABELS = {
  sol: 'Sol · referencia de máxima calidad',
  luna: 'Luna · económico',
  free: 'Dots3-Note · gratis experimental',
};

function fmtInt(value){return Number(value||0).toLocaleString('es-AR')}
function fmtUsd(value){return value==null?'—':`USD ${Number(value).toFixed(4)}`}
function storedItems(){try{return JSON.parse(localStorage.getItem(STATE_KEY)||'[]')}catch{return[]}}
function selectedProfile(){return localStorage.getItem(PROFILE_KEY)||'sol'}

function ensureUsageKpi(){
  const kpis=document.querySelector('.kpis');
  if(!kpis||document.getElementById('k-api-cost'))return;
  const card=document.createElement('article');
  card.innerHTML='<label>Costo API acumulado</label><strong id="k-api-cost">—</strong><small id="k-api-tokens" style="display:block;margin-top:4px;color:#64748b;font-size:11px">Sin corridas IA</small>';
  kpis.appendChild(card);
}

function updateAggregateUsage(){
  ensureUsageKpi();
  const usages=storedItems().map(x=>x.result?.uso_api).filter(Boolean);
  const cost=usages.reduce((s,u)=>s+(Number(u.costo_estimado_usd)||0),0);
  const total=usages.reduce((s,u)=>s+(Number(u.total_tokens)||0),0);
  const costEl=document.getElementById('k-api-cost');
  const tokenEl=document.getElementById('k-api-tokens');
  if(costEl)costEl.textContent=usages.length?`USD ${cost.toFixed(4)}`:'—';
  if(tokenEl)tokenEl.textContent=usages.length?`${fmtInt(total)} tokens · ${usages.length} corrida(s)`:'Sin corridas IA';
}

function visibleUsage(){
  const detail=document.getElementById('detail');
  if(!detail)return null;
  const text=detail.textContent||'';
  const sha=text.match(/SHA evaluado:\s*([0-9a-f]{7,40})/i)?.[1];
  if(!sha)return null;
  return storedItems().find(x=>String(x.result?.repositorio?.commit_sha||'').startsWith(sha))?.result?.uso_api||null;
}

function updateDetailUsage(){
  const detail=document.getElementById('detail');
  if(!detail)return;
  const usage=visibleUsage();
  const old=document.getElementById('usage-api-card');
  if(!usage){if(old)old.remove();return}
  const cachedPct=usage.input_tokens?Math.round((Number(usage.cached_input_tokens||0)/Number(usage.input_tokens))*100):0;
  const html=`<h3>Consumo de IA</h3><div class="feedback" id="usage-api-card"><b>${usage.proveedor||'Proveedor'} · ${usage.modelo||'Modelo IA'}</b><br><b>Perfil:</b> ${usage.perfil||'—'} · <b>llamadas:</b> ${usage.llamadas_modelo||0}<br><b>Entrada:</b> ${fmtInt(usage.input_tokens)} tokens · <b>cacheados:</b> ${fmtInt(usage.cached_input_tokens)} (${cachedPct}%)<br><b>Salida:</b> ${fmtInt(usage.output_tokens)} tokens · <b>razonamiento:</b> ${fmtInt(usage.reasoning_tokens)}<br><b>Total informado:</b> ${fmtInt(usage.total_tokens)} tokens<br><b>Costo estimado:</b> ${fmtUsd(usage.costo_estimado_usd)}<br><span class="hint">${usage.nota||'Estimación calculada con el usage informado por el proveedor.'}</span></div>`;
  if(old){
    const heading=old.previousElementSibling;
    if(heading?.textContent==='Consumo de IA')heading.remove();
    old.remove();
  }
  detail.insertAdjacentHTML('beforeend',html);
}

function queueUsageRefresh(){
  if(usageRefreshQueued)return;
  usageRefreshQueued=true;
  setTimeout(()=>{usageRefreshQueued=false;updateAggregateUsage();updateDetailUsage()},0);
}

function updateProfileStatus(){
  const profile=selectedProfile();
  const status=document.getElementById('engine-status');
  if(status){status.textContent=`Agente IA V5 · ${PROFILE_LABELS[profile]||profile}`;status.className='pill ok'}
}

function ensureProfileSelector(){
  if(document.getElementById('ai-profile'))return;
  const source=document.querySelector('.github-source');
  if(!source)return;
  const box=document.createElement('div');
  box.style.cssText='margin:12px 0;padding:12px;border:1px solid #dbe3ee;border-radius:10px;background:#f8fafc';
  box.innerHTML='<label for="ai-profile" style="display:block;font-size:12px;font-weight:700;margin-bottom:6px">Perfil de modelo para esta tanda</label><select id="ai-profile" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;background:white"><option value="sol">Sol — referencia / máxima calidad</option><option value="luna">Luna — económico</option><option value="free">Dots3-Note — gratis experimental</option></select><small id="ai-profile-note" style="display:block;margin-top:6px;color:#64748b;line-height:1.35"></small>';
  const button=source.querySelector('#add');
  source.insertBefore(box,button);
  const select=box.querySelector('#ai-profile');
  select.value=selectedProfile();
  const note=box.querySelector('#ai-profile-note');
  const refresh=()=>{
    const value=select.value;
    localStorage.setItem(PROFILE_KEY,value);
    note.textContent=value==='sol'?'Perfil de referencia para validar la nota final.':value==='luna'?'Misma norma V5 con un modelo mucho más económico; se calibra contra Sol.':'Costo de inferencia USD 0 en el modelo free de OpenRouter; experimental hasta completar la calibración contra Sol.';
    updateProfileStatus();
  };
  select.addEventListener('change',refresh);
  refresh();
}

function enhanceOfficialUi(){
  const rate=document.getElementById('rate');
  if(rate){rate.textContent='GitHub: lectura server-side';rate.className='pill'}
  const side=document.querySelector('.side-note');
  if(side)side.innerHTML='<b>Evaluador oficial V5.</b><br>Las evaluaciones de repositorios GitHub ejecutan el agente IA normativo, anclado a SHA y con herramientas de solo lectura.';
  const scope=document.querySelector('#engine-scope .hint');
  if(scope)scope.innerHTML='<b>La nota mostrada para repositorios GitHub la calcula el agente IA V5 real.</b> El backend resuelve la referencia a un SHA exacto, inventaría el alcance y permite al modelo leer archivos e historial mediante herramientas GitHub de solo lectura. La rúbrica, configuración y contrato se cargan desde el freeze normativo V5. La interfaz registra además tokens y costo estimado de cada corrida.';
  const footer=document.querySelector('footer');
  if(footer)footer.textContent='Agente IA V5 oficial · evidencia GitHub anclada a SHA · herramientas de solo lectura · consumo API visible · salida validada contra la rúbrica V5.';
  document.querySelectorAll('.local-source').forEach(el=>el.style.display='none');
  const loaderHint=document.querySelector('#loader .section-head .hint');
  if(loaderHint)loaderHint.textContent='Pegá uno o varios repositorios públicos de GitHub. Podés comparar Sol, Luna y un perfil gratuito manteniendo exactamente la misma rúbrica V5.';
  const token=document.getElementById('gh-token');
  if(token)token.style.display='none';
  ensureUsageKpi();
  ensureProfileSelector();
  updateProfileStatus();
  updateAggregateUsage();
  const detail=document.getElementById('detail');
  if(detail)new MutationObserver(queueUsageRefresh).observe(detail,{childList:true,subtree:true});
}

function accessCodeModal(){
  const saved=sessionStorage.getItem(CODE_KEY);
  if(saved)return Promise.resolve(saved);
  if(askingCode)return askingCode;
  askingCode=new Promise((resolve,reject)=>{
    const overlay=document.createElement('div');
    overlay.style.cssText='position:fixed;inset:0;background:rgba(15,23,42,.72);display:grid;place-items:center;z-index:9999;padding:20px';
    const card=document.createElement('div');
    card.style.cssText='width:min(440px,100%);background:white;color:#111827;border-radius:16px;padding:24px;box-shadow:0 24px 70px rgba(0,0,0,.3)';
    card.innerHTML='<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b">Evaluador oficial V5</div><h2 style="margin:8px 0 8px">Código de evaluación</h2><p style="margin:0 0 16px;color:#475569;line-height:1.45">Ingresá el código provisto para habilitar una corrida del agente IA. El código se guarda solo durante esta sesión del navegador.</p><input id="official-code-input" type="password" autocomplete="off" placeholder="Código" style="box-sizing:border-box;width:100%;padding:12px 14px;border:1px solid #cbd5e1;border-radius:10px;font-size:16px"><div id="official-code-error" style="min-height:18px;margin-top:8px;color:#b91c1c;font-size:13px"></div><div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px"><button id="official-code-cancel" style="padding:10px 14px;border:1px solid #cbd5e1;border-radius:9px;background:white">Cancelar</button><button id="official-code-ok" style="padding:10px 14px;border:0;border-radius:9px;background:#111827;color:white;font-weight:700">Continuar</button></div>';
    overlay.appendChild(card);document.body.appendChild(overlay);
    const input=card.querySelector('#official-code-input');
    const done=()=>{const code=input.value.trim();if(!code){card.querySelector('#official-code-error').textContent='Ingresá el código de evaluación.';return}sessionStorage.setItem(CODE_KEY,code);overlay.remove();askingCode=null;resolve(code)};
    card.querySelector('#official-code-ok').addEventListener('click',done);
    card.querySelector('#official-code-cancel').addEventListener('click',()=>{overlay.remove();askingCode=null;reject(new Error('Evaluación cancelada.'))});
    input.addEventListener('keydown',e=>{if(e.key==='Enter')done()});
    setTimeout(()=>input.focus(),0);
  });
  return askingCode;
}

async function callOfficialAgent(payload,retry=true){
  const code=await accessCodeModal();
  const response=await fetch('/api/evaluate-with-usage',{
    method:'POST',
    headers:{'Content-Type':'application/json','X-Evaluator-Code':code},
    body:JSON.stringify({url:payload.url,ref:payload.ref||'main',root:payload.root||'/',ai_profile:selectedProfile()}),
  });
  let data={};try{data=await response.json()}catch{}
  if(response.status===401&&retry){sessionStorage.removeItem(CODE_KEY);return callOfficialAgent(payload,false)}
  if(!response.ok)throw new Error(data.error||`La evaluación oficial falló (HTTP ${response.status}).`);
  setTimeout(queueUsageRefresh,0);
  return data;
}

export async function evaluateEvidence(payload){
  if(String(payload?.url||'').startsWith('https://github.com/'))return callOfficialAgent(payload);
  return evaluateLocal(payload);
}

enhanceOfficialUi();
