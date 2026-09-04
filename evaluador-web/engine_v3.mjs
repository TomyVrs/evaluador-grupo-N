import { evaluateEvidence as evaluateV2, FREEZE_V5, RUBRIC_VERSION } from './engine_v2.mjs';

export { FREEZE_V5, RUBRIC_VERSION };

const norm = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const byPath = (files, re) => files.find(f => re.test(norm(f.path)));
const allByPath = (files, re) => files.filter(f => re.test(norm(f.path)));

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
    result.motor_ejecutable.version = '1.2.0';
    result.motor_ejecutable.nota = 'Runner determinístico local generalizado a estructuras documentales equivalentes, corridas JSON y herramientas locales reproducibles; la fuente normativa sigue siendo rubrica.md y agente/.';
  }
}

function upgradeConcreteTool(result, files) {
  const tool = byPath(files, /(?:^|\/)(?:herramienta|tools?|scripts?)\/.*\.(?:py|js|mjs|cjs|ts)$/);
  if (!tool) return;
  const t = norm(tool.content || '');
  const usage = /(?:^|\n)\s*(?:uso|usage)\s*:|python3?\s+[^\n]+\.py|node\s+[^\n]+\.(?:js|mjs)/.test(t);
  const outputs = allByPath(files, /(?:^|\/)(?:herramienta|tools?)\/(?:salidas?|outputs?|resultados?)\//);
  const basename = norm(tool.path.split('/').pop());
  const runRefs = files.filter(f => /(?:^|\/)corridas?\//.test(norm(f.path)) && (norm(f.content).includes(basename) || /generado con\s*:/.test(norm(f.content))));
  const c = getCriterion(result, 'SC-02');
  if (!c) return;
  if (usage && (outputs.length >= 1 || runRefs.length >= 1)) {
    if (c.puntos < 8) setCriterion(result, 'SC-02', 'CUMPLE', 8, tool.path, 'Herramienta local concreta con código inspeccionable, instrucción de uso y evidencia de ejecución/salidas preservadas.');
  } else if (c.puntos === 0) {
    setCriterion(result, 'SC-02', 'PARCIAL', 4, tool.path, 'Existe una herramienta local concreta y su uso es identificable, pero la evidencia de operabilidad/reproducción es incompleta.');
  }
}

function iterationDoc(files) {
  return files.find(f => /(decisiones|registro.*iteracion|iteraciones|historial.*(?:cambio|version)|changelog)/.test(norm(f.path)) && /(iteracion|que fallo|falla|bug|fix|cambio)/.test(norm(f.content)));
}

function upgradeNumberedProcess(result, files) {
  const doc = iterationDoc(files);
  if (!doc) return;
  const raw = String(doc.content || '');
  const headings = [...raw.matchAll(/^#{1,4}\s+iteraci[oó]n\s+\d+\b/gmi)].length;
  const sections = raw.split(/(?=^#{1,4}\s+iteraci[oó]n\s+\d+\b)/gmi).filter(Boolean);
  const concreteFailure = /(qu[eé] fall[oó]\s*:|falla observada|bug\s+(?:en|de)|se cort[oó]|truncad|salida.*(?:inv[aá]lid|incomplet|incorrect)|race condition)/i;
  const failureSections = sections.filter(s => concreteFailure.test(s));
  const changeSections = sections.filter(s => /(fix|cambio|se corrigi[oó]|se cambi[oó]|se agreg[oó]|se modific[oó]|se reemplaz[oó]|decisi[oó]n)/i.test(s));
  const linked = sections.filter(s => concreteFailure.test(s) && /(fix|cambio|se corrigi[oó]|se cambi[oó]|se agreg[oó]|se modific[oó]|causa)/i.test(s));

  const pd01 = getCriterion(result, 'PD-01');
  if (pd01 && pd01.puntos < 9 && headings >= 3 && changeSections.length >= 2) {
    setCriterion(result, 'PD-01', 'CUMPLE', 9, doc.path, `Registro cronológico con ${headings} iteraciones numeradas y cambios reconstruibles.`);
  }

  const pd02 = getCriterion(result, 'PD-02');
  if (pd02 && pd02.puntos === 0 && failureSections.length >= 1) {
    setCriterion(result, 'PD-02', 'PARCIAL', 4, doc.path, 'Se documentan fallas específicas con detalle suficiente, pero no se conserva inequívocamente al menos una salida fallida original dentro del alcance evaluado.');
  }

  const pd03 = getCriterion(result, 'PD-03');
  if (pd03 && pd03.puntos < 8 && linked.length >= 1) {
    setCriterion(result, 'PD-03', 'CUMPLE', 8, doc.path, 'Al menos una iteración vincula explícitamente la falla, su causa y el cambio aplicado.');
  }
}

function parseRunJson(file) {
  try {
    const o = JSON.parse(file.content || '{}');
    const rep = o.reproducibilidad && typeof o.reproducibilidad === 'object' ? o.reproducibilidad : {};
    const repText = norm(JSON.stringify(rep));
    const hasDate = Boolean(o.fecha || o.date || o.timestamp);
    const hasInput = /(entrada|input|datos_de_entrada|material|archivo|ruta)/.test(repText) || Boolean(o.entrada || o.input);
    const hasOutput = Object.prototype.hasOwnProperty.call(o, 'salida_parseada') || Object.prototype.hasOwnProperty.call(o, 'salida') || Object.prototype.hasOwnProperty.call(o, 'output') || Object.prototype.hasOwnProperty.call(o, 'resultado');
    const hasConfig = /(system_prompt|user_prompt|configuracion|modelo|model)/.test(repText) || Boolean(o.modelo || o.model);
    const exactRef = Boolean(o.ref || o.sha || o.commit || o.version_agente || o.agent_version || rep.ref || rep.sha || rep.commit || rep.version_agente || rep.agent_version);
    return { file, o, hasDate, hasInput, hasOutput, hasConfig, exactRef };
  } catch {
    return null;
  }
}

function upgradeJsonRuns(result, files) {
  const runFiles = files.filter(f => /(?:^|\/)corridas?\/.*(?:^|\/)corrida(?:[_-]?\d+)?\.json$/.test(norm(f.path)) || /(?:^|\/)runs?\/.*\.json$/.test(norm(f.path)));
  const runs = runFiles.map(parseRunJson).filter(Boolean);
  const complete = runs.filter(r => r.hasDate && r.hasInput && r.hasOutput);
  const fr02 = getCriterion(result, 'FR-02');
  if (fr02 && fr02.puntos < 5 && complete.length >= 3) {
    setCriterion(result, 'FR-02', 'CUMPLE', 5, complete[0].file.path, `${complete.length} corridas JSON conservan fecha, entrada/ruta identificable y salida de la ejecución.`);
  } else if (fr02 && fr02.puntos === 0 && complete.length >= 1) {
    setCriterion(result, 'FR-02', 'PARCIAL', 3, complete[0].file.path, `${complete.length} corrida(s) JSON reconstruible(s) con fecha, entrada y salida.`);
  }

  const fr03 = getCriterion(result, 'FR-03');
  const reproducible = complete.filter(r => r.hasConfig);
  if (fr03 && reproducible.length >= 1) {
    if (reproducible.every(r => r.exactRef) && reproducible.length >= 1 && fr03.puntos < 5) {
      setCriterion(result, 'FR-03', 'CUMPLE', 5, reproducible[0].file.path, 'Las corridas registran entrada, salida, configuración relevante y referencia/versionado exacto del agente.');
    } else if (fr03.puntos < 3) {
      setCriterion(result, 'FR-03', 'PARCIAL', 3, reproducible[0].file.path, 'Entrada, salida y configuración son asociables, pero falta fijar una ref/SHA o versión exacta del agente usada en la corrida.');
    }
  }
}

function upgradeExplicitGovernance(result, files) {
  const gov = byPath(files, /(?:gobierno|riesgo|governance)/);
  if (!gov) return;
  const t = norm(gov.content || '');
  const level = /\bl[0-4]\b/.test(t);
  const review = /(revision|revisa|revisar|valida|validacion).{0,80}(?:humana|humano|manager|jefe|director|supervisor)|(?:humana|humano|manager|jefe|director|supervisor).{0,80}(?:revision|revisa|revisar|valida|validacion)/.test(t);
  const role = /(channel manager|product manager|manager|jefe|director|supervisor|aprobador|responsable|owner)/.test(t);
  const approval = /(firma final|quien firma|firma el|aprueba|aprobacion|autoriza|sign.?off)/.test(t);
  if (level && review && role && approval) {
    const sc04 = getCriterion(result, 'SC-04');
    const gr04 = getCriterion(result, 'GR-04');
    if (sc04 && sc04.puntos < 7) setCriterion(result, 'SC-04', 'CUMPLE', 7, gov.path, 'Gobierno explícito: nivel L0–L4, momento de revisión humana, rol responsable y firma/aprobación definidos.');
    if (gr04 && gr04.puntos < 4) setCriterion(result, 'GR-04', 'CUMPLE', 4, gov.path, 'Nivel, revisión humana, rol responsable y firma/aprobación definidos de forma operable.');
  }
}

function correctUntestedModelChoice(result, files) {
  const econ = byPath(files, /(?:analisis.*econom|econom.*\.md|costos.*\.md)/);
  if (!econ) return;
  const t = norm(econ.content || '');
  const explicitUntested = /(no (?:se )?prob[oó]|no lleg[oó] a correr|no se corri[oó]|falta (?:correr|probar)|pendiente de (?:prueba|comparaci[oó]n)|antes de .*corresponder[ií]a .*compar)/.test(t);
  const c = getCriterion(result, 'AE-03');
  if (c && explicitUntested && c.puntos > 3) {
    setCriterion(result, 'AE-03', 'PARCIAL', 3, econ.path, 'Hay una elección costo-eficiente razonada y comparación de precios, pero la suficiencia del modelo recomendado no fue probada con el protocolo documentado.');
  }
}

export function evaluateEvidence(input) {
  const result = evaluateV2(input);
  if (!result?.evaluacion) return result;
  const files = (input.files || []).filter(f => typeof f.content === 'string');
  upgradeConcreteTool(result, files);
  upgradeNumberedProcess(result, files);
  upgradeJsonRuns(result, files);
  upgradeExplicitGovernance(result, files);
  correctUntestedModelChoice(result, files);
  recalc(result);
  return result;
}
