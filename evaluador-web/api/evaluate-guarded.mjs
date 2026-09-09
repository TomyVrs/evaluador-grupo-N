import router from './evaluate-router.mjs';

const STRICT_EVIDENCE_GATE = `

REGLA DE APLICACIÓN ESTRICTA DE V5 — NO AGREGA NI CAMBIA CRITERIOS:
Antes de asignar CUMPLE, verificá uno por uno TODOS los requisitos conjuntivos que la rúbrica define para ese criterio. Cada requisito debe estar respaldado por evidencia verificable del alcance inspeccionado. No completes requisitos faltantes por plausibilidad, intención o inferencia.

Aplicá especialmente estas reglas generales de evidencia:
- Una salida compatible con una herramienta no demuestra por sí sola que la herramienta haya sido ejecutada ni que sea operable; la operabilidad requiere la evidencia admisible que define SC-02.
- Una cifra de costo, aunque esté marcada como estimación, no demuestra por sí sola la base de cálculo o supuesto requerido; verificá todos los elementos de AE-01.
- La existencia de entradas y salidas no demuestra por sí sola reproducibilidad completa; para FR-03 verificá también versión/ref y configuración relevante cuando la rúbrica las exige.
- Un README, descripción o claim nunca reemplaza evidencia directa de mayor precedencia.
- Si falta al menos un requisito para CUMPLE, usá exactamente PARCIAL o NO_CUMPLE según la clasificación operativa de V5. No eleves a CUMPLE por evidencia aproximada o indirecta.

No apuntes a ningún puntaje objetivo ni uses resultados de calibración como referencia. Evaluá únicamente la evidencia del trabajo actual contra la rúbrica V5 congelada.`;

if (!globalThis.__evaluadorV5StrictEvidencePatched) {
  const routedFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (...args) => {
    const url = typeof args[0] === 'string' ? args[0] : String(args[0]?.url || '');
    if (url === 'https://api.openai.com/v1/responses') {
      const init = args[1] || {};
      try {
        const body = JSON.parse(String(init.body || '{}'));
        const instructions = String(body.instructions || '');
        if (!instructions.includes('REGLA DE APLICACIÓN ESTRICTA DE V5')) {
          body.instructions = `${instructions}${STRICT_EVIDENCE_GATE}`;
        }
        return routedFetch(args[0], { ...init, body: JSON.stringify(body) });
      } catch {
        return routedFetch(...args);
      }
    }
    return routedFetch(...args);
  };
  globalThis.__evaluadorV5StrictEvidencePatched = true;
}

export default async function handler(req, res) {
  const wrappedRes = {
    get statusCode() { return res.statusCode; },
    set statusCode(value) { res.statusCode = value; },
    setHeader(name, value) { return res.setHeader(name, value); },
    getHeader(name) { return res.getHeader?.(name); },
    end(chunk, encoding, callback) {
      let outgoing = chunk;
      try {
        if (chunk != null && res.statusCode < 400) {
          const text = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
          const body = JSON.parse(text);
          const calls = Number(body?.uso_api?.llamadas_modelo || 0);
          if (body && !body.error && calls < 2) {
            res.statusCode = 502;
            outgoing = JSON.stringify({
              error: 'La evaluación fue descartada porque el modelo intentó puntuar sin inspeccionar evidencia mediante herramientas de lectura.',
              codigo: 'EVIDENCE_NOT_READ',
            });
          }
        }
      } catch {}
      return res.end(outgoing, encoding, callback);
    },
  };
  return router(req, wrappedRes);
}
