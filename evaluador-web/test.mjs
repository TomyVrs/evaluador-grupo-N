import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateEvidence, FREEZE_V5 } from './engine.mjs';

const here=fileURLToPath(new URL('.',import.meta.url));
const repoRoot=join(here,'..');
const textExt=/\.(md|txt|json|csv|yaml|yml|js|mjs|ts|py|html|css)$/i;

async function walk(dir,base=dir){
  const out=[];
  for(const name of await readdir(dir)){
    const p=join(dir,name);const s=await stat(p);
    if(s.isDirectory()) out.push(...await walk(p,base));
    else if(textExt.test(name)) out.push({path:relative(base,p).replaceAll('\\','/'),content:await readFile(p,'utf8'),size:s.size});
  }
  return out;
}

async function runCase(name,expected){
  const dir=join(repoRoot,'casos',name,'entrega');
  const files=await walk(dir);
  const r=evaluateEvidence({url:'https://github.com/TomyVrs/evaluador-grupo-N',ref:FREEZE_V5,sha:FREEZE_V5,root:`casos/${name}/entrega/`,date:'2026-09-03',files,inventoryComplete:true,limitations:[]});
  assert.equal(r.puntaje_total,expected,`${name}: puntaje esperado ${expected}, obtenido ${r.puntaje_total}`);
  assert.equal(Object.values(r.evaluacion).flatMap(d=>d.criterios).length,17);
  assert.equal(r.validacion.sumas_verificadas,true);
  return r;
}

const excelente=await runCase('excelente',82);
const flojo=await runCase('flojo',9);
const tramposo=await runCase('tramposo',31);
assert.ok(tramposo.alertas_manipulacion.length>=1,'tramposo debe disparar alerta de manipulación');
assert.ok(tramposo.inconsistencias.length>=3,'tramposo debe registrar contradicciones/arimética');
assert.equal(flojo.evaluacion.sistema_completo_funcionando.criterios.find(c=>c.id==='SC-01').puntos,4);
assert.equal(excelente.evaluacion.proceso_documentado.criterios.find(c=>c.id==='PD-03').puntos,8);
console.log('OK: runner local V5 reproduce Excelente 82, Flojo 9 y Tramposo 31.');
