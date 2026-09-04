import assert from 'node:assert/strict';
import { evaluateEvidence } from './engine_v4.mjs';

const owner='TomyVrs';
const repo='Trabajo-Final';
const sha='41256e8a39a407ae5f6c9d4db718994cec6cc845';
const root='trabajo-final/trabajo-final';
const paths=[
  'README.md','DECISIONES.md','ANALISIS_ECONOMICO.md','GOBIERNO_Y_RIESGO.md',
  'prompts/system_prompt.md','prompts/user_prompt.md','herramienta/agregar_metricas_canal.py',
  'herramienta/salidas/metricas_2025-11.json','herramienta/salidas/metricas_2026-03.json','herramienta/salidas/metricas_2026-06.json',
  'corridas/corrida_1_2025-11/corrida.json','corridas/corrida_2_2026-03/corrida.json','corridas/corrida_3_2026-06/corrida.json'
];

const files=[];
for(const path of paths){
  const full=`${root}/${path}`;
  const raw=`https://raw.githubusercontent.com/${owner}/${repo}/${sha}/${full.split('/').map(encodeURIComponent).join('/')}`;
  const r=await fetch(raw);
  if(!r.ok) throw new Error(`${r.status} al leer ${full}`);
  const content=await r.text();
  files.push({path,content,size:content.length});
}

const result=evaluateEvidence({url:`https://github.com/${owner}/${repo}`,ref:sha,sha,root:`/${root}`,date:'2026-09-03',files,inventoryComplete:true,limitations:[]});

const allowed={
  'SC-01':[0,4,8],'SC-02':[0,4,8],'SC-03':[0,4,7],'SC-04':[0,4,7],
  'PD-01':[0,5,9],'PD-02':[0,4,8],'PD-03':[0,4,8],
  'FR-01':[0,3,5],'FR-02':[0,3,5],'FR-03':[0,3,5],
  'AE-01':[0,3,5],'AE-02':[0,3,5],'AE-03':[0,3,5],
  'GR-01':[0,2,4],'GR-02':[0,2,4],'GR-03':[0,2,3],'GR-04':[0,2,4]
};

assert.ok(result?.evaluacion,'El segundo repo real debe producir una evaluación estructurada.');
const criteria=Object.values(result.evaluacion).flatMap(d=>d.criterios||[]);
assert.equal(criteria.length,17,'La evaluación debe contener los 17 criterios de la rúbrica V5.');
assert.deepEqual([...criteria.map(c=>c.id)].sort(),Object.keys(allowed).sort(),'Deben evaluarse exactamente los criterios de la rúbrica V5.');
for(const c of criteria){
  assert.ok(allowed[c.id].includes(c.puntos),`${c.id}: puntaje ${c.puntos} fuera de los valores permitidos por la rúbrica.`);
  assert.ok(['CUMPLE','PARCIAL','NO_CUMPLE','NO_VERIFICABLE'].includes(c.estado),`${c.id}: estado no permitido.`);
}
const sum=criteria.reduce((n,c)=>n+c.puntos,0);
assert.equal(result.puntaje_total,sum,'El total debe ser exactamente la suma de los criterios.');
assert.ok(result.puntaje_total>=0&&result.puntaje_total<=100,'El total debe quedar entre 0 y 100.');

console.log(`OK: smoke test sobre segundo repo real; evaluación consistente = ${result.puntaje_total}/100 (sin nota esperada).`);
