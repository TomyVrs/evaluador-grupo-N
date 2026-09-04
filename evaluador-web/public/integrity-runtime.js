import {buildIntegrityProfile,buildIntegrityReport} from '/integrity.mjs';

const KEY='evaluador-v5-local-state-v2';
const githubFiles=new Map();
const githubProfiles=new Map();
const localProfiles=new Map();
let selectedId=null;
let scheduled=false;

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const clean=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const textExt=/\.(md|txt|json|csv|yaml|yml|js|mjs|cjs|ts|tsx|jsx|py|html|css|xml|toml|ini|env\.example)$/i;
const shouldRead=(path,size)=>size<=120000&&(textExt.test(path)||/(readme|decisiones|prompt|requirements|dockerfile|makefile|package\.json)$/i.test(path));

function loadItems(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance()})}

function githubKey(owner,repo,sha){return`${owner}/${repo}/${sha}`}
function captureGithub(url,response){
  try{
    const u=new URL(String(url));if(u.hostname!=='raw.githubusercontent.com')return;
    const p=u.pathname.split('/').filter(Boolean);if(p.length<4)return;
    const [owner,repo,sha,...rest]=p;const path=rest.map(x=>{try{return decodeURIComponent(x)}catch{return x}}).join('/');
    response.clone().text().then(content=>{
      const key=githubKey(owner,repo,sha);const map=githubFiles.get(key)||new Map();map.set(path,{path,size:content.length,content});githubFiles.set(key,map);
      githubProfiles.set(key,buildIntegrityProfile([...map.values()]));schedule();
    }).catch(()=>{});
  }catch{}
}
const nativeFetch=window.fetch.bind(window);
window.fetch=async(input,init)=>{const response=await nativeFetch(input,init);captureGithub(typeof input==='string'?input:input?.url,response);return response};

function normalizePath(path){const p=String(path||'').replaceAll('\\','/').replace(/^\/+/, '');if(!p||p.split('/').includes('..'))return null;return p}
function looksLikeWork(files){const paths=files.map(f=>clean(f.path));const markers=['readme.md','decisiones.md','system_prompt.md','user_prompt.md','prompts/system_prompt.md','prompts/user_prompt.md'];return markers.some(m=>paths.some(p=>p===m||p.endsWith('/'+m)))}
function looksLikeRootWork(files){const paths=files.map(f=>clean(f.path));const markers=['readme.md','decisiones.md','system_prompt.md','user_prompt.md','prompts/system_prompt.md','prompts/user_prompt.md'];return markers.some(m=>paths.includes(m))}
function splitPackage(baseName,files){
  const usable=files.filter(f=>f.path&&typeof f.content==='string');if(!usable.length)return[];
  const direct=usable.some(f=>!f.path.includes('/'));const top=[...new Set(usable.map(f=>f.path.split('/')[0]).filter(Boolean))];
  if(direct||top.length<=1||looksLikeRootWork(usable))return[{name:baseName,files:usable}];
  const groups=top.map(name=>({name,files:usable.filter(f=>f.path.startsWith(name+'/')).map(f=>({...f,path:f.path.slice(name.length+1)}))})).filter(g=>g.files.length);
  const workGroups=groups.filter(g=>looksLikeWork(g.files));return workGroups.length>=2?workGroups:[{name:baseName,files:usable}];
}
function saveLocalProfiles(baseName,files){for(const work of splitPackage(baseName,files))localProfiles.set(`local://${encodeURIComponent(work.name)}`,buildIntegrityProfile(work.files));schedule()}

async function captureFolder(fileList){
  const files=[...fileList];if(!files.length)return;const base=(files[0].webkitRelativePath||files[0].name).split('/')[0]||'Trabajo local';const out=[];
  await Promise.all(files.map(async file=>{const raw=file.webkitRelativePath||file.name;const parts=raw.split('/');const path=normalizePath(parts.length>1?parts.slice(1).join('/'):parts[0]);if(!path||!shouldRead(path,file.size))return;try{out.push({path,size:file.size,content:await file.text()})}catch{}}));
  saveLocalProfiles(base,out);
}
function findEocd(view){const min=Math.max(0,view.byteLength-65557);for(let i=view.byteLength-22;i>=min;i--)if(view.getUint32(i,true)===0x06054b50)return i;return-1}
async function inflateRaw(bytes){const ds=new DecompressionStream('deflate-raw');return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer())}
async function extractZip(file){
  const bytes=new Uint8Array(await file.arrayBuffer()),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),eocd=findEocd(view);if(eocd<0)return[];
  const total=view.getUint16(eocd+10,true),cdOffset=view.getUint32(eocd+16,true);if(total===0xffff||cdOffset===0xffffffff)return[];
  const decoder=new TextDecoder('utf-8'),out=[];let p=cdOffset;
  for(let i=0;i<total;i++){
    if(p+46>view.byteLength||view.getUint32(p,true)!==0x02014b50)break;
    const flags=view.getUint16(p+8,true),method=view.getUint16(p+10,true),compSize=view.getUint32(p+20,true),uncompSize=view.getUint32(p+24,true),nameLen=view.getUint16(p+28,true),extraLen=view.getUint16(p+30,true),commentLen=view.getUint16(p+32,true),localOffset=view.getUint32(p+42,true);
    const name=normalizePath(decoder.decode(bytes.slice(p+46,p+46+nameLen)));p+=46+nameLen+extraLen+commentLen;if(!name||name.endsWith('/')||!shouldRead(name,uncompSize)||(flags&1))continue;
    if(localOffset+30>view.byteLength||view.getUint32(localOffset,true)!==0x04034b50)continue;
    const localNameLen=view.getUint16(localOffset+26,true),localExtraLen=view.getUint16(localOffset+28,true),start=localOffset+30+localNameLen+localExtraLen,end=start+compSize;if(end>bytes.length)continue;
    try{const compressed=bytes.slice(start,end);const plain=method===0?compressed:method===8?await inflateRaw(compressed):null;if(plain)out.push({path:name,size:uncompSize,content:decoder.decode(plain)})}catch{}
  }
  const roots=[...new Set(out.map(f=>f.path.split('/')[0]))];if(roots.length===1&&out.every(f=>f.path.includes('/'))){const r=roots[0]+'/';return out.map(f=>({...f,path:f.path.slice(r.length)})).filter(f=>f.path)}return out;
}
async function captureZips(fileList){for(const zip of [...fileList]){try{saveLocalProfiles(zip.name.replace(/\.zip$/i,''),await extractZip(zip))}catch{}}}

document.getElementById('folder-input')?.addEventListener('change',e=>captureFolder(e.target.files));
document.getElementById('zip-input')?.addEventListener('change',e=>captureZips(e.target.files));
document.addEventListener('click',e=>{const row=e.target.closest?.('tr[data-id]');if(row&&!e.target.closest?.('[data-remove]')){selectedId=row.dataset.id;schedule()}},{capture:true});

function profileFor(item){
  if(item?.target?.kind==='github'){
    const sha=item?.result?.repositorio?.commit_sha;if(!sha)return null;return githubProfiles.get(githubKey(item.target.owner,item.target.repo,sha))||null;
  }
  return localProfiles.get(item?.target?.url)||null;
}
function tone(count,review=false){return count>0||review?'warn':'good'}
function similarityCard(sim){
  if(!sim?.comparedWith)return`<div class="integrity-card neutral"><h4>Similitud entre entregas</h4><div class="integrity-status">Sin comparación</div><p>Cargá y procesá al menos dos trabajos en el mismo lote para habilitar este control.</p></div>`;
  const h=sim.highest;if(!h)return`<div class="integrity-card good"><h4>Similitud entre entregas</h4><div class="integrity-status">Sin coincidencias relevantes</div><p>Se comparó contra ${sim.comparedWith} trabajo(s) del lote y no se superaron los umbrales de alerta.</p></div>`;
  const pct=Math.round(h.maxSimilarity*100),cls=h.level==='high'?'bad':'warn',label=h.level==='high'?'Similitud alta':'Similitud relevante';
  const files=(h.matches||[]).slice(0,3).map(m=>`${Math.round(m.similarity*100)}% · ${m.fileA} ↔ ${m.fileB}`).join('<br>');
  return`<div class="integrity-card ${cls}"><h4>Similitud entre entregas</h4><div class="integrity-status">${label}: ${pct}%</div><p><span class="similarity-chip ${h.level}">${h.level==='high'?'Revisión prioritaria':'Revisar'}</span> coincidencia con <b>${esc(h.name)}</b>. Esto no prueba plagio.</p>${files?`<div class="integrity-files">${esc(files).replaceAll('&lt;br&gt;','<br>')}</div>`:''}</div>`;
}
function integrityHtml(report){
  const injection=report.promptInjection?.count||0,manip=report.manipulation?.count||0,contr=report.contradictions?.count||0,sim=report.similarity?.highest;
  const needsReview=injection>0||manip>0||contr>0||sim?.level==='high'||sim?.level==='medium';
  return`<details class="integrity-section" open><summary><span class="integrity-title"><span class="integrity-icon">✓</span><span><strong>Controles de integridad</strong><small>Prompt injection, manipulación, contradicciones y similitud entre trabajos</small></span></span><span class="integrity-summary-state ${needsReview?'review':''}">${needsReview?'Revisión recomendada':'Sin alertas relevantes'}</span></summary><div class="integrity-body"><div class="integrity-grid">
    <div class="integrity-card ${tone(injection)}"><h4>Prompt injection</h4><div class="integrity-status">${injection?`${injection} señal(es)`:'Sin señales detectadas'}</div><p>${injection?'Se encontraron instrucciones dentro de la entrega que intentan alterar reglas o extraer instrucciones internas.':'No se detectaron patrones explícitos destinados a modificar las instrucciones del evaluador.'}</p></div>
    <div class="integrity-card ${tone(manip+contr)}"><h4>Manipulación y contradicciones</h4><div class="integrity-status">${manip+contr?`${manip} alerta(s) · ${contr} contradicción(es)`:'Sin alertas detectadas'}</div><p>${manip+contr?'Revisá las alertas e inconsistencias documentadas antes de cerrar la corrección.':'No se detectaron pedidos de inducir nota, ocultar hallazgos ni contradicciones materiales registradas.'}</p></div>
    ${similarityCard(report.similarity)}
  </div><div class="integrity-note"><b>Importante:</b> estos controles son auxiliares y heurísticos. No declaran plagio ni cambian automáticamente el puntaje. Una coincidencia relevante requiere revisión humana del profesor.</div></div></details>`;
}

function enhance(){
  const detail=document.getElementById('detail');if(!detail||!detail.querySelector('.score-row'))return;
  const items=loadItems();if(!items.length)return;
  let item=selectedId?items.find(x=>x.id===selectedId):null;
  if(!item){const name=detail.querySelector('.score-row h2')?.textContent?.trim();item=items.find(x=>x.target?.name===name)||items[0];if(item)selectedId=item.id}
  if(!item)return;
  const enriched=items.map(x=>({...x,integrityProfile:profileFor(x)}));const current=enriched.find(x=>x.id===item.id);const report=buildIntegrityReport(current,enriched);
  const old=detail.querySelector('.integrity-section');if(old)old.remove();
  const anchor=detail.querySelector('.work-feedback')||detail.querySelector('.result-section.summary')||detail.querySelector('.score-row');if(!anchor)return;
  anchor.insertAdjacentHTML('afterend',integrityHtml(report));
}

const detail=document.getElementById('detail');if(detail)new MutationObserver(schedule).observe(detail,{childList:true,subtree:false});
new MutationObserver(schedule).observe(document.getElementById('tbody')||document.body,{childList:true,subtree:true});
schedule();
