import { evaluateEvidence as evaluateLocal, FREEZE_V5 } from '/engine_v4.mjs';

export { FREEZE_V5 };

const STATE_KEY = 'evaluador-v5-local-state-v2';
let usageRefreshQueued = false;

function storedItems(){try{return JSON.parse(localStorage.getItem(STATE_KEY)||'[]')}catch{return[]}}
function fmtInt(value){return Number(value||0).toLocaleString('es-AR')}

function ensureUsageKpi(){
  const kpis=document.querySelector('.kpis');
  if(!kpis||document.getElementById('k-api-calls'))return;
  const card=document.createElement('article');
  card.innerHTML='<label>Corridas IA</label><strong id="k-api-calls">0</strong><small id="k-api-tokens" style="display:block;margin-top:4px;color:#64748b;font-size:11px">1 llamada por trabajo</small>';
  kpis.appendChild(card);
}

function updateAggregateUsage(){
  ensureUsageKpi();
  const usages=storedItems().map(x=>x.result?.uso_api).filter(Boolean);
  const total=usages.reduce((sum,u)=>sum+(Number(u.total_tokens)||0),0);
  const calls=usages.reduce((sum,u)=>sum+(Number(u.llamadas_modelo)||0),0);
  const callsEl=document.getElementById('k-api-calls');
  const tokenEl=document.getElementById('k-api-tokens');
  if(callsEl)callsEl.textContent=String(calls);
  if(tokenEl)tokenEl.textContent=usages.length?`${fmtInt(total)} tokens · costo USD 0`:'1 llamada IA por trabajo';
}

function visibleUsage(){
  const detail=document.getElementById('detail');
  if(!detail)return null;
  const sha=(detail.textContent||'').match(/SHA evaluado:\s*([0-9a-f]{7,40})/i)?.[1];
  if(!sha)return null;
  return storedItems().find(x=>String(x.result?.repositorio?.commit_sha||'').startsWith(sha))?.result?.uso_api||null;
}

function updateDetailUsage(){
  const detail=document.getElementById('detail');
  if(!detail)return;
  const usage=visibleUsage();
  const old=document.getElementById('usage-api-card');
  if(old){const h=old.previousElementSibling;if(h?.textContent==='Consumo de IA')h.remove();old.remove()}
  if(!usage)return;
  const html=`<h3>Consumo de IA</h3><div class="feedback" id="usage-api-card"><b>${usage.proveedor||'Google Gemini'} · ${usage.modelo_resuelto||usage.modelo||'Gemini Flash'}</b><br><b>Llamadas de IA:</b> ${usage.llamadas_modelo||1}<br><b>Entrada:</b> ${fmtInt(usage.input_tokens)} tokens · <b>Salida:</b> ${fmtInt(usage.output_tokens)} tokens<br><b>Total:</b> ${fmtInt(usage.total_tokens)} tokens · <b>Costo:</b> USD 0<br><span class="hint">${usage.nota||'Una llamada de IA por trabajo.'}</span></div>`;
  detail.insertAdjacentHTML('beforeend',html);
}

function queueUsageRefresh(){
  if(usageRefreshQueued)return;
  usageRefreshQueued=true;
  setTimeout(()=>{usageRefreshQueued=false;updateAggregateUsage();updateDetailUsage()},0);
}

function simplifyLoader(){
  const source=document.querySelector('.github-source');
  if(!source)return;
  const title=source.querySelector('h3');
  if(title)title.textContent='Repositorios de Trabajos Finales';
  const desc=source.querySelector('p');
  if(desc)desc.textContent='Pegá uno o varios links de GitHub, uno por línea. La app detecta la rama, fija el SHA y evalúa el repositorio completo automáticamente.';
  const textarea=document.getElementById('urls');
  if(textarea)textarea.placeholder='https://github.com/alumno1/trabajo-final\nhttps://github.com/alumno2/trabajo-final';
  const options=source.querySelector('.github-options');
  if(options)options.style.display='none';
  const add=document.getElementById('add');
  if(add)add.textContent='Agregar trabajos';
  source.querySelectorAll('#ai-profile').forEach(el=>el.closest('div')?.remove());
}

function enhanceOfficialUi(){
  document.querySelectorAll('.local-source').forEach(el=>el.style.display='none');
  const status=document.getElementById('engine-status');
  if(status){status.textContent='Agente IA V5 · listo';status.className='pill ok'}
  const rate=document.getElementById('rate');
  if(rate){rate.textContent='GitHub · lectura server-side';rate.className='pill'}
  const side=document.querySelector('.side-note');
  if(side)side.innerHTML='<b>Agente Evaluador V5.</b><br>Pegá repositorios de Trabajos Finales y ejecutá la corrección. La rúbrica V5 queda fija y GitHub se usa solo en lectura.';
  const scope=document.querySelector('#engine-scope .hint');
  if(scope)scope.innerHTML='<b>La nota la calcula el agente IA V5.</b> El backend detecta la rama, resuelve un SHA exacto, inventaría y lee la evidencia relevante del repositorio, y envía un único paquete de evidencia al modelo. El servidor recalcula mecánicamente los puntajes de los 17 criterios.';
  const loaderHint=document.querySelector('#loader .section-head .hint');
  if(loaderHint)loaderHint.textContent='Pegá uno o varios repositorios públicos de GitHub. No hace falta indicar rama ni ruta para una entrega normal.';
  const footer=document.querySelector('footer');
  if(footer)footer.textContent='Agente IA V5 · GitHub solo lectura · SHA exacto · una llamada IA por trabajo · salida validada contra la rúbrica V5.';
  simplifyLoader();
  ensureUsageKpi();
  updateAggregateUsage();
  const detail=document.getElementById('detail');
  if(detail)new MutationObserver(queueUsageRefresh).observe(detail,{childList:true,subtree:true});
}

async function callOfficialAgent(payload){
  const response=await fetch('/api/evaluate-with-usage',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({url:payload.url,ref:payload.ref||null,root:payload.root||null}),
  });
  let data={};try{data=await response.json()}catch{}
  if(!response.ok)throw new Error(data.error||`La evaluación falló (HTTP ${response.status}).`);
  setTimeout(queueUsageRefresh,0);
  return data;
}

export async function evaluateEvidence(payload){
  if(String(payload?.url||'').startsWith('https://github.com/'))return callOfficialAgent(payload);
  return evaluateLocal(payload);
}

enhanceOfficialUi();
