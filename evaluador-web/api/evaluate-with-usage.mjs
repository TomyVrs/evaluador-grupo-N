import { AsyncLocalStorage } from 'node:async_hooks';
import { applyDeterministicEvidenceGates } from './evidence-gates.mjs';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const GATEWAY_ENDPOINT = 'https://ai-gateway.vercel.sh/v1/chat/completions';
const FREE_GEMINI_MODELS = ['gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-3.6-flash'];
const FREE_OPENROUTER_MODELS = ['nvidia/nemotron-3-super-120b-a12b:free'];
const LUNA_MODEL = 'openai/gpt-5.6-luna';
const SOL_MODEL = 'openai/gpt-5.6-sol';
const MAX_USER_CHARS = 120000;

const routeStorage = globalThis.__evaluadorV5RouteStorage || new AsyncLocalStorage();
globalThis.__evaluadorV5RouteStorage = routeStorage;

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

function gatewayToken() {
  return process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || '';
}

function geminiToken() {
  const key = process.env.GEMINI_API_KEY || '';
  return key.startsWith('__') ? '' : key;
}

function openRouterToken() {
  return process.env.OPENROUTER_API_KEY || '';
}

function costForModel(model, usage = {}) {
  const input = Number(usage.input_tokens || usage.prompt_tokens || 0);
  const output = Number(usage.output_tokens || usage.completion_tokens || 0);
  const id = String(model || '');
  if (id.includes('gemini') || id.endsWith(':free')) return 0;
  if (id.includes('gpt-5.6-sol')) return Number(((input * 2 + output * 10) / 1_000_000).toFixed(6));
  if (id.includes('gpt-5.6-luna')) return Number(((input * 0.2 + output * 1.2) / 1_000_000).toFixed(6));
  return null;
}

function prepareBody(sourceBody) {
  const body = structuredClone(sourceBody);
  const system = body.messages.find(message => message?.role === 'system');
  const user = body.messages.find(message => message?.role === 'user');
  if (system && typeof system.content === 'string') system.content += `\n\n${STRICT_EVIDENCE_POLICY}`;
  else body.messages.unshift({ role: 'system', content: STRICT_EVIDENCE_POLICY });

  if (user && typeof user.content === 'string' && user.content.length > MAX_USER_CHARS) {
    user.content = `${user.content.slice(0, MAX_USER_CHARS)}\n\n[PAQUETE DE EVIDENCIA TRUNCADO POR LÍMITE OPERATIVO DEL EVALUADOR. No inferir ausencias desde contenido omitido.]`;
  }
  return { body, user };
}

function isStructuredEvaluation(data) {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) return false;
  try {
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === 'object' && parsed.criterios && typeof parsed.criterios === 'object';
  } catch {
    return false;
  }
}

function recordAttempt(store, provider, model, response, data, accepted) {
  if (!store) return;
  store.attempts.push({ provider, model, status: response.status, accepted: Boolean(accepted) });
  if (!accepted) return;
  store.provider = provider;
  store.model = data?.model || model;
  store.usage = data?.usage || {};
}

async function callGeminiFree(originalFetch, body, store, model) {
  const key = geminiToken();
  if (!key) return null;
  const freeBody = { ...body, model };
  const response = await originalFetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(freeBody),
  });
  const data = await response.clone().json().catch(() => ({}));
  const accepted = response.ok && isStructuredEvaluation(data);
  recordAttempt(store, 'Google Gemini Free Tier', model, response, data, accepted);
  if (!accepted) {
    console.warn('free-model-fallback', JSON.stringify({ provider: 'gemini', status: response.status, model, error: data?.error || null, invalid_json: response.ok }));
  }
  return { response, data, accepted };
}

async function callOpenRouterFree(originalFetch, body, store, model) {
  const key = openRouterToken();
  if (!key) return null;
  const freeBody = { ...body, model };
  delete freeBody.temperature;
  const response = await originalFetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://evaluador-v5-web.vercel.app',
      'X-Title': 'Agente Evaluador V5 UCEMA',
    },
    body: JSON.stringify(freeBody),
  });
  const data = await response.clone().json().catch(() => ({}));
  const accepted = response.ok && isStructuredEvaluation(data);
  recordAttempt(store, 'OpenRouter Free', model, response, data, accepted);
  if (!accepted) {
    console.warn('free-model-fallback', JSON.stringify({ provider: 'openrouter', status: response.status, model, error: data?.error || null, invalid_json: response.ok }));
  }
  return { response, data, accepted };
}

async function callGateway(originalFetch, body, store, forceSol = false) {
  const token = gatewayToken();
  if (!token) return null;
  const primary = forceSol ? SOL_MODEL : LUNA_MODEL;
  const gatewayBody = { ...body, model: primary };
  if (!forceSol) gatewayBody.models = [SOL_MODEL];
  delete gatewayBody.temperature;

  const response = await originalFetch(GATEWAY_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Vercel-AI-Gateway-App': 'agente-evaluador-v5-ucema',
    },
    body: JSON.stringify(gatewayBody),
  });
  const data = await response.clone().json().catch(() => ({}));
  const resolvedModel = data?.model || primary;
  const accepted = response.ok && isStructuredEvaluation(data);
  recordAttempt(store, 'Vercel AI Gateway', resolvedModel, response, data, accepted);
  if (!accepted) {
    console.warn('gateway-model-fallback', JSON.stringify({ status: response.status, model: resolvedModel, error: data?.error || null, invalid_json: response.ok }));
  }
  return { response, data, accepted };
}

function stabilizedResponse(response, data, userContent) {
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof userContent !== 'string') return response;
  try {
    const modelOutput = JSON.parse(content);
    const stabilized = applyDeterministicEvidenceGates(modelOutput, userContent);
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

function unavailableResponse(store) {
  console.error('all-model-routes-exhausted', JSON.stringify({ attempts: store?.attempts || [] }));
  return new Response(JSON.stringify({ error: { message: 'La capacidad de evaluación está temporalmente ocupada. Reintentá en unos minutos.' } }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
}

if (!process.env.GEMINI_API_KEY && (openRouterToken() || gatewayToken())) process.env.GEMINI_API_KEY = '__auto_router__';

if (!globalThis.__evaluadorV5AutoRouterPatchedV2) {
  const originalFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = async (...args) => {
    const url = typeof args[0] === 'string' ? args[0] : String(args[0]?.url || '');
    const init = args[1] || {};

    if (url === GEMINI_ENDPOINT && String(init.method || 'GET').toUpperCase() === 'POST') {
      let sourceBody = null;
      try { sourceBody = JSON.parse(String(init.body || '{}')); } catch {}
      if (!sourceBody || !Array.isArray(sourceBody.messages)) return originalFetch(...args);

      const store = routeStorage.getStore();
      const { body, user } = prepareBody(sourceBody);

      for (const model of FREE_GEMINI_MODELS) {
        const free = await callGeminiFree(originalFetch, body, store, model);
        if (free?.accepted) return stabilizedResponse(free.response, free.data, user?.content);
      }

      for (const model of FREE_OPENROUTER_MODELS) {
        const free = await callOpenRouterFree(originalFetch, body, store, model);
        if (free?.accepted) return stabilizedResponse(free.response, free.data, user?.content);
      }

      const paid = await callGateway(originalFetch, body, store, false);
      if (paid?.accepted) return stabilizedResponse(paid.response, paid.data, user?.content);

      const paidResolved = String(paid?.data?.model || '');
      const paidError = String(paid?.data?.error?.message || '').toLowerCase();
      const gatewayBlocked = paid && (/credit card|billing|payment|quota/.test(paidError) || [402, 403].includes(paid.response.status));
      if (paid && !gatewayBlocked && !paidResolved.includes('gpt-5.6-sol')) {
        const sol = await callGateway(originalFetch, body, store, true);
        if (sol?.accepted) return stabilizedResponse(sol.response, sol.data, user?.content);
      }

      return unavailableResponse(store);
    }

    return originalFetch(...args);
  };

  globalThis.__evaluadorV5AutoRouterPatchedV2 = true;
}

let corePromise;

export default async function handler(req, res) {
  if (!geminiToken() && !openRouterToken() && !gatewayToken()) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ error: 'No hay un proveedor de IA habilitado para este deployment.' }));
  }

  const store = { attempts: [], provider: null, model: null, usage: {} };
  return routeStorage.run(store, async () => {
    const originalEnd = res.end.bind(res);
    res.end = (chunk, ...rest) => {
      try {
        const parsed = JSON.parse(Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk || '{}'));
        if (parsed?.uso_api && store.model) {
          const usage = parsed.uso_api;
          const actual = store.usage || {};
          const isFree = store.provider !== 'Vercel AI Gateway';
          usage.proveedor = store.provider;
          usage.perfil = isFree ? 'free' : String(store.model).includes('sol') ? 'sol' : 'luna';
          usage.modelo = store.model;
          usage.modelo_resuelto = store.model;
          usage.llamadas_modelo = store.attempts.length;
          usage.input_tokens = Number(actual.prompt_tokens || actual.input_tokens || usage.input_tokens || 0);
          usage.output_tokens = Number(actual.completion_tokens || actual.output_tokens || usage.output_tokens || 0);
          usage.total_tokens = Number(actual.total_tokens || (usage.input_tokens + usage.output_tokens));
          usage.costo_estimado_usd = costForModel(store.model, usage);
          usage.ruta_modelos = store.attempts;
          usage.nota = isFree
            ? `Modo automático: se resolvió sin costo con ${store.model}. Si un modelo gratuito no está disponible, el sistema recorre los siguientes modelos gratuitos antes de escalar a GPT-5.6 Luna y GPT-5.6 Sol.`
            : `Modo automático: las rutas gratuitas no estuvieron disponibles o no devolvieron una salida válida; se usó ${store.model} vía Vercel AI Gateway.`;
          chunk = JSON.stringify(parsed);
        }
      } catch {}
      return originalEnd(chunk, ...rest);
    };

    corePromise ||= import('./evaluate-one-shot-core.mjs');
    const core = await corePromise;
    return core.default(req, res);
  });
}