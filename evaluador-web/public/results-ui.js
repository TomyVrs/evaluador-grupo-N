const MAX_POINTS={
  'SC-01':8,'SC-02':8,'SC-03':7,'SC-04':7,
  'PD-01':9,'PD-02':8,'PD-03':8,
  'FR-01':5,'FR-02':5,'FR-03':5,
  'AE-01':5,'AE-02':5,'AE-03':5,
  'GR-01':4,'GR-02':4,'GR-03':3,'GR-04':4
};

const GROUPS=[
  {prefix:'SC',name:'Sistema completo y funcionando',max:30,tone:'blue'},
  {prefix:'PD',name:'Proceso documentado',max:25,tone:'violet'},
  {prefix:'FR',name:'Formato y reproducibilidad',max:15,tone:'cyan'},
  {prefix:'AE',name:'Análisis económico',max:15,tone:'amber'},
  {prefix:'GR',name:'Gobierno y riesgo',max:15,tone:'green'}
];

function directHeading(root,title){
  return [...root.children].find(el=>el.tagName==='H3'&&el.textContent.trim().toLowerCase()===title.toLowerCase());
}

function collectUntilHeading(heading){
  const nodes=[];let n=heading?.nextElementSibling;
  while(n&&n.tagName!=='H3'){const next=n.nextElementSibling;nodes.push(n);n=next}
  return nodes;
}

function makeSection({title,subtitle,kind='neutral',open=false,nodes=[]}){
  const section=document.createElement('details');
  section.className=`result-section ${kind}`;
  section.open=open;
  const summary=document.createElement('summary');
  summary.innerHTML=`<span class="result-section-marker"></span><span class="result-section-title"><strong>${title}</strong><small>${subtitle}</small></span><span class="result-section-toggle">Abrir</span>`;
  const body=document.createElement('div');body.className='result-section-body';
  nodes.forEach(n=>body.appendChild(n));section.append(summary,body);
  section.addEventListener('toggle',()=>{const t=summary.querySelector('.result-section-toggle');if(t)t.textContent=section.open?'Cerrar':'Abrir'});
  if(section.open)summary.querySelector('.result-section-toggle').textContent='Cerrar';
  return section;
}

function wrapDimensionScores(root){
  if(root.querySelector('.dimension-score-grid'))return;
  const dims=[...root.children].filter(el=>el.classList.contains('dim'));
  if(dims.length!==5)return;
  const grid=document.createElement('div');grid.className='dimension-score-grid';
  dims[0].before(grid);
  dims.forEach((d,i)=>{d.classList.add(`tone-${GROUPS[i].tone}`);grid.appendChild(d)});
}

function decorateFeedbackCards(section){
  const cards=[...section.querySelectorAll(':scope > .result-section-body > .feedback')];
  cards.forEach((card,i)=>card.classList.add('dimension-feedback-card',`tone-${GROUPS[i]?.tone||'blue'}`));
  const body=section.querySelector('.result-section-body');if(body)body.classList.add('dimension-feedback-grid');
}

function parseCriterion(crit){
  const head=crit.querySelector('.crithead');
  const labels=head?.querySelectorAll('b');
  if(!head||!labels||labels.length<2)return null;
  const parts=labels[0].textContent.split('·').map(x=>x.trim()).filter(Boolean);
  const id=parts[0];const state=parts[parts.length-1]||'';const title=parts.slice(1,-1).join(' · ');
  const points=Number((labels[1].textContent.match(/\d+(?:\.\d+)?/)||['0'])[0]);
  return{id,state,title,points,max:MAX_POINTS[id]??points,head};
}

function decorateCriterion(crit){
  if(crit.dataset.decorated==='1')return parseCriterion(crit);
  const meta=parseCriterion(crit);if(!meta)return null;
  const stateClass=meta.state.toLowerCase().replaceAll('_','-');
  crit.classList.add(`criterion-${stateClass}`);crit.dataset.decorated='1';
  const stateLabel=meta.state.replaceAll('_',' ');
  meta.head.innerHTML=`<div class="criterion-main"><span class="criterion-code">${meta.id}</span><strong class="criterion-title">${meta.title}</strong></div><div class="criterion-meta"><span class="criterion-state ${stateClass}">${stateLabel}</span><strong class="criterion-points">${meta.points}/${meta.max}</strong></div>`;
  const ev=crit.querySelector('.evidence');
  if(ev&&!ev.querySelector('.evidence-kicker'))ev.insertAdjacentHTML('afterbegin','<span class="evidence-kicker">Evidencia</span>');
  return meta;
}

function buildCriteriaGroups(section){
  const body=section.querySelector('.result-section-body');if(!body||body.querySelector('.criterion-groups'))return;
  const criteria=[...body.querySelectorAll(':scope > .crit')];if(!criteria.length)return;
  const groups=document.createElement('div');groups.className='criterion-groups';body.appendChild(groups);
  for(const def of GROUPS){
    const matches=criteria.filter(c=>c.querySelector('.crithead b')?.textContent.trim().startsWith(def.prefix+'-'));
    if(!matches.length)continue;
    let score=0;
    matches.forEach(c=>{const m=parseCriterion(c);score+=m?.points||0});
    const group=document.createElement('details');group.className=`criterion-group tone-${def.tone}`;
    const full=score===def.max;const level=full?'Completo':score===0?'Sin puntaje':'Con pendientes';
    group.innerHTML=`<summary><span><strong>${def.name}</strong><small>${matches.length} criterio(s) · ${level}</small></span><b>${score}/${def.max}</b></summary><div class="criterion-group-body"></div>`;
    const groupBody=group.querySelector('.criterion-group-body');
    matches.forEach(c=>{decorateCriterion(c);groupBody.appendChild(c)});
    groups.appendChild(group);
  }
}

function wrapSimpleSection(root,title,newTitle,subtitle,kind,open){
  const heading=directHeading(root,title);if(!heading)return null;
  const nodes=collectUntilHeading(heading);const section=makeSection({title:newTitle,subtitle,kind,open,nodes});
  heading.before(section);heading.remove();return section;
}

function wrapAlerts(root){
  const h1=directHeading(root,'Inconsistencias');const h2=directHeading(root,'Alertas de manipulación');
  if(!h1&&!h2)return;
  const nodes=[];
  for(const h of [h1,h2].filter(Boolean)){
    const label=document.createElement('div');label.className='alert-subtitle';label.textContent=h.textContent.trim();nodes.push(label);
    const following=collectUntilHeading(h);following.forEach(n=>nodes.push(n));h.remove();
  }
  const section=makeSection({title:'Alertas y observaciones',subtitle:'Contradicciones, inconsistencias y señales que requieren revisión',kind:'warning',open:true,nodes});
  const anchor=root.querySelector('.result-section.criteria');
  if(anchor)anchor.after(section);else root.appendChild(section);
}

function enhanceResult(root){
  if(!root||!root.querySelector('.score-row')||!root.querySelector('.work-feedback')||root.querySelector('.result-section'))return;
  wrapDimensionScores(root);
  const summary=wrapSimpleSection(root,'Resumen','Resumen técnico','Síntesis automática que acompaña la nota','summary',false);
  const byDim=wrapSimpleSection(root,'Feedback por dimensión','Feedback por dimensión','Qué funcionó y qué conviene mejorar en cada una de las 5 dimensiones','dimensions',true);
  if(byDim)decorateFeedbackCards(byDim);
  const criteria=wrapSimpleSection(root,'Criterios y evidencia','Criterios y evidencia','Detalle técnico de los 17 criterios. Abrí solo la dimensión que quieras revisar.','criteria',false);
  if(criteria)buildCriteriaGroups(criteria);
  wrapAlerts(root);
  if(summary)summary.classList.add('compact-summary');
}

function run(){enhanceResult(document.getElementById('detail'))}
const detail=document.getElementById('detail');
if(detail){new MutationObserver(()=>queueMicrotask(run)).observe(detail,{childList:true,subtree:false});run()}
