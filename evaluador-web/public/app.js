import { evaluateEvidence, FREEZE_V5 } from '/engine_v3.mjs';

const KEY='evaluador-v5-local-state-v2';
const localPayloads=new Map();
const CRITERION_NAMES={
  'SC-01':'Contrato: system prompt y user prompt con seis piezas','SC-02':'Herramienta/conector real y operable','SC-03':'Salida estructurada, estable y definida','SC-04':'Supervisión L0–L4, revisión, responsable y aprobación',
  'PD-01':'Iteraciones cronológicas y trazables','PD-02':'Fallas/resultados fallidos concretos','PD-03':'Decisiones vinculadas con fallas/evidencia',
  'FR-01':'Estructura mínima de entrega','FR-02':'Tres ejecuciones con entrada, salida y fecha','FR-03':'Reconstrucción de versión/ref, ruta, configuración y salida',
  'AE-01':'Costo por corrida con unidad, supuestos y fuente','AE-02':'Proyección con frecuencia, horizonte y cálculo reproducible','AE-03':'Elección justificada del modelo costo-eficiente',
  'GR-01':'Sistemas y permisos con mínimo privilegio','GR-02':'Riesgos específicos y controles','GR-03':'Contingencias operables','GR-04':'Supervisión, responsable y aprobación'
};
const DIMENSIONS={
  sistema_completo_funcionando:['Sistema completo y funcionando',30],
  proceso_documentado:['Proceso documentado',25],
  formato_reproducibilidad:['Formato y reproducibilidad',15],
  analisis_economico:['Análisis económico',15],
  gobierno_riesgo:['Gobierno y riesgo',15]
};

let items=load();
let selected=null;
const $=id=>document.getElementById(id);

function load(){
  try{
    return JSON.parse(localStorage.getItem(KEY)||'[]').map(item=>{
      if(item.target?.kind==='local'&&!item.result)return{...item,status:'needs_reload',error:'Volvé a seleccionar la carpeta o ZIP para ejecutar esta evaluación local.'};
      return item;
    });
  }catch{return[]}
}
function save(){localStorage.setItem(KEY,JSON.stringify(items));render()}
function uid(){return Math.random().toString(36).slice(2)+Date.now().toString(36)}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function decode(s){try{return decodeURIComponent(s)}catch{return s}}
function clean(s){return String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function setLoadMessage(text,isError=false){const el=$('load-message');el.textContent=text||'';el.className='load-message'+(isError?' error':'')}

function parseTarget(raw,defRef='main',defRoot='/'){
  const u=new URL(raw.trim());
  if(u.hostname!=='github.com')throw Error('La URL debe ser de github.com');
  const p=u.pathname.split('/').filter(Boolean);
  if(p.length<2)throw Error('URL de repositorio incompleta');
  const owner=p[0],repo=p[1].replace(/\.git$/,'');let ref=defRef,root=defRoot,name=repo;
  if(p[2]==='tree'||p[2]==='blob'){
    ref=decode(p[3]||defRef);const sub=p.slice(4).map(decode);root=sub.length?'/'+sub.join('/'):'/';if(sub.length)name=sub[sub.length-1];
  }
  return{kind:'github',sourceKind:'github',owner,repo,url:`https://github.com/${owner}/${repo}`,ref,root,name};
}
function headers(){
  const token=$('gh-token').value.trim();
  if(token)sessionStorage.setItem('gh-token',token);
  const t=token||sessionStorage.getItem('gh-token');
  return t?{Accept:'application/vnd.github+json',Authorization:`Bearer ${t}`,'X-GitHub-Api-Version':'2022-11-28'}:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
}
async function api(url){
  const r=await fetch(url,{headers:headers()});const rem=r.headers.get('x-ratelimit-remaining');
  if(rem!==null){$('rate').textContent=`GitHub: ${rem} requests restantes`;$('rate').className='pill'+(+rem<10?' warn':'')}
  if(!r.ok){let m='';try{m=(await r.json()).message}catch{}throw Error(`${r.status} ${m||r.statusText}`)}
  return r.json();
}
const textExt=/\.(md|txt|json|csv|yaml|yml|js|mjs|cjs|ts|tsx|jsx|py|html|css|xml|toml|ini|env\.example)$/i;
function shouldRead(path,size){return size<=120000&&(textExt.test(path)||/(readme|decisiones|prompt|requirements|dockerfile|makefile|package\.json)$/i.test(path))}
async function pool(tasks,limit=6){const out=[];let i=0;async function worker(){while(i<tasks.length){const n=i++;out[n]=await tasks[n]()}}await Promise.all(Array.from({length:Math.min(limit,tasks.length||1)},worker));return out}
function relative(path,root){if(!root)return path;return path===root?path.split('/').pop():path.slice(root.length+1)}

async function collectGitHub(target){
  const commit=await api(`https://api.github.com/repos/${target.owner}/${target.repo}/commits/${encodeURIComponent(target.ref)}`);const sha=commit.sha;
  const tree=await api(`https://api.github.com/repos/${target.owner}/${target.repo}/git/trees/${sha}?recursive=1`);
  if(tree.truncated)throw Error('El inventario GitHub llegó truncado; usá una ruta más específica o token autenticado.');
  const root=target.root.replace(/^\/+|\/+$/g,'');
  const entries=tree.tree.filter(x=>x.type==='blob'&&(!root||x.path===root||x.path.startsWith(root+'/')));
  if(!entries.length)return{noEvaluable:true,sha,reason:'La ruta raíz no existe o no contiene archivos.'};
  const selectedEntries=entries.filter(x=>shouldRead(x.path,x.size||0));
  const tasks=selectedEntries.map(e=>async()=>{
    const raw=`https://raw.githubusercontent.com/${target.owner}/${target.repo}/${sha}/${e.path.split('/').map(encodeURIComponent).join('/')}`;
    try{const r=await fetch(raw);if(!r.ok)return{path:relative(e.path,root),size:e.size,content:'',readError:`HTTP ${r.status}`};return{path:relative(e.path,root),size:e.size,content:await r.text()}}
    catch(err){return{path:relative(e.path,root),size:e.size,content:'',readError:String(err)}}
  });
  const files=await pool(tasks);const readErrors=files.filter(f=>f.readError);
  return{sha,files,entries,limitations:readErrors.length?[`${readErrors.length} archivo(s) de texto no pudieron leerse.`]:[]};
}

async function fingerprint(files){
  const payload=files.slice().sort((a,b)=>a.path.localeCompare(b.path)).map(f=>`${f.path}\u0000${f.content}`).join('\u0001');
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload));
  const hex=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
  return `local-${hex.slice(0,16)}`;
}
function normalizePath(path){
  const p=String(path||'').replaceAll('\\','/').replace(/^\/+/, '');
  if(!p||p.split('/').includes('..'))return null;
  return p;
}
function looksLikeWork(files){
  const paths=files.map(f=>clean(f.path));
  const markers=['readme.md','decisiones.md','system_prompt.md','user_prompt.md','prompts/system_prompt.md','prompts/user_prompt.md'];
  return markers.some(m=>paths.some(p=>p===m||p.endsWith('/'+m)));
}
function looksLikeRootWork(files){
  const paths=files.map(f=>clean(f.path));
  const markers=['readme.md','decisiones.md','system_prompt.md','user_prompt.md','prompts/system_prompt.md','prompts/user_prompt.md'];
  return markers.some(m=>paths.includes(m));
}
function splitPackage(baseName,files,sourceKind){
  const usable=files.filter(f=>f.path&&typeof f.content==='string');
  if(!usable.length)return[];
  const direct=usable.some(f=>!f.path.includes('/'));
  const top=[...new Set(usable.map(f=>f.path.split('/')[0]).filter(Boolean))];
  if(direct||top.length<=1||looksLikeRootWork(usable))return[{name:baseName,files:usable,sourceKind}];
  const groups=top.map(name=>({name,files:usable.filter(f=>f.path.startsWith(name+'/')).map(f=>({...f,path:f.path.slice(name.length+1)})),sourceKind})).filter(g=>g.files.length);
  const workGroups=groups.filter(g=>looksLikeWork(g.files));
  return workGroups.length>=2?workGroups:[{name:baseName,files:usable,sourceKind}];
}
async function addLocalPackage(baseName,files,sourceKind){
  const works=splitPackage(baseName,files,sourceKind);let added=0;
  for(const work of works){
    const fp=await fingerprint(work.files);const id=uid();
    const target={kind:'local',sourceKind,name:work.name,url:`local://${encodeURIComponent(work.name)}`,ref:'local',root:'/'};
    items.push({id,target,status:'pending',result:null,error:null});localPayloads.set(id,{files:work.files,fingerprint:fp});added++;
  }
  save();return added;
}

async function handleFolder(filesInput){
  const browserFiles=[...filesInput];if(!browserFiles.length)return;
  setLoadMessage('Leyendo carpeta local…');
  try{
    const first=(browserFiles[0].webkitRelativePath||browserFiles[0].name).split('/')[0]||'Trabajo local';
    const tasks=browserFiles.map(file=>async()=>{
      const raw=file.webkitRelativePath||file.name;const parts=raw.split('/');const path=normalizePath(parts.length>1?parts.slice(1).join('/'):parts[0]);
      if(!path||!shouldRead(path,file.size))return null;
      try{return{path,size:file.size,content:await file.text()}}catch{return null}
    });
    const read=(await pool(tasks)).filter(Boolean);const added=await addLocalPackage(first,read,'folder');
    setLoadMessage(`${added} trabajo(s) agregado(s) desde carpeta local.`);
  }catch(err){setLoadMessage(err.message||String(err),true)}
  finally{$('folder-input').value=''}
}

function findEocd(view){
  const min=Math.max(0,view.byteLength-65557);
  for(let i=view.byteLength-22;i>=min;i--)if(view.getUint32(i,true)===0x06054b50)return i;
  return-1;
}
async function inflateRaw(bytes){
  if(typeof DecompressionStream==='undefined')throw Error('Este navegador no permite descomprimir ZIP. Usá Chrome o Edge actualizado.');
  let ds;try{ds=new DecompressionStream('deflate-raw')}catch{throw Error('El navegador no soporta el formato de compresión ZIP requerido. Usá Chrome o Edge actualizado.')}
  const stream=new Blob([bytes]).stream().pipeThrough(ds);return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function extractZip(file){
  const bytes=new Uint8Array(await file.arrayBuffer());const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);const eocd=findEocd(view);
  if(eocd<0)throw Error(`${file.name}: ZIP inválido o no compatible.`);
  const total=view.getUint16(eocd+10,true),cdOffset=view.getUint32(eocd+16,true);
  if(total===0xffff||cdOffset===0xffffffff)throw Error(`${file.name}: ZIP64 no está soportado; usá una carpeta local o un ZIP estándar.`);
  const decoder=new TextDecoder('utf-8');const out=[];let p=cdOffset;
  for(let i=0;i<total;i++){
    if(p+46>view.byteLength||view.getUint32(p,true)!==0x02014b50)throw Error(`${file.name}: directorio ZIP inválido.`);
    const flags=view.getUint16(p+8,true),method=view.getUint16(p+10,true),compSize=view.getUint32(p+20,true),uncompSize=view.getUint32(p+24,true),nameLen=view.getUint16(p+28,true),extraLen=view.getUint16(p+30,true),commentLen=view.getUint16(p+32,true),localOffset=view.getUint32(p+42,true);
    const name=normalizePath(decoder.decode(bytes.slice(p+46,p+46+nameLen)));p+=46+nameLen+extraLen+commentLen;
    if(!name||name.endsWith('/')||!shouldRead(name,uncompSize))continue;
    if(flags&1)throw Error(`${file.name}: contiene archivos protegidos con contraseña, no soportados.`);
    if(localOffset+30>view.byteLength||view.getUint32(localOffset,true)!==0x04034b50)throw Error(`${file.name}: entrada ZIP inválida.`);
    const localNameLen=view.getUint16(localOffset+26,true),localExtraLen=view.getUint16(localOffset+28,true),start=localOffset+30+localNameLen+localExtraLen,end=start+compSize;
    if(end>bytes.length)throw Error(`${file.name}: datos ZIP incompletos.`);
    const compressed=bytes.slice(start,end);let plain;
    if(method===0)plain=compressed;else if(method===8)plain=await inflateRaw(compressed);else continue;
    out.push({path:name,size:uncompSize,content:decoder.decode(plain)});
  }
  const roots=[...new Set(out.map(f=>f.path.split('/')[0]))];
  if(roots.length===1&&out.every(f=>f.path.includes('/'))){const r=roots[0]+'/';return out.map(f=>({...f,path:f.path.slice(r.length)})).filter(f=>f.path)}
  return out;
}
async function handleZips(fileList){
  const zips=[...fileList];if(!zips.length)return;
  let totalAdded=0;setLoadMessage(`Leyendo ${zips.length} ZIP…`);
  try{
    for(const zip of zips){const files=await extractZip(zip);totalAdded+=await addLocalPackage(zip.name.replace(/\.zip$/i,''),files,'zip')}
    setLoadMessage(`${totalAdded} trabajo(s) agregado(s) desde ${zips.length} ZIP.`);
  }catch(err){setLoadMessage(err.message||String(err),true)}
  finally{$('zip-input').value=''}
}

function addGitHub(){
  const raw=$('urls').value.trim();if(!raw)return setLoadMessage('Pegá al menos una URL de GitHub.',true);
  let ok=0,bad=0;
  for(const line of raw.split(/\n+/).map(x=>x.trim()).filter(Boolean)){
    try{const t=parseTarget(line,$('default-ref').value||'main',$('default-root').value||'/');if(items.some(x=>x.target.kind==='github'&&x.target.url===t.url&&x.target.ref===t.ref&&x.target.root===t.root))continue;items.push({id:uid(),target:t,status:'pending',result:null,error:null});ok++}catch{bad++}
  }
  $('urls').value='';save();setLoadMessage(`Agregados ${ok} repositorio(s)${bad?`; URLs inválidas: ${bad}`:''}.`,bad>0&&ok===0);
}
function noEvaluable(target,sha,reason){return{estado_evaluacion:'NO_EVALUABLE',repositorio:{url:target.url,ref_solicitada:target.ref,ref_evaluada:target.ref,commit_sha:sha||null,ruta_raiz:target.root,fecha_evaluacion:new Date().toISOString().slice(0,10),inventario_completo:false,archivos_revisados:[],limitaciones:[reason]},rubrica_version:'v5',motor_ejecutable:{tipo:'deterministico-local',freeze_referencia:FREEZE_V5},inconsistencias:[],alertas_manipulacion:[],puntaje_total:null,validacion:{sha_anclado:Boolean(sha),inventario_verificado:false,criterios_completos:false,puntajes_permitidos:false,sumas_verificadas:false,niveles_verificados:false,evidencia_verificada:false,formato_valido:true},resumen_final:reason}}
async function evaluateItem(item){
  const t=item.target;
  if(t.kind==='local'){
    const payload=localPayloads.get(item.id);if(!payload)throw Error('Volvé a seleccionar la carpeta o ZIP local para poder evaluarlo.');
    return evaluateEvidence({url:t.url,ref:'local',sha:payload.fingerprint,root:'/',date:new Date().toISOString().slice(0,10),files:payload.files,inventoryComplete:true,limitations:[]});
  }
  try{const c=await collectGitHub(t);if(c.noEvaluable)return noEvaluable(t,c.sha,c.reason);return evaluateEvidence({url:t.url,ref:t.ref,sha:c.sha,root:t.root,date:new Date().toISOString().slice(0,10),files:c.files,inventoryComplete:true,limitations:c.limitations})}
  catch(err){if(/404/.test(err.message))return noEvaluable(t,null,'Repositorio, referencia o ruta no resoluble.');throw err}
}
async function run(){
  const jobs=items.filter(x=>['pending','error'].includes(x.status));if(!jobs.length)return setLoadMessage('No hay trabajos pendientes para ejecutar.',true);
  for(const item of jobs){
    item.status='running';item.error=null;save();
    try{item.result=await evaluateItem(item);item.status=item.result.estado_evaluacion==='NO_EVALUABLE'?'no_evaluable':'done'}
    catch(err){item.status=item.target.kind==='local'&&!localPayloads.has(item.id)?'needs_reload':'error';item.error=err.message||String(err)}
    save();if(selected===item.id)renderDetail(item);
  }
}
function sourceLabel(t){return t.kind==='github'?'GitHub':t.sourceKind==='zip'?'ZIP':'Carpeta'}
function sourceSubline(t){return t.kind==='github'?`${t.owner}/${t.repo}`:'Archivo local'}
function status(s){const label={pending:'Pendiente',running:'Procesando',done:'Completo',error:'Error',no_evaluable:'No evaluable',needs_reload:'Recargar archivo'}[s]||s;return`<span class="status ${s}">${label}</span>`}
function render(){
  const q=clean($('search')?.value||'');const rows=items.filter(x=>clean(x.target.name+' '+x.target.url+' '+sourceLabel(x.target)).includes(q));
  $('tbody').innerHTML=rows.length?rows.map(x=>`<tr data-id="${x.id}"><td><b>${esc(x.target.name)}</b><div class="subline">${esc(x.target.kind==='github'?`${x.target.ref} · ${x.target.root}`:'Fuente local')}</div></td><td><span class="source-badge">${sourceLabel(x.target)}</span><div class="subline">${esc(sourceSubline(x.target))}</div></td><td>${status(x.status)}</td><td class="num">${x.result?.puntaje_total==null?'—':`<b>${x.result.puntaje_total}</b>/100`}</td><td><button class="remove" data-remove="${x.id}">Quitar</button></td></tr>`).join(''):'<tr><td colspan="5" class="hint" style="text-align:center;padding:28px">No hay trabajos cargados.</td></tr>';
  $('tbody').querySelectorAll('tr[data-id]').forEach(tr=>tr.onclick=e=>{if(e.target.dataset.remove)return;selected=tr.dataset.id;renderDetail(items.find(x=>x.id===selected))});
  $('tbody').querySelectorAll('[data-remove]').forEach(b=>b.onclick=e=>{e.stopPropagation();localPayloads.delete(b.dataset.remove);items=items.filter(x=>x.id!==b.dataset.remove);if(selected===b.dataset.remove){selected=null;renderDetail(null)}save()});
  const done=items.filter(x=>x.status==='done'&&x.result?.puntaje_total!=null);$('k-total').textContent=items.length;$('k-done').textContent=done.length;$('k-running').textContent=items.filter(x=>x.status==='running').length;$('k-error').textContent=items.filter(x=>['error','no_evaluable','needs_reload'].includes(x.status)).length;$('k-avg').textContent=done.length?Math.round(done.reduce((a,x)=>a+x.result.puntaje_total,0)/done.length):'—';
}
function renderDetail(item){
  if(!item){$('detail').innerHTML='<div class="empty"><div><b>Seleccioná una evaluación</b><p>Acá vas a ver la nota, el desglose por dimensión, cada criterio, evidencia, feedback e inconsistencias.</p></div></div>';return}
  if(!item.result){$('detail').innerHTML=`<h2>${esc(item.target.name)}</h2>${status(item.status)}<div class="empty"><div><b>Sin resultado</b><p>${esc(item.error||'Ejecutá las evaluaciones para procesar este trabajo.')}</p></div></div>`;return}
  const r=item.result;if(!r.evaluacion){$('detail').innerHTML=`<h2>${esc(item.target.name)}</h2>${status(item.status)}<h3>NO EVALUABLE</h3><div class="feedback">${esc(r.resumen_final)}</div>`;return}
  const idLabel=item.target.kind==='github'?'SHA evaluado':'Huella local';
  let html=`<div class="score-row"><div><span class="section-kicker">Resultado</span><h2>${esc(item.target.name)}</h2><div class="score">${r.puntaje_total}<span class="hint">/100</span></div></div><div class="score-meta"><span class="source-badge">${sourceLabel(item.target)}</span><br>${idLabel}: ${esc(r.repositorio.commit_sha)}</div></div>`;
  for(const[k,d]of Object.entries(r.evaluacion)){const[name,max]=DIMENSIONS[k];html+=`<div class="dim"><div class="dimhead"><span>${name}</span><b>${d.puntaje}/${max}</b></div><div class="bar"><span style="width:${Math.round(d.puntaje/max*100)}%"></span></div></div>`}
  html+=`<h3>Resumen</h3><div class="feedback">${esc(r.resumen_final)}</div><h3>Feedback por dimensión</h3>`;
  for(const[k,d]of Object.entries(r.evaluacion)){const[name]=DIMENSIONS[k];html+=`<div class="feedback"><b>${esc(name)}</b><br>${esc(d.justificacion||'')} ${d.mejora_concreta?`<br><b>Mejora:</b> ${esc(d.mejora_concreta)}`:''}</div>`}
  html+='<h3>Criterios y evidencia</h3>';
  for(const d of Object.values(r.evaluacion))for(const c of d.criterios)html+=`<div class="crit"><div class="crithead"><b>${c.id} · ${esc(CRITERION_NAMES[c.id]||'')} · ${c.estado}</b><b>${c.puntos}</b></div><div class="evidence">${c.evidencia.map(e=>`${esc(e.ruta)} — ${esc(e.detalle)}`).join('<br>')||'Sin evidencia positiva.'}</div></div>`;
  if(r.inconsistencias.length)html+=`<h3>Inconsistencias</h3><div class="feedback">${r.inconsistencias.map(x=>`• ${esc(x.afirmacion)} ${esc(x.evidencia_contraria)}`).join('<br>')}</div>`;
  if(r.alertas_manipulacion.length)html+=`<h3>Alertas de manipulación</h3><div class="feedback">${r.alertas_manipulacion.map(x=>`• ${esc(x)}`).join('<br>')}</div>`;
  $('detail').innerHTML=html;
}
function exportJSON(){const data=items.filter(x=>x.result).map(x=>({trabajo:x.target.name,fuente:sourceLabel(x.target),...x.result}));download('evaluaciones_v5.json',JSON.stringify(data,null,2),'application/json')}
function exportCSV(){
  const rows=[['trabajo','fuente','origen','ref','ruta','estado','puntaje','sistema','proceso','formato','economico','gobierno']];
  for(const x of items){const e=x.result?.evaluacion||{};rows.push([x.target.name,sourceLabel(x.target),x.target.url,x.target.ref,x.target.root,x.status,x.result?.puntaje_total??'',e.sistema_completo_funcionando?.puntaje??'',e.proceso_documentado?.puntaje??'',e.formato_reproducibilidad?.puntaje??'',e.analisis_economico?.puntaje??'',e.gobierno_riesgo?.puntaje??''])}
  download('evaluaciones_v5.csv',rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n'),'text/csv');
}
function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

$('add').onclick=addGitHub;$('run').onclick=run;$('clear').onclick=()=>{if(confirm('¿Borrar cola y resultados locales?')){items=[];selected=null;localPayloads.clear();save();renderDetail(null);setLoadMessage('')}};$('search').oninput=render;$('folder-input').onchange=e=>handleFolder(e.target.files);$('zip-input').onchange=e=>handleZips(e.target.files);$('export-csv').onclick=exportCSV;$('export-json').onclick=exportJSON;
document.querySelectorAll('[data-scroll]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.scroll)?.scrollIntoView({behavior:'smooth',block:'start'}));
const tok=sessionStorage.getItem('gh-token');if(tok)$('gh-token').value=tok;render();if(items[0]){selected=items[0].id;renderDetail(items[0])}
