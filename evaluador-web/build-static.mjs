import { cp, copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const out = join(root, 'dist');

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(join(root, 'public'), out, { recursive: true });

for (const file of ['engine.mjs', 'engine_v2.mjs', 'engine_v3.mjs', 'engine_v4.mjs']) {
  await copyFile(join(root, file), join(out, file));
}

const appPath = join(out, 'app.js');
let app = await readFile(appPath, 'utf8');
app = app.replace("from '/engine_v3.mjs'", "from '/official-ai-adapter.mjs'");

const legacyGithubEvaluation = "try{const c=await collectGitHub(t);if(c.noEvaluable)return noEvaluable(t,c.sha,c.reason);return evaluateEvidence({url:t.url,ref:t.ref,sha:c.sha,root:t.root,date:new Date().toISOString().slice(0,10),files:c.files,inventoryComplete:true,limitations:c.limitations})}\n  catch(err){if(/404/.test(err.message))return noEvaluable(t,null,'Repositorio, referencia o ruta no resoluble.');throw err}";
const officialGithubEvaluation = "try{return await evaluateEvidence({url:t.url,ref:t.ref,root:t.root,kind:'github'})}\n  catch(err){throw err}";
if (!app.includes(legacyGithubEvaluation)) throw new Error('No se encontró el bloque GitHub esperado en public/app.js');
app = app.replace(legacyGithubEvaluation, officialGithubEvaluation);

const localNeedle = "return evaluateEvidence({url:t.url,ref:'local',sha:payload.fingerprint,root:'/',date:new Date().toISOString().slice(0,10),files:payload.files,inventoryComplete:true,limitations:[]});";
const localReplacement = "return evaluateEvidence({url:t.url,ref:'local',sha:payload.fingerprint,root:'/',date:new Date().toISOString().slice(0,10),files:payload.files,sourceKind:t.sourceKind,inventoryComplete:true,limitations:[]});";
if (!app.includes(localNeedle)) throw new Error('No se encontró el bloque local esperado en public/app.js');
app = app.replace(localNeedle, localReplacement);

const zipHeaderNeedle = "const total=view.getUint16(eocd+10,true),cdOffset=view.getUint32(eocd+16,true);";
const zipHeaderReplacement = `${zipHeaderNeedle}\n  if(total>500)throw Error(\`${'${file.name}'}: contiene demasiadas entradas (máximo 500).\`);`;
if (!app.includes(zipHeaderNeedle)) throw new Error('No se encontró el encabezado ZIP esperado en public/app.js');
app = app.replace(zipHeaderNeedle, zipHeaderReplacement);

const zipLoopNeedle = "for(const zip of zips){const files=await extractZip(zip);totalAdded+=await addLocalPackage(zip.name.replace(/\\.zip$/i,''),files,'zip')}";
const zipLoopReplacement = "for(const zip of zips){if(zip.size>15*1024*1024)throw Error(`${zip.name}: supera el máximo de 15 MB.`);const files=await extractZip(zip);totalAdded+=await addLocalPackage(zip.name.replace(/\\.zip$/i,''),files,'zip')}";
if (!app.includes(zipLoopNeedle)) throw new Error('No se encontró el loop ZIP esperado en public/app.js');
app = app.replace(zipLoopNeedle, zipLoopReplacement);

await writeFile(appPath, app, 'utf8');

console.log('Build listo: GitHub, ZIP y carpetas usan el agente IA V5 oficial.');
