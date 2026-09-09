import { applyDeterministicEvidenceGates } from './evidence-gates.mjs';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

const STRICT_EVIDENCE_POLICY = `
CONTROL DE EVIDENCIA V5 — aplicación literal de criterios, sin alterar puntajes ni perseguir una nota objetivo:

REGLA GENERAL DE ESTABILIDAD
- Antes de asignar CUMPLE, verificá internamente cada requisito de la clasificación operativa del criterio, uno por uno.
- CUMPLE exige evidencia verificable para TODOS los requisitos. No completes requisitos por plausibilidad, intención, nombre de archivo ni descripción general.
- Si falta un requisito obligatorio, aplicá exactamente PARCIAL o NO_CUMPLE según la rúbrica. No “redondees hacia arriba”.
- Para criterios frontera, preferí la evidencia de mayor precedencia y citá el artefacto que demuestra cada requisito.

1) SC-02 — Herramienta/conector real y operable.
- CUMPLE exige DOS cosas simultáneas: (a) herramienta/conector concreto identificado, con su uso y alcance de acceso; y (b) al menos UNA vía de operabilidad admitida por la rúbrica: traza/corrida que demuestre acceso real, implementación local reproducible, o evidencia de integración reproducible.
- Una salida correcta o compatible con la entrada NO demuestra por sí sola que la herramienta haya sido ejecutada.
- Una descripción funcional como “lee archivos”, “lector local”, “herramienta de lectura de archivos” o equivalente, aun cuando indique una carpeta permitida, sigue siendo una clase genérica si no identifica la herramienta concreta o su implementación/integración.
- El mero hecho de que una salida contenga datos presentes en un archivo de entrada NO constituye por sí mismo una traza de acceso real.
- Si hay herramienta concreta y uso identificados pero la prueba de operabilidad o alcance es incompleta/no reproducible, corresponde PARCIAL.
- Si solo hay una clase genérica, una afirmación de uso sin identificar la herramienta concreta, o no hay herramienta, corresponde NO_CUMPLE.

2) FR-03 — Reconstrucción de versión/ref, ruta, configuración y salida.
- CUMPLE exige que un tercero pueda identificar simultáneamente: referencia/versión exacta del agente o ejecución + entrada/ruta + prompt/configuración relevante + salida original.
- Que existan entrada, prompt y salida asociables NO alcanza para CUMPLE si falta la referencia/versión exacta o la configuración de ejecución.
- Si puede asociarse entrada y salida pero falta referencia/versión o configuración, corresponde PARCIAL.
- No inferir una versión exacta desde la fecha, el nombre del archivo, la ubicación en el repo o la versión actual del prompt.

3) AE-01 — Costo por corrida con unidad, supuestos y fuente/carácter estimado.
- CUMPLE exige los CUATRO componentes: costo por corrida + moneda/unidad + base de cálculo o supuesto + fuente o marca explícita de estimación.
- Decir que una cifra es “estimada” satisface únicamente el carácter estimado; NO aporta por sí mismo la base de cálculo o supuesto que origina esa cifra.
- Una proyección posterior que multiplica el costo unitario NO reconstruye la base del costo unitario.
- Si existen costo y unidad pero falta la base/supuesto o falta la fuente/carácter, corresponde PARCIAL según la rúbrica.
- No inventar tokens, tarifas, bases de cálculo ni fuentes que no estén documentados en la evidencia.

4) AE-03 — Elección justificada del modelo costo-eficiente.
- CUMPLE exige identificar el modelo/configuración elegida Y una comparación, prueba o criterio verificable que demuestre suficiencia y costo-eficiencia.
- Decir “usar el modelo más pequeño/económico que alcance” o describir esa intención sin prueba/comparación verificable corresponde PARCIAL.
- No conviertas una recomendación futura de comparar modelos en evidencia de que la comparación ya fue realizada.

5) Regla transversal.
- No uses notas históricas, casos de calibración ni puntajes esperados como objetivo. La decisión debe surgir únicamente de la evidencia del repositorio evaluado.
- No reveles razonamiento interno. Devolvé únicamente el JSON estructurado solicitado.`;

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
        const user = body.messages.find(message => message?.role === 'user');
        if (system && typeof system.content === 'string') {
          system.content += `\n\n${STRICT_EVIDENCE_POLICY}`;
        } else {
          body.messages.unshift({ role: 'system', content: STRICT_EVIDENCE_POLICY });
        }

        const response = await originalFetch(args[0], { ...init, body: JSON.stringify(body) });
        if (!response.ok) return response;

        let data;
        try { data = await response.clone().json(); } catch { return response; }
        const content = data?.choices?.[0]?.message?.content;
        if (!content || typeof user?.content !== 'string') return response;

        try {
          const modelOutput = JSON.parse(content);
          const stabilized = applyDeterministicEvidenceGates(modelOutput, user.content);
          data.choices[0].message.content = JSON.stringify(stabilized);

          const headers = new Headers(response.headers);
          headers.delete('content-length');
          headers.delete('content-encoding');
          return new Response(JSON.stringify(data), {
            status: response.status,
            statusText: response.statusText,
            headers,
          });
        } catch (error) {
          console.warn('v5-mechanical-gates-skipped', error?.message || String(error));
          return response;
        }
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
