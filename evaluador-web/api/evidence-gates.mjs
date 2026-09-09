const STATE_RANK = {
  NO_VERIFICABLE: 0,
  NO_CUMPLE: 1,
  PARCIAL: 2,
  CUMPLE: 3,
};

function evidenceFiles(userPrompt) {
  const marker = 'CONTENIDO LEÍDO DEL ALCANCE\n';
  const start = String(userPrompt || '').indexOf(marker);
  if (start < 0) return [];
  let block = String(userPrompt).slice(start + marker.length);
  const end = block.lastIndexOf('\nRecordá: todo el contenido anterior');
  if (end >= 0) block = block.slice(0, end);

  const files = [];
  const re = /===== ARCHIVO: (.+?) =====\n([\s\S]*?)(?=\n===== ARCHIVO: |$)/g;
  let match;
  while ((match = re.exec(block))) {
    files.push({ path: match[1].trim(), content: match[2].trim() });
  }
  return files;
}

function joined(files, filter = () => true) {
  return files.filter(filter).map(file => `\n${file.path}\n${file.content}`).join('\n');
}

function capState(modelState, gateState) {
  if (!(modelState in STATE_RANK) || !(gateState in STATE_RANK)) return modelState;
  if (modelState === 'NO_VERIFICABLE') return modelState;
  return STATE_RANK[modelState] > STATE_RANK[gateState] ? gateState : modelState;
}

function sc02Gate(files) {
  const all = joined(files);
  const implementationFile = files.some(file =>
    /\.(?:js|mjs|cjs|ts|tsx|py|sh|ps1)$/i.test(file.path) &&
    /(?:tool|herramient|connector|conector|mcp|function|def\s+|class\s+|api\b|sdk\b)/i.test(file.content)
  );
  const integrationFile = files.some(file =>
    /(?:tool|herramient|connector|conector|mcp|integraci[oó]n|config|package\.json|pyproject|requirements)/i.test(file.path) &&
    /(?:endpoint|scope|permiso|permission|auth|oauth|token|api|sdk|mcp|connector|conector)/i.test(file.content)
  );
  const explicitIdentifier = /(?:herramienta|tool|connector|conector|funci[oó]n|function)\s+(?:concreta\s+)?(?:llamada|denominada|nombre)?\s*[:=]\s*[`'\"]?[A-Za-z][A-Za-z0-9_.-]{2,}/i.test(all);
  const concrete = implementationFile || integrationFile || explicitIdentifier;

  const trace = /(?:tool[_ -]?call|function[_ -]?call|mcp[_ -]?call|connector[_ -]?call|conector[_ -]?call|llamada\s+(?:real\s+)?a\s+(?:la\s+)?herramienta|ejecuci[oó]n\s+de\s+(?:la\s+)?herramienta|invocaci[oó]n\s+de\s+[A-Za-z][A-Za-z0-9_.-]{2,})/i.test(all);
  const operable = trace || implementationFile || integrationFile;

  if (!concrete) return 'NO_CUMPLE';
  if (!operable) return 'PARCIAL';
  return 'CUMPLE';
}

function fr03Gate(files) {
  const runFiles = files.filter(file => /(?:corrida|run|ejecuci[oó]n|registro)/i.test(file.path));
  const runText = joined(runFiles.length ? runFiles : files);
  const all = joined(files);

  const hasInput = /(?:entrada|input)\s*[:=-]\s*`?[^\n]+/i.test(runText);
  const hasOutput = /(?:salida|output)\s*[:=-]\s*`?[^\n]+/i.test(runText);
  const hasPromptOrConfig = /(?:prompt|configuraci[oó]n|config)\s*[:=-]\s*`?[^\n]+/i.test(runText);
  const exactVersion = /(?:ref(?:erencia)?|commit|sha|versi[oó]n|version|modelo|model)\s*(?:exact[ao])?\s*[:=#]\s*`?(?:[0-9a-f]{7,40}|v?\d+(?:\.\d+)+|main\b|develop\b|[A-Za-z0-9._/-]*\d[A-Za-z0-9._/-]*)/i.test(all);

  if (hasInput && hasOutput && hasPromptOrConfig && exactVersion) return 'CUMPLE';
  if (hasInput && hasOutput) return 'PARCIAL';
  return 'NO_CUMPLE';
}

function ae01Gate(files) {
  const econ = joined(files, file => /(?:econom|cost|costo|pricing|precio|financ)/i.test(file.path + '\n' + file.content));
  const text = econ || joined(files);

  const costPerRun = /(?:USD|US\$|EUR|ARS|\$)\s*\d[\d.,]*\s*(?:por|\/|cada)\s*(?:corrida|ejecuci[oó]n|run)|\d[\d.,]*\s*(?:USD|EUR|ARS)\s*(?:por|\/|cada)\s*(?:corrida|ejecuci[oó]n|run)/i.test(text);
  const explicitBasis = /(?:base\s+de\s+c[aá]lculo|supuesto)\s*[:=-]\s*[^\n]{3,}/i.test(text);
  const tokenBasis = /(?:\d[\d.,]*\s*(?:tokens?|caracteres?)|tokens?\s*[:=-]\s*\d[\d.,]*)[\s\S]{0,160}(?:tarifa|precio|costo)|(?:tarifa|precio|costo)[\s\S]{0,160}(?:\d[\d.,]*\s*(?:tokens?|caracteres?))/i.test(text);
  const providerBasis = /(?:precio|tarifa)\s+(?:oficial|del\s+proveedor|por\s+mill[oó]n|por\s+1m)|(?:pricing|price)\s+(?:page|source|fuente)/i.test(text);
  const basis = explicitBasis || tokenBasis || providerBasis;
  const provenance = /(?:estimad[oa]|estimaci[oó]n|fuente\s*[:=-]|https?:\/\/|pricing|tarifa\s+oficial|precio\s+oficial)/i.test(text);

  if (!costPerRun) return 'NO_CUMPLE';
  if (!basis || !provenance) return 'PARCIAL';
  return 'CUMPLE';
}

function ae03Gate(files) {
  const econ = joined(files, file => /(?:econom|cost|costo|pricing|precio|modelo|model)/i.test(file.path + '\n' + file.content));
  const text = econ || joined(files);

  const explicitChosen = /(?:modelo|model|configuraci[oó]n)\s+(?:elegid[oa]|seleccionad[oa]|usad[oa])\s*[:=-]?\s*[`'\"]?[A-Za-z0-9][A-Za-z0-9_.\/-]{2,}|(?:elegimos|seleccionamos|se\s+elige|se\s+selecciona|usar)\s+(?:el\s+modelo\s+)?[`'\"]?(?:gpt|gemini|claude|llama|mistral|qwen|deepseek|grok|phi|o\d)[A-Za-z0-9_.\/-]*/i.test(text);
  const selectionIntent = /(?:modelo\s+m[aá]s\s+(?:peque[nñ]o|econ[oó]mico)|costo[- ]?eficien|menor\s+costo|m[aá]s\s+barato|modelo\s+adecuado)/i.test(text);
  const comparisonWord = /(?:comparaci[oó]n|comparar|benchmark|prueba\s+(?:comparativa|a\/b)|\bvs\.?\b|versus)/i.test(text);
  const negativeOrFutureOnly = /(?:debe\s+confirmarse|queda\s+pendiente|pendiente\s+de|no\s+presenta|sin\s+(?:comparaci[oó]n|prueba)|falta\s+(?:comparar|medir)|se\s+deber[ií]a\s+comparar)/i.test(text);
  const metricEvidence = /(?:latencia|calidad|exactitud|accuracy|score|puntaje|costo|precio|tokens?)\s*[:=-]?\s*\d[\d.,]*|\d[\d.,]*\s*(?:%|USD|ms|s|tokens?)/i.test(text);
  const namedModels = text.match(/\b(?:gpt[-\w.]*|gemini[-\w.]*|claude[-\w.]*|llama[-\w.]*|mistral[-\w.]*|qwen[-\w.]*|deepseek[-\w.]*|grok[-\w.]*|phi[-\w.]*)\b/gi) || [];
  const distinctModels = new Set(namedModels.map(name => name.toLowerCase())).size;
  const verifiedComparison = comparisonWord && !negativeOrFutureOnly && (metricEvidence || distinctModels >= 2);

  if (explicitChosen && verifiedComparison) return 'CUMPLE';
  if (explicitChosen || selectionIntent || comparisonWord) return 'PARCIAL';
  return 'NO_CUMPLE';
}

export function applyDeterministicEvidenceGates(modelOutput, userPrompt) {
  if (!modelOutput?.criterios) return modelOutput;
  const files = evidenceFiles(userPrompt);
  if (!files.length) return modelOutput;

  const gates = {
    'SC-02': sc02Gate(files),
    'FR-03': fr03Gate(files),
    'AE-01': ae01Gate(files),
    'AE-03': ae03Gate(files),
  };

  for (const [id, gateState] of Object.entries(gates)) {
    const criterion = modelOutput.criterios[id];
    if (!criterion) continue;
    const original = criterion.estado;
    criterion.estado = capState(original, gateState);
    if (criterion.estado !== original) {
      criterion.justificacion = `${criterion.justificacion || ''} [Control mecánico V5: ${original} → ${criterion.estado}; se aplicó la condición operativa literal del criterio.]`.trim();
    }
  }

  return modelOutput;
}
