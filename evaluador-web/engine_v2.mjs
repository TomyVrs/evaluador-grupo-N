import { evaluateEvidence as evaluateBase, FREEZE_V5, RUBRIC_VERSION } from './engine.mjs';

export { FREEZE_V5, RUBRIC_VERSION };

const norm = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const byPath = (files, re) => files.find(f => re.test(norm(f.path)));
const allByPath = (files, re) => files.filter(f => re.test(norm(f.path)));
const has = (text, re) => re.test(norm(text));

function getCriterion(result, id) {
  for (const dim of Object.values(result.evaluacion || {})) {
    const c = dim.criterios?.find(x => x.id === id);
    if (c) return c;
  }
  return null;
}

function setCriterion(result, id, estado, puntos, ruta, detalle) {
  const c = getCriterion(result, id);
  if (!c) return;
  c.estado = estado;
  c.puntos = puntos;
  c.evidencia = ruta ? [{ ruta, detalle }] : [];
}

function level(points, max, criteria) {
  if (points === 0 && criteria.every(c => c.estado === 'NO_VERIFICABLE')) return 'NO_VERIFICABLE';
  if (points === 0) return 'INSUFICIENTE';
  const q = points / max;
  return q >= .85 ? 'EXCELENTE' : q >= .60 ? 'ADECUADO' : 'INSUFICIENTE';
}

function recalc(result) {
  for (const d of Object.values(result.evaluacion || {})) {
    d.puntaje = d.criterios.reduce((n, c) => n + c.puntos, 0);
    d.nivel = level(d.puntaje, d.maximo, d.criterios);
  }
  result.puntaje_total = Object.values(result.evaluacion || {}).reduce((n, d) => n + d.puntaje, 0);
  const zero = Object.values(result.evaluacion || {}).flatMap(d => d.criterios).filter(c => c.puntos === 0).map(c => c.id);
  result.resumen_final = `${result.puntaje_total}/100. ${zero.length ? `Prioridades: ${zero.slice(0, 5).join(', ')}${zero.length > 5 ? '…' : ''}.` : 'Todos los criterios tienen evidencia al menos parcial.'}${result.alertas_manipulacion?.length ? ` Se detectaron ${result.alertas_manipulacion.length} alerta(s) de manipulación.` : ''}`;
  if (result.motor_ejecutable) {
    result.motor_ejecutable.version = '1.1.0';
    result.motor_ejecutable.nota = 'Runner determinístico local con reconocimiento de estructuras documentales equivalentes; la fuente normativa sigue siendo rubrica.md y agente/.';
  }
}

function semanticIterationDoc(files) {
  const candidates = files.filter(f => /(decisiones|registro.*iteracion|iteraciones|historial.*(?:cambio|version)|changelog)/.test(norm(f.path)));
  return candidates.find(f => /(iteracion|v\d+\s*(?:→|->|a)\s*v\d+|falla observada|que fallo)/.test(norm(f.content))) || candidates[0];
}

function iterationSections(text) {
  const raw = String(text || '');
  const parts = raw.split(/(?=^#{1,4}\s+(?:iteraci[oó]n|mejora|versi[oó]n)\b)/gmi).filter(Boolean);
  return parts.length > 1 ? parts : [raw];
}

function upgradeProcess(result, files) {
  const doc = semanticIterationDoc(files);
  if (!doc) return;
  const t = norm(doc.content);
  const transitions = [...t.matchAll(/\bv\d+\s*(?:→|->|a)\s*v\d+\b/g)].length;
  const sections = iterationSections(doc.content);
  const sectionsWithFailure = sections.filter(s => /(falla observada|que fallo|problema observado|error observado|salida .*?(?:extensa|incorrecta|incompleta)|no destacaba|dej[oó].*(?:no definido|incomplet))/i.test(s));
  const sectionsWithChange = sections.filter(s => /(cambio realizado|pieza modificada|se agreg[oó]|se modific[oó]|se incorpor[oó]|se elimin[oó]|se permiti[oó])/i.test(s));
  const linkedSections = sections.filter(s => /(falla observada|que fallo|problema observado|error observado)/i.test(s) && /(cambio realizado|pieza modificada|se agreg[oó]|se modific[oó]|se incorpor[oó]|se elimin[oó]|se permiti[oó])/i.test(s));
  const versionedPrompts = allByPath(files, /(?:^|\/)versiones?\/.*(?:system|user)?_?prompt.*v\d+|(?:^|\/)v\d+.*prompt/);
  const outputs = allByPath(files, /(?:^|\/)(?:salidas?|outputs?|resultados?)\/.*(?:salida|output|resultado)[_-]?\d+/);
  const originalOutputLinked = outputs.some(f => /corrida\s*\d+.*v\d+|versi[oó]n\s*v?\d+/i.test(f.content || ''));

  const pd01 = getCriterion(result, 'PD-01');
  if (pd01 && pd01.puntos < 9 && transitions >= 2 && (versionedPrompts.length >= 3 || sectionsWithChange.length >= 2)) {
    setCriterion(result, 'PD-01', 'CUMPLE', 9, doc.path, `Registro cronológico equivalente: ${transitions} transiciones de versión y cambios trazables.`);
  }

  const pd02 = getCriterion(result, 'PD-02');
  if (pd02 && pd02.puntos < 8 && sectionsWithFailure.length >= 1 && originalOutputLinked) {
    setCriterion(result, 'PD-02', 'CUMPLE', 8, outputs[0].path, 'La falla está descrita en el registro de iteraciones y la salida original correspondiente permanece localizable en la carpeta de salidas.');
  } else if (pd02 && pd02.puntos === 0 && sectionsWithFailure.length >= 1) {
    setCriterion(result, 'PD-02', 'PARCIAL', 4, doc.path, 'Se describe al menos una falla específica con detalle suficiente, aunque no se pudo vincular de forma inequívoca a una salida original.');
  }

  const pd03 = getCriterion(result, 'PD-03');
  if (pd03 && pd03.puntos < 8 && linkedSections.length >= 1) {
    setCriterion(result, 'PD-03', 'CUMPLE', 8, doc.path, 'El mismo bloque de iteración vincula explícitamente falla observada, pieza/cambio aplicado y efecto en la salida.');
  }
}

function upgradeStructuredOutput(result, files) {
  const sys = byPath(files, /(?:^|\/)(?:prompts\/)?system_prompt\.md$/);
  const usr = byPath(files, /(?:^|\/)(?:prompts\/)?user_prompt\.md$/);
  if (!sys || !usr) return;
  const text = `${sys.content || ''}\n${usr.content || ''}`;
  const markdownTableHeaders = (text.match(/^\s*\|[^\n]+\|\s*$/gm) || []).length;
  const namedSections = (text.match(/^#{2,4}\s+[^\n]+$/gm) || []).length;
  const explicitConstraints = (norm(text).match(/\b(maximo|m[aá]ximo|solo si|si no|omitir|incluir unicamente|debe|no presentes|no invent)/g) || []).length;
  const c = getCriterion(result, 'SC-03');
  if (c && c.puntos < 7 && markdownTableHeaders >= 4 && namedSections >= 4 && explicitConstraints >= 3) {
    setCriterion(result, 'SC-03', 'CUMPLE', 7, sys.path, 'Contrato de salida estable mediante secciones obligatorias, tablas con columnas definidas y restricciones observables; JSON no es requisito para este criterio.');
  }
}

function detectSharedInputRuns(files, readme, iterationDoc) {
  const outputs = allByPath(files, /(?:^|\/)(?:salidas?|outputs?|resultados?)\/.*(?:salida|output|resultado)[_-]?\d+/);
  const inputs = files.filter(f => /(?:^|\/)(?:caso.*prueba|entrada|input|notas|material.*(?:entrada|prueba))[^\/]*\.(md|txt|json|csv)$/i.test(f.path));
  const context = norm(`${readme?.content || ''}\n${iterationDoc?.content || ''}`);
  const sharedClaim = /(mismo caso|misma entrada|mismo material|volver a ejecutar el mismo|se ejecuto el mismo caso|se ejecut[oó] el mismo caso)/.test(context);
  const completeOutputs = outputs.filter(f => {
    const c = norm(f.content || '');
    const dated = /20\d{2}[-\/]\d{1,2}[-\/]\d{1,2}|fecha\s*:\s*\d{1,2}\/\d{1,2}\/20\d{2}/.test(c);
    const runVersion = /corrida\s*\d+.*v\d+|\bversion\s*v?\d+|\bv\d+\b/.test(c);
    return dated && runVersion;
  });
  return { outputs, inputs, sharedClaim, completeOutputs };
}

function upgradeRuns(result, files) {
  const readme = byPath(files, /(?:^|\/)readme\.md$/);
  const it = semanticIterationDoc(files);
  const info = detectSharedInputRuns(files, readme, it);
  const fr02 = getCriterion(result, 'FR-02');
  if (fr02 && fr02.puntos < 5 && info.completeOutputs.length >= 3 && info.inputs.length >= 1 && info.sharedClaim) {
    setCriterion(result, 'FR-02', 'CUMPLE', 5, info.completeOutputs[0].path, `${info.completeOutputs.length} corridas fechadas/versionadas conservan salidas originales y el repositorio identifica explícitamente una entrada común reutilizada.`);
  }

  const versionedPrompts = allByPath(files, /(?:^|\/)versiones?\/.*prompt.*v\d+/);
  const fr03 = getCriterion(result, 'FR-03');
  if (fr03 && fr03.puntos < 5 && info.completeOutputs.length >= 1 && info.inputs.length >= 1 && info.sharedClaim && versionedPrompts.length >= 1) {
    setCriterion(result, 'FR-03', 'CUMPLE', 5, versionedPrompts[0].path, 'Las salidas identifican su versión, existe la entrada común y se conservan prompts versionados suficientes para reconstruir la ejecución.');
  }

  if (getCriterion(result, 'FR-02')?.puntos === 5) {
    const claimedMatch = norm(readme?.content || '').match(/\b(\d+|una|un|dos|tres|cuatro|cinco)\s+corridas?/);
    const words = { una: 1, un: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5 };
    const claimed = claimedMatch ? (words[claimedMatch[1]] ?? Number(claimedMatch[1])) : null;
    if (claimed === info.completeOutputs.length) {
      result.inconsistencias = (result.inconsistencias || []).filter(x => x.impacto !== 'FR-02/FR-03');
    }
  }
}

function correctFalseSupervision(result, files) {
  const gov = byPath(files, /(?:gobierno|riesgo|governance)/);
  const readme = byPath(files, /(?:^|\/)readme\.md$/);
  const context = norm(`${gov?.content || ''}\n${readme?.content || ''}`);
  const explicit = /(revision humana|revisi[oó]n por (?:una )?persona|human review|supervisi[oó]n|nivel\s*l[0-4]|\bl[0-4]\b|aprobaci[oó]n humana|firma final|sign.?off|rol aprobador|responsable de revisi[oó]n)/.test(context);
  if (!explicit) {
    const sc04 = getCriterion(result, 'SC-04');
    const gr04 = getCriterion(result, 'GR-04');
    if (sc04?.estado === 'PARCIAL') setCriterion(result, 'SC-04', 'NO_CUMPLE', 0, readme?.path, 'No hay evidencia explícita de un esquema de supervisión humana; menciones operativas a “revisar” o “responsable” no cuentan como gobierno.');
    if (gr04?.estado === 'PARCIAL') setCriterion(result, 'GR-04', 'NO_CUMPLE', 0, gov?.path || readme?.path, 'No hay evidencia explícita de supervisión, responsable de revisión y aprobación como mecanismo de gobierno.');
  }
}

export function evaluateEvidence(input) {
  const result = evaluateBase(input);
  if (!result?.evaluacion) return result;
  const files = (input.files || []).filter(f => typeof f.content === 'string');
  upgradeStructuredOutput(result, files);
  upgradeProcess(result, files);
  upgradeRuns(result, files);
  correctFalseSupervision(result, files);
  recalc(result);
  return result;
}
