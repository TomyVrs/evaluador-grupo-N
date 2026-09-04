const CRITERIA={
  'SC-01':{name:'Contrato de prompts con seis piezas',max:8,action:'Completar system prompt y user prompt para que rol, contexto, tarea, restricciones, formato y criterios de calidad queden explícitos y verificables.'},
  'SC-02':{name:'Herramienta o conector real y operable',max:8,action:'Identificar la herramienta concreta, explicar su uso y permisos, y conservar una traza, corrida o implementación reproducible que demuestre que funciona.'},
  'SC-03':{name:'Salida estructurada y estable',max:7,action:'Definir un contrato de salida estable con campos, columnas o secciones obligatorias y restricciones observables.'},
  'SC-04':{name:'Supervisión humana definida',max:7,action:'Documentar nivel L0–L4, momento de revisión humana, responsable y quién aprueba o firma.'},
  'PD-01':{name:'Iteraciones cronológicas y trazables',max:9,action:'Conservar una versión inicial y al menos dos cambios posteriores, en orden, indicando qué cambió en cada paso.'},
  'PD-02':{name:'Fallas concretas preservadas',max:8,action:'Guardar al menos una salida fallida o problemática original; si no es posible, documentar la falla con suficiente detalle y referencia.'},
  'PD-03':{name:'Decisiones vinculadas a evidencia',max:8,action:'Vincular explícitamente cada cambio relevante con la falla, observación o evidencia que lo motivó.'},
  'FR-01':{name:'Estructura mínima de entrega',max:5,action:'Asegurar README, system prompt, user prompt y DECISIONES.md dentro del alcance evaluado.'},
  'FR-02':{name:'Tres ejecuciones reconstruibles',max:5,action:'Conservar al menos tres corridas con entrada identificable, salida original y fecha.'},
  'FR-03':{name:'Reproducibilidad de las corridas',max:5,action:'Registrar versión o ref exacta del agente, entrada o ruta, prompts/configuración relevante y salida original.'},
  'AE-01':{name:'Costo por corrida',max:5,action:'Documentar costo por corrida con moneda o unidad, base de cálculo o supuesto y fuente, o marcar claramente que es una estimación.'},
  'AE-02':{name:'Proyección económica reproducible',max:5,action:'Explicitar frecuencia, horizonte y fórmula de proyección, con aritmética verificable.'},
  'AE-03':{name:'Elección costo-eficiente del modelo',max:5,action:'Justificar el modelo o configuración elegida mediante comparación, prueba o criterio verificable de suficiencia y costo.'},
  'GR-01':{name:'Mínimo privilegio',max:4,action:'Identificar sistemas y permisos utilizados y demostrar que el agente opera con el mínimo acceso necesario.'},
  'GR-02':{name:'Riesgos y controles',max:4,action:'Documentar al menos dos riesgos específicos relevantes y asociar controles concretos a cada uno.'},
  'GR-03':{name:'Contingencias operables',max:3,action:'Definir qué hacer ante las fallas principales y cuándo detener, degradar o escalar.'},
  'GR-04':{name:'Gobierno y aprobación',max:4,action:'Definir revisión humana, responsable, nivel de autonomía y aprobación o firma final.'}
};

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

function parseCriterion(el){
  const labels=el.querySelectorAll('.crithead b');
  if(labels.length<2)return null;
  const parts=labels[0].textContent.split('·').map(x=>x.trim()).filter(Boolean);
  const id=parts[0];
  const state=parts[parts.length-1]||'';
  const points=Number((labels[1].textContent.match(/\d+(?:\.\d+)?/)||['0'])[0]);
  const meta=CRITERIA[id]||{name:parts.slice(1,-1).join(' · ')||id,max:points,action:'Revisar la evidencia faltante para este criterio.'};
  return{id,state,points,...meta};
}

function sectionText(root,title){
  const h=[...root.querySelectorAll('h3')].find(x=>x.textContent.trim().toLowerCase()===title.toLowerCase());
  return h?.nextElementSibling?.classList.contains('feedback')?h.nextElementSibling.innerText.trim():'';
}

function li(text,cls=''){return`<li${cls?` class="${cls}"`:''}>${esc(text)}</li>`}

function buildFeedback(root){
  if(!root||root.querySelector('.work-feedback'))return;
  const scoreEl=root.querySelector('.score');
  const criteria=[...root.querySelectorAll('.crit')].map(parseCriterion).filter(Boolean);
  if(!scoreEl||criteria.length!==17)return;

  const score=Number((scoreEl.textContent.match(/\d+(?:\.\d+)?/)||['0'])[0]);
  const full=criteria.filter(c=>c.state==='CUMPLE');
  const partial=criteria.filter(c=>c.state==='PARCIAL');
  const missing=criteria.filter(c=>c.state==='NO_CUMPLE'||c.state==='NO_VERIFICABLE');
  const priorities=[...partial,...missing].sort((a,b)=>((b.max-b.points)-(a.max-a.points))||b.max-a.max).slice(0,4);
  const strengths=[...full].sort((a,b)=>b.max-a.max).slice(0,5);
  const inconsistencies=sectionText(root,'Inconsistencias');
  const manipulation=sectionText(root,'Alertas de manipulación');
  const alertParts=[inconsistencies&&`Inconsistencias: ${inconsistencies}`,manipulation&&`Manipulación: ${manipulation}`].filter(Boolean);

  const block=document.createElement('section');
  block.className='work-feedback';
  block.innerHTML=`
    <div class="work-feedback-head">
      <div>
        <span class="section-kicker">Devolución del trabajo</span>
        <h3>Lectura ejecutiva de la evaluación</h3>
      </div>
      <div class="feedback-score">${score}<span>/100</span></div>
    </div>
    <p class="feedback-lead">El trabajo cumple completamente <b>${full.length} de 17 criterios</b>, tiene <b>${partial.length} criterio(s) parcial(es)</b> y <b>${missing.length} sin cumplimiento verificable</b>. La devolución siguiente se genera únicamente a partir de los criterios y evidencias que ya determinaron la nota.</p>
    <div class="feedback-grid">
      <div class="feedback-panel good-panel">
        <h4>Qué está bien</h4>
        <ul>${strengths.length?strengths.map(c=>li(`${c.id} · ${c.name}`)).join(''):li('No hay criterios con cumplimiento completo para destacar todavía.')}</ul>
      </div>
      <div class="feedback-panel partial-panel">
        <h4>Qué falta o está incompleto</h4>
        <ul>${partial.length?partial.slice(0,6).map(c=>li(`${c.id} · ${c.name}. ${c.action}`)).join(''):li('No hay criterios parciales: lo pendiente aparece como incumplimiento o no verificable.')}</ul>
      </div>
      <div class="feedback-panel bad-panel">
        <h4>Qué no cumple / no se pudo verificar</h4>
        <ul>${missing.length?missing.slice(0,6).map(c=>li(`${c.id} · ${c.name} (${c.state.replaceAll('_',' ')}). ${c.action}`)).join(''):li('No hay criterios en estado NO CUMPLE o NO VERIFICABLE.')}</ul>
      </div>
      <div class="feedback-panel priority-panel">
        <h4>Prioridades de mejora</h4>
        <ol>${priorities.length?priorities.map(c=>`<li><b>${esc(c.id)} · ${esc(c.name)}</b><br>${esc(c.action)} <span class="gap">Margen pendiente: ${c.max-c.points} pt${c.max-c.points===1?'':'s'}.</span></li>`).join(''):'<li>No quedan puntos pendientes por criterios.</li>'}</ol>
      </div>
    </div>
    <div class="feedback-alert ${alertParts.length?'has-alert':'no-alert'}"><b>Alertas de revisión:</b> ${alertParts.length?esc(alertParts.join(' | ')):'No se detectaron inconsistencias ni alertas de manipulación en esta evaluación.'}</div>
  `;

  const firstHeading=[...root.querySelectorAll('h3')].find(x=>x.textContent.trim()==='Resumen');
  if(firstHeading)root.insertBefore(block,firstHeading);else root.appendChild(block);
}

function enhance(){buildFeedback(document.getElementById('detail'))}
const detail=document.getElementById('detail');
if(detail){new MutationObserver(()=>queueMicrotask(enhance)).observe(detail,{childList:true});enhance()}
