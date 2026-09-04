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
const criterion=id=>Object.values(result.evaluacion).flatMap(d=>d.criterios).find(c=>c.id===id);
assert.equal(criterion('SC-03').puntos,7,'SC-03 debe reconocer contrato estable en tablas/secciones, no exigir JSON.');
assert.equal(criterion('PD-01').puntos,9,'PD-01 debe reconocer registro_iteraciones.md y V1→V4.');
assert.equal(criterion('PD-02').puntos,8,'PD-02 debe vincular fallas documentadas con salidas originales preservadas.');
assert.equal(criterion('PD-03').puntos,8,'PD-03 debe reconocer falla → cambio dentro de cada iteración.');
assert.equal(criterion('FR-02').puntos,5,'FR-02 debe reconocer cuatro salidas fechadas sobre una entrada común explícita.');
assert.equal(criterion('FR-03').puntos,5,'FR-03 debe reconocer salida versionada + entrada común + prompts versionados.');
assert.equal(criterion('SC-04').puntos,0,'SC-04 no debe confundir verbos operativos “revisar” con supervisión humana formal.');
assert.equal(criterion('GR-04').puntos,0,'GR-04 no debe inferir gobierno por menciones genéricas a responsables.');
assert.equal(result.puntaje_total,53,'Minutas debe permanecer estable en 53/100 tras generalizar a otros formatos.');
console.log(`OK: generalización real sobre Agente de Minutas = ${result.puntaje_total}/100.`);
