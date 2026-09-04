import assert from 'node:assert/strict';
import { evaluateEvidence } from './engine_v4.mjs';

const owner='TomyVrs';
const repo='Creaci-n-de-Agentes-con-IA---MBA-UCEMA';
const sha='022a9d975a4c0e9dd91b1b9d895853121fc519c4';
const root='Entrega 2 - Agente de Minutas';
const paths=[
  'README.md','caso_prueba_sintetico.md','registro_iteraciones.md','system_prompt.md','user_prompt.md',
  'salidas/salida_01.md','salidas/salida_02.md','salidas/salida_03.md','salidas/salida_04.md',
  'versiones/system_prompt_v1.md','versiones/system_prompt_v2.md','versiones/system_prompt_v3.md','versiones/system_prompt_v4.md'
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

assert.ok(result?.evaluacion,'El repo real debe producir una evaluación estructurada.');
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

console.log(`OK: smoke test sobre repo real de Minutas; evaluación consistente = ${result.puntaje_total}/100 (sin nota esperada).`);
