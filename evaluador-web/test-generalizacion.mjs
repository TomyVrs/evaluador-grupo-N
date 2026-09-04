import assert from 'node:assert/strict';
import { evaluateEvidence } from './engine_v3.mjs';

const owner='TomyVrs';
const repo='Creaci-n-de-Agentes-con-IA---MBA-UCEMA';
const sha='022a9d975a4c0e9dd91b1b9d895853121fc519c4';
const root='Entrega 2 - Agente de Minutas';
const textExt=/\.(md|txt|json|csv|yaml|yml|js|mjs|cjs|ts|tsx|jsx|py|html|css|xml|toml|ini)$/i;

async function getJson(url){
  const r=await fetch(url,{headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}});
  if(!r.ok) throw new Error(`${r.status} ${r.statusText}: ${url}`);
  return r.json();
}

const tree=await getJson(`https://api.github.com/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`);
assert.equal(tree.truncated,false,'El inventario del repo de generalización no debe estar truncado.');
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
