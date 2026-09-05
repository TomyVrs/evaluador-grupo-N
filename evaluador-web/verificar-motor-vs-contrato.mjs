// Contrasta el motor determinístico (evaluador-web) contra la salida del contrato
// corrido sobre un modelo (calibracion/resultados_v5), en el ÚNICO repositorio
// externo que ambos evaluaron: borlandini-gh/generador-mails-mensuales.
//
// Uso:  cd evaluador-web && node verificar-motor-vs-contrato.mjs
// Requiere git y acceso a internet. No modifica nada del repositorio.

import { execFileSync } from 'node:child_process';
import { readdir, readFile, stat, mkdtemp } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { evaluateEvidence, FREEZE_V5 } from './engine_v4.mjs';

const URL_REPO = 'https://github.com/borlandini-gh/generador-mails-mensuales';
const SHA = 'beb7c044f36c3a6c4621a2f3e925554ef9d26311';

const here = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = join(here, '..');
const textExt = /\.(md|txt|json|csv|yaml|yml|js|mjs|ts|tsx|py|html|css)$/i;

async function walk(dir, base = dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    if (name === '.git' || name === 'node_modules') continue;
    const p = join(dir, name);
    const s = await stat(p);
    if (s.isDirectory()) out.push(...await walk(p, base));
    else if (textExt.test(name)) out.push({ path: relative(base, p).replaceAll('\\', '/'), content: await readFile(p, 'utf8'), size: s.size });
  }
  return out;
}

const dir = await mkdtemp(join(tmpdir(), 'verif-'));
execFileSync('git', ['clone', '--quiet', URL_REPO, dir], { stdio: 'inherit' });
execFileSync('git', ['-C', dir, 'checkout', '--quiet', SHA], { stdio: 'inherit' });

const files = await walk(dir);
const motor = evaluateEvidence({ url: URL_REPO, ref: SHA, sha: SHA, root: '/', date: '2026-09-05', files, inventoryComplete: true, limitations: [] });
const contrato = JSON.parse(await readFile(join(repoRoot, 'calibracion/resultados_v5/repo_externo_A.json'), 'utf8'));

const nombre = {
  sistema_completo_funcionando: 'Sistema completo',
  proceso_documentado: 'Proceso documentado',
  formato_reproducibilidad: 'Formato y reproducibilidad',
  analisis_economico: 'Análisis económico',
  gobierno_riesgo: 'Gobierno y riesgo',
};

console.log(`\nRepositorio: ${URL_REPO}`);
console.log(`SHA:         ${SHA}`);
console.log(`Rúbrica:     ${contrato.rubrica_version} en ambos lados`);
console.log(`Archivos de texto leídos por el motor: ${files.length}`);
console.log(`Archivos declarados por el contrato:   ${contrato.repositorio.archivos_revisados.length}\n`);
console.log('| Dimensión                  | Contrato+modelo | Motor JS | Dif. |');
console.log('|----------------------------|----------------:|---------:|-----:|');
for (const k of Object.keys(nombre)) {
  const a = contrato.evaluacion[k].puntaje, b = motor.evaluacion[k].puntaje, m = contrato.evaluacion[k].maximo;
  console.log(`| ${nombre[k].padEnd(26)} | ${String(a + '/' + m).padStart(15)} | ${String(b + '/' + m).padStart(8)} | ${String(b - a).padStart(4)} |`);
}
console.log(`| **TOTAL**                  | ${String(contrato.puntaje_total + '/100').padStart(15)} | ${String(motor.puntaje_total + '/100').padStart(8)} | ${String(motor.puntaje_total - contrato.puntaje_total).padStart(4)} |\n`);

const ae = Object.values(motor.evaluacion).flatMap(d => d.criterios).filter(c => c.id.startsWith('AE-'));
console.log('Criterios económicos según el motor:', ae.map(c => `${c.id}=${c.puntos} (${c.estado})`).join('  '));
console.log('El repositorio tiene, en DECISIONES.md, precio unitario, fórmula, conteo de tokens,');
console.log('costo por corrida (USD 0,0054), proyección anual y análisis de sensibilidad.\n');
