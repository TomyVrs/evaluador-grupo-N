import { FREEZE_V5 } from '/engine_v4.mjs';

export { FREEZE_V5 };

const STATE_KEY = 'evaluador-v5-local-state-v2';
const LOCAL_MAX_FILES = 120;
const LOCAL_MAX_FILE_CHARS = 50000;
const LOCAL_MAX_TOTAL_CHARS = 260000;
let usageRefreshQueued = false;

function storedItems(){try{return JSON.parse(localStorage.getItem(STATE_KEY)||'[]')}catch{return[]}}
function fmtInt(value){return Number(value||0).toLocaleString('es-AR')}
function fmtUsd(value){const n=Number(value);return Number.isFinite(n)?`USD ${n.toFixed(4)}`:'—'}

function ensureUsageKpi(){
  const kpis=document.querySelector('.kpis');
  if(!kpis||document.getElementById('k-api-calls'))return;
  const card=document.createElement('article');
  card.innerHTML='<label>Intentos IA</label><strong id="k-api-calls">0</strong><small id="k-api-tokens" style="display:block;margin-top:4px;color:#64748b;font-size:11px">Automático: Gemini 3.5 → 3.6 → Luna → Sol</small>';
  kpis.appendChild(card);
}

function updateAggregateUsage(){
  ensureUsageKpi();
  const usages=storedItems().map(x=>x.result?.uso_api).filter(Boolean);
  const total=usages.reduce((sum,u)=>sum+(Number(u.total_tokens)||0),0);
  const calls=usages.reduce((sum,u)=>sum+(Number(u.llamadas_modelo)||0),0);
  const cost=usages.reduce((sum,u)=>sum+(Number(u.costo_estimado_usd)||0),0);
  const callsEl=document.getElementById('k-api-calls');
  const tokenEl=document.getElementById('k-api-tokens');
  if(callsEl)callsEl.textContent=String(calls);
  if(tokenEl)tokenEl.textContent=usages.length?`${fmtInt(total)} tokens · ${fmtUsd(cost)} estimados`:'Automático: Gemini 3.5 → 3.6 → Luna → Sol';
}

function visibleUsage(){
  const detail=document.getElementById('detail');
  if(!detail)return null;
  const text=detail.textContent||'';
  const id=text.match(/SHA evaluado:\s*([0-9a-f]{7,40})/i)?.[1]||text.match(/Huella local:\s*(local-[0-9a-f]{16,64})/i)?.[1];
  if(!id)return null;
  return storedItems().find(x=>String(x.result?.repositorio?.commit_sha||'')===id||String(x.result?.repositorio?.commit_sha||'').startsWith(id))?.result?.uso_api||null;
}

function updateDetailUsage(){
  const detail=document.getElementById('detail');
  if(!detail)return;
  const usage=visibleUsage();
  const old=document.getElementById('usage-api-card');
  if(old){const h=old.previousElementSibling;if(h?.textContent==='Consumo de IA')h.remove();old.remove()}
  if(!usage)return;
  const route=Array.isArray(usage.ruta_modelos)&&usage.ruta_modelos.length
    ? `<br><b>Ruta:</b> ${usage.ruta_modelos.map(x=>`${x.model}${x.accepted?' ✓':` (${x.status})`}`).join(' → ')}`
    : '';
  const html=`<h3>Consumo de IA</h3><div class="feedback" id="usage-api-card"><b>${usage.proveedor||'Proveedor IA'} · ${usage.modelo_resuelto||usage.modelo||'Automático'}</b><br><b>Intentos de IA:</b> ${usage.llamadas_modelo||1}<br><b>Entrada:</b> ${fmtInt(usage.input_tokens)} tokens · <b>Salida:</b> ${fmtInt(usage.output_tokens)} tokens<br><b>Total:</b> ${fmtInt(usage.total_tokens)} tokens · <b>Costo estimado:</b> ${fmtUsd(usage.costo_estimado_usd)}${route}<br><span class="hint">${usage.nota||'Enrutamiento automático: Gemini 3.5 y 3.6 gratuitos primero; si no están disponibles, Luna y luego Sol.'}</span></div>`;
  detail.insertAdjacentHTML('beforeend',html);
}

function queueUsageRefresh(){
  if(usageRefreshQueued)return;
  usageRefreshQueued=true;
  setTimeout(()=>{usageRefreshQueued=false;updateAggregateUsage();updateDetailUsage()},0);
}

function simplifyLoader(){
  const source=document.querySelector('.github-source');
  if(source){
    const title=source.querySelector('h3');
    if(title)title.textContent='Repositorios GitHub';
    const desc=source.querySelector('p');
    if(desc)desc.textContent='Pegá uno o varios links de GitHub, uno por línea. La app detecta la rama, fija el SHA y evalúa automáticamente.';
    const textarea=document.getElementById('urls');
    if(textarea)textarea.placeholder='https://github.com/alumno1/trabajo-final\nhttps://github.com/alumno2/trabajo-final';
    const options=source.querySelector('.github-options');
    if(options)options.style.display='none';
    const add=document.getElementById('add');
    if(add)add.textContent='Agregar trabajos';
    source.querySelectorAll('#ai-profile').forEach(el=>el.closest('div')?.remove());
  }

  const locals=[...document.querySelectorAll('.local-source')];
  locals.forEach(el=>el.style.display='');
  const folder=locals.find(el=>el.querySelector('#folder-input'));
  if(folder){
    const title=folder.querySelector('h3');if(title)title.textContent='Carpeta local';
    const desc=folder.querySelector('p');if(desc)desc.textContent='Elegí una carpeta completa o arrastrala acá. Chrome y Edge permiten cargarla directamente.';
    const note=folder.querySelector('.privacy-note');if(note)note.textContent='La carpeta se lee en el navegador. Solo la evidencia textual necesaria se envía al evaluador; ningún archivo se ejecuta.';
  }
  const zip=locals.find(el=>el.querySelector('#zip-input'));
  if(zip){
    const title=zip.querySelector('h3');if(title)title.textContent='Archivo ZIP';
    const desc=zip.querySelector('p');if(desc)desc.textContent='Subí uno o varios ZIP con la entrega completa o arrastralos acá. También puede contener varios trabajos en subcarpetas.';
    const note=zip.querySelector('.privacy-note');if(note)note.textContent='El ZIP se descomprime en el navegador. Solo texto compatible se envía al evaluador; no se ejecutan archivos.';
  }
}

function setDropMessage(text,isError=false){
  const el=document.getElementById('load-message');
  if(!el)return;
  el.textContent=text||'';
  el.className='load-message'+(isError?' error':'');
}

function feedFilesToInput(input,files){
  if(!input||!files?.length)return false;
  if(typeof DataTransfer==='undefined')return false;
  const transfer=new DataTransfer();
  for(const file of files)transfer.items.add(file);
  input.files=transfer.files;
  input.dispatchEvent(new Event('change',{bubbles:true}));
  return true;
}

function readDirectoryBatch(reader){
  return new Promise((resolve,reject)=>reader.readEntries(resolve,reject));
}

async function readAllDirectoryEntries(reader){
  const entries=[];
  while(true){
    const batch=await readDirectoryBatch(reader);
    if(!batch.length)break;
    entries.push(...batch);
  }
  return entries;
}

function fileFromEntry(entry,relativePath){
  return new Promise((resolve,reject)=>{
    entry.file(file=>{
      try{
        const copy=new File([file],file.name,{type:file.type,lastModified:file.lastModified});
        Object.defineProperty(copy,'webkitRelativePath',{value:relativePath,configurable:true});
        resolve(copy);
      }catch(error){reject(error)}
    },reject);
  });
}

async function collectDroppedEntry(entry,prefix=''){
  if(!entry)return[];
  const path=prefix?`${prefix}/${entry.name}`:entry.name;
  if(entry.isFile)return[fileFromEntry(entry,path)].length?await Promise.all([fileFromEntry(entry,path)]):[];
  if(!entry.isDirectory)return[];
  const children=await readAllDirectoryEntries(entry.createReader());
  const nested=await Promise.all(children.map(child=>collectDroppedEntry(child,path)));
  return nested.flat();
}

function addDropHint(zone,text){
  if(!zone||zone.querySelector('.official-drop-hint'))return;
  const hint=document.createElement('div');
  hint.className='official-drop-hint';
  hint.textContent=text;
  zone.appendChild(hint);
}

function installLocalDropZones(){
  const folderInput=document.getElementById('folder-input');
  const zipInput=document.getElementById('zip-input');
  const folderZone=folderInput?.closest('.local-source');
  const zipZone=zipInput?.closest('.local-source');
  if(!folderZone&&!zipZone)return;

  if(!document.getElementById('official-drop-style')){
    const style=document.createElement('style');
    style.id='official-drop-style';
    style.textContent='.official-drop-zone{transition:outline-color .15s ease,background .15s ease;outline:2px dashed transparent;outline-offset:4px}.official-drop-zone.drag-over{outline-color:#2563eb;background:rgba(37,99,235,.05)}.official-drop-hint{margin-top:10px;padding:9px 11px;border:1px dashed #94a3b8;border-radius:10px;color:#64748b;font-size:12px;font-weight:600;text-align:center}.official-drop-zone.drag-over .official-drop-hint{border-color:#2563eb;color:#1d4ed8}';
    document.head.appendChild(style);
  }

  const prepareZone=zone=>{
    if(!zone||zone.dataset.dropReady==='1')return false;
    zone.dataset.dropReady='1';
    zone.classList.add('official-drop-zone');
    zone.addEventListener('dragenter',event=>{event.preventDefault();zone.classList.add('drag-over')});
    zone.addEventListener('dragover',event=>{event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect='copy';zone.classList.add('drag-over')});
    zone.addEventListener('dragleave',event=>{if(!zone.contains(event.relatedTarget))zone.classList.remove('drag-over')});
    return true;
  };

  if(prepareZone(zipZone)){
    addDropHint(zipZone,'Arrastrá uno o varios archivos ZIP acá');
    zipZone.addEventListener('drop',event=>{
      event.preventDefault();zipZone.classList.remove('drag-over');
      const zips=[...(event.dataTransfer?.files||[])].filter(file=>/\.zip$/i.test(file.name));
      if(!zips.length)return setDropMessage('Arrastrá uno o varios archivos .zip en esta sección.',true);
      if(!feedFilesToInput(zipInput,zips))setDropMessage('Este navegador no permite cargar archivos arrastrados. Usá Chrome o Edge actualizado.',true);
    });
  }

  if(prepareZone(folderZone)){
    addDropHint(folderZone,'Arrastrá una carpeta completa acá');
    folderZone.addEventListener('drop',async event=>{
      event.preventDefault();folderZone.classList.remove('drag-over');
      const entries=[...(event.dataTransfer?.items||[])].map(item=>item.webkitGetAsEntry?.()).filter(Boolean);
      const directory=entries.find(entry=>entry.isDirectory);
      if(!directory)return setDropMessage('Arrastrá una carpeta completa en esta sección. Para archivos sueltos usá ZIP.',true);
      try{
        setDropMessage('Leyendo carpeta arrastrada…');
        const files=await collectDroppedEntry(directory);
        if(!files.length)return setDropMessage('La carpeta arrastrada no contiene archivos legibles.',true);
        if(!feedFilesToInput(folderInput,files))setDropMessage('Este navegador no permite cargar carpetas arrastradas. Usá Chrome o Edge actualizado.',true);
      }catch(error){setDropMessage(error?.message||String(error),true)}
    });
  }
}

function enhanceOfficialUi(){
  const status=document.getElementById('engine-status');
  if(status){status.textContent='Agente IA V5 · Modo automático';status.className='pill ok'}
  const rate=document.getElementById('rate');
  if(rate){rate.textContent='Gemini 3.5 → 3.6 → Luna → Sol';rate.className='pill'}
  const side=document.querySelector('.side-note');
  if(side)side.innerHTML='<b>Agente Evaluador V5.</b><br>Pegá repositorios de GitHub o cargá ZIP/carpetas y ejecutá la corrección. La rúbrica V5 queda fija y el modelo se selecciona automáticamente.';
  const scope=document.querySelector('#engine-scope .hint');
  if(scope)scope.innerHTML='<b>La nota la calcula el agente IA V5 en modo automático.</b> Primero intenta Gemini 3.5 y Gemini 3.6, ambos validados en los casos de control; solo si no están disponibles escala a GPT-5.6 Luna y finalmente a GPT-5.6 Sol. En GitHub fija un SHA exacto; en archivos locales genera una huella SHA-256 del paquete evaluado.';
  const loaderHint=document.querySelector('#loader .section-head .hint');
  if(loaderHint)loaderHint.textContent='Pegá repositorios públicos de GitHub o cargá ZIP/carpetas. No hace falta elegir modelo ni cargar credenciales.';
  const footer=document.querySelector('footer');
  if(footer)footer.textContent='Agente IA V5 · Gemini 3.5 → 3.6 → Luna → Sol · GitHub, ZIP y carpetas · trazabilidad por SHA/huella.';
  simplifyLoader();
  installLocalDropZones();
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
  if(!response.ok)throw new Error(data?.error?.message||data?.error||`La evaluación falló (HTTP ${response.status}).`);
  setTimeout(queueUsageRefresh,0);
  return data;
}

function localRelevance(path){
  const p=String(path||'').toLowerCase();let score=0;
  if(/readme/.test(p))score+=100;if(/prompt|system_prompt|user_prompt/.test(p))score+=95;if(/decision|iteracion|version|cambio/.test(p))score+=90;
  if(/corrida|run|salida|output|entrada|input/.test(p))score+=85;if(/econom|costo|cost|token|precio|pricing/.test(p))score+=80;
  if(/gobierno|riesgo|risk|supervision|permiso|security/.test(p))score+=75;if(/tool|herramient|connector|integracion|integration/.test(p))score+=70;
  if(/\.(md|json|txt)$/i.test(p))score+=20;return score;
}

function prepareLocalFiles(files){
  const valid=(Array.isArray(files)?files:[]).filter(f=>f&&typeof f.path==='string'&&typeof f.content==='string')
    .sort((a,b)=>localRelevance(b.path)-localRelevance(a.path)||a.path.localeCompare(b.path)).slice(0,LOCAL_MAX_FILES);
  const out=[];let total=0;
  for(const file of valid){
    if(total>=LOCAL_MAX_TOTAL_CHARS)break;
    let content=file.content.slice(0,LOCAL_MAX_FILE_CHARS);
    if(total+content.length>LOCAL_MAX_TOTAL_CHARS)content=content.slice(0,LOCAL_MAX_TOTAL_CHARS-total);
    total+=content.length;out.push({path:file.path,size:Number(file.size||file.content.length),content});
  }
  return out;
}

async function callOfficialLocal(payload){
  const files=prepareLocalFiles(payload.files);
  if(!files.length)throw new Error('No se encontraron archivos de texto compatibles para evaluar.');
  const sourceKind=String(payload.url||'').startsWith('local://')?(payload.sourceKind||'zip'):'zip';
  const name=decodeURIComponent(String(payload.url||'local://Trabajo local').replace(/^local:\/\//,''))||'Trabajo local';
  const response=await fetch('/api/evaluate-local',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name,kind:sourceKind==='folder'?'folder':'zip',files}),
  });
  let data={};try{data=await response.json()}catch{}
  if(!response.ok)throw new Error(data?.error?.message||data?.error||`La evaluación local falló (HTTP ${response.status}).`);
  setTimeout(queueUsageRefresh,0);return data;
}

export async function evaluateEvidence(payload){
  if(String(payload?.url||'').startsWith('https://github.com/'))return callOfficialAgent(payload);
  if(String(payload?.url||'').startsWith('local://')&&Array.isArray(payload?.files))return callOfficialLocal(payload);
  throw new Error('Fuente no compatible. Usá un repositorio GitHub, un ZIP o una carpeta local.');
}

enhanceOfficialUi();