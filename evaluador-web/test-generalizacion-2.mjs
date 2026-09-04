import assert from 'node:assert/strict';
import { evaluateEvidence } from './engine_v3.mjs';

const owner='TomyVrs';
const repo='Trabajo-Final';
const sha='41256e8a39a407ae5f6c9d4db718994cec6cc845';
const root='trabajo-final/trabajo-final';
const textExt=/\.(md|txt|json|csv|yaml|yml|js|mjs|cjs|ts|tsx|jsx|py|html|css|xml|toml|ini)$/i;

async function getJson(url){
  const r=await fetch(url,{headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}});
  if(!r.ok) throw new Error(`${r.status} ${r.statusText}: ${url}`);
  return r.json();
}

const tree=await getJson(`https://api.github.com/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`);
assert.equal(tree.truncated,false,'El inventario del segundo repo real no debe estar truncado.');
const entries=tree.tree.filter(x=>x.type==='blob'&&x.path.startsWith(root+'/')&&textExt.test(x.path)&&(x.size||0)<=120000);
const files=[];
for(const e of entries){
  const raw=`https://raw.githubusercontent.com/${owner}/${repo}/${sha}/${e.path.split('/').map(encodeURIComponent).join('/')}`;
  const r=await fetch(raw);
  if(!r.ok) throw new Error(`${r.status} al leer ${e.path}`);
  files.push({path:e.path.slice(root.length+1),content:await r.text(),size:e.size});
}

const result=evaluateEvidence({
  url:`https://github.com/${owner}/${repo}`,
  ref:sha,
  sha,
  root:`/${root}`,
  date:'2026-09-03',
  files,
  inventoryComplete:true,
  limitations:[]
});

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
