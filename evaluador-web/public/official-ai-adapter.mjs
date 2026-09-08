import { evaluateEvidence as evaluateLocal, FREEZE_V5 } from '/engine_v4.mjs';

export { FREEZE_V5 };

const CODE_KEY = 'evaluador-v5-access-code';
let askingCode = null;

function enhanceOfficialUi(){
  const status=document.getElementById('engine-status');
  if(status){status.textContent='Agente IA V5 oficial';status.className='pill ok'}
  const rate=document.getElementById('rate');
  if(rate){rate.textContent='GitHub: lectura server-side';rate.className='pill'}
  const side=document.querySelector('.side-note');
  if(side)side.innerHTML='<b>Evaluador oficial V5.</b><br>Las evaluaciones de repositorios GitHub ejecutan el agente IA normativo, anclado a SHA y con herramientas de solo lectura.';
  const scope=document.querySelector('#engine-scope .hint');
  if(scope)scope.innerHTML='<b>La nota mostrada para repositorios GitHub la calcula el agente IA V5 real.</b> El backend resuelve la referencia a un SHA exacto, inventaría el alcance y permite al modelo leer archivos e historial mediante herramientas GitHub de solo lectura. La rúbrica, configuración y contrato se cargan desde el freeze normativo V5.';
  const footer=document.querySelector('footer');
  if(footer)footer.textContent='Agente IA V5 oficial · evidencia GitHub anclada a SHA · herramientas de solo lectura · salida validada contra la rúbrica V5.';
  document.querySelectorAll('.local-source').forEach(el=>el.style.display='none');
  const loaderHint=document.querySelector('#loader .section-head .hint');
  if(loaderHint)loaderHint.textContent='Pegá uno o varios repositorios públicos de GitHub. Cada evaluación oficial se ejecuta en el servidor con el agente IA V5.';
  const token=document.getElementById('gh-token');
  if(token)token.style.display='none';
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
  const response=await fetch('/api/evaluate',{
    method:'POST',
    headers:{'Content-Type':'application/json','X-Evaluator-Code':code},
    body:JSON.stringify({url:payload.url,ref:payload.ref||'main',root:payload.root||'/'}),
  });
  let data={};try{data=await response.json()}catch{}
  if(response.status===401&&retry){sessionStorage.removeItem(CODE_KEY);return callOfficialAgent(payload,false)}
  if(!response.ok)throw new Error(data.error||`La evaluación oficial falló (HTTP ${response.status}).`);
  return data;
}

export async function evaluateEvidence(payload){
  if(String(payload?.url||'').startsWith('https://github.com/'))return callOfficialAgent(payload);
  return evaluateLocal(payload);
}

enhanceOfficialUi();
