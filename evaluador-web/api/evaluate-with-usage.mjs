const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

const STRICT_EVIDENCE_POLICY = `
CONTROL DE EVIDENCIA V5 — aplicación literal de criterios, sin alterar puntajes ni perseguir una nota objetivo:

1) SC-02 — Herramienta/conector real y operable.
- CUMPLE exige DOS cosas simultáneas: (a) herramienta/conector concreto identificado, con su uso y alcance de acceso; y (b) al menos UNA vía de operabilidad admitida por la rúbrica: traza/corrida que demuestre acceso real, implementación local reproducible, o evidencia de integración reproducible.
- Una salida correcta o compatible con la entrada NO demuestra por sí sola que la herramienta haya sido ejecutada.
- Una frase como "lee archivos", "usa un lector" o una clase genérica de herramienta NO identifica por sí sola una herramienta concreta.
- Si hay herramienta concreta y uso identificados pero la prueba de operabilidad o alcance es incompleta/no reproducible, corresponde PARCIAL.
- Si solo hay una clase genérica, una afirmación de uso sin identificar la herramienta, o no hay herramienta, corresponde NO_CUMPLE.

2) AE-01 — Costo por corrida con unidad, supuestos y fuente/carácter estimado.
- CUMPLE exige los CUATRO componentes: costo por corrida + moneda/unidad + base de cálculo o supuesto + fuente o marca explícita de estimación.
- Decir que una cifra es "estimada" satisface únicamente el carácter estimado; NO aporta por sí mismo la base de cálculo o supuesto que origina esa cifra.
- Si existen costo y unidad pero falta la base/supuesto o falta la fuente/carácter, corresponde PARCIAL según la rúbrica.
- No inventar tokens, tarifas, bases de cálculo ni fuentes que no estén documentados en la evidencia.

3) Regla transversal.
- Para cada CUMPLE, enumerá mentalmente todos los requisitos de la clasificación operativa y verificá uno por uno que estén demostrados por evidencia de precedencia suficiente.
- Si un requisito obligatorio falta, NO uses CUMPLE. Aplicá exactamente PARCIAL o NO_CUMPLE según la clasificación V5.
- No uses notas históricas, casos de calibración ni puntajes esperados como objetivo. La decisión debe surgir únicamente de la evidencia del repositorio evaluado.`;

if (!globalThis.__evaluadorStrictEvidenceV5) {
  const originalFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = async (...args) => {
    const url = typeof args[0] === 'string' ? args[0] : String(args[0]?.url || '');
    const init = args[1] || {};

    if (url === GEMINI_ENDPOINT && String(init.method || 'GET').toUpperCase() === 'POST') {
      let body = null;
      try { body = JSON.parse(String(init.body || '{}')); } catch {}

      if (body && Array.isArray(body.messages)) {
        const system = body.messages.find(message => message?.role === 'system');
        if (system && typeof system.content === 'string') {
          system.content += `\n\n${STRICT_EVIDENCE_POLICY}`;
        } else {
          body.messages.unshift({ role: 'system', content: STRICT_EVIDENCE_POLICY });
        }
        return originalFetch(args[0], { ...init, body: JSON.stringify(body) });
      }
    }

    return originalFetch(...args);
  };

  globalThis.__evaluadorStrictEvidenceV5 = true;
}

let corePromise;

export default async function handler(req, res) {
  corePromise ||= import('./evaluate-one-shot-core.mjs');
  const core = await corePromise;
  return core.default(req, res);
}
