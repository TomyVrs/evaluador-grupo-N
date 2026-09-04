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
const criterion=id=>Object.values(result.evaluacion).flatMap(d=>d.criterios).find(c=>c.id===id);
assert.equal(criterion('SC-01').puntos,8,'SC-01 debe reconocer las seis piezas distribuidas entre system y user prompt.');
assert.equal(criterion('SC-02').puntos,8,'SC-02 debe reconocer la herramienta Python, su uso y las salidas/corridas que prueban operabilidad.');
assert.equal(criterion('SC-03').puntos,7,'SC-03 debe reconocer el esquema JSON exacto.');
assert.equal(criterion('SC-04').puntos,7,'SC-04 debe reconocer L2, revisión humana, responsable y firma.');
assert.equal(criterion('PD-01').puntos,9,'PD-01 debe reconocer las iteraciones numeradas y sus cambios.');
assert.equal(criterion('PD-02').puntos,4,'PD-02 queda parcial: las fallas están descritas con detalle, pero no se preserva inequívocamente una salida fallida original.');
assert.equal(criterion('PD-03').puntos,8,'PD-03 debe reconocer falla/causa/fix explícitos.');
assert.equal(criterion('FR-01').puntos,5,'FR-01 tiene README, prompts y DECISIONES.');
assert.equal(criterion('FR-02').puntos,5,'FR-02 debe reconocer tres corrida.json con fecha, entrada y salida.');
assert.equal(criterion('FR-03').puntos,3,'FR-03 queda parcial porque las corridas no fijan SHA/ref o versión exacta del agente.');
assert.equal(criterion('AE-01').puntos,5,'AE-01 debe reconocer costo por corrida con tokens reales, unidad y fuente.');
assert.equal(criterion('AE-03').puntos,3,'AE-03 queda parcial porque Haiku se recomienda pero no se probó con el protocolo documentado.');
assert.equal(criterion('GR-01').puntos,4,'GR-01 debe reconocer solo lectura y mínimo privilegio.');
assert.equal(criterion('GR-02').puntos,4,'GR-02 debe reconocer múltiples riesgos específicos con controles.');
assert.equal(criterion('GR-04').puntos,4,'GR-04 debe reconocer L2, revisión, responsable y firma.');
assert.ok(result.puntaje_total>=89&&result.puntaje_total<=92,`El segundo trabajo real debería quedar entre 89 y 92 según AE-02/GR-03; obtuvo ${result.puntaje_total}.`);
console.log(`OK: segundo trabajo real generalizado = ${result.puntaje_total}/100.`);
console.log(`AE-02=${criterion('AE-02').puntos}, GR-03=${criterion('GR-03').puntos}.`);
