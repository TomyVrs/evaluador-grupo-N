import { AsyncLocalStorage } from 'node:async_hooks';
import evaluate from './evaluate.mjs';

const usageStorage = globalThis.__evaluadorV5RouterStorage || new AsyncLocalStorage();
globalThis.__evaluadorV5RouterStorage = usageStorage;

const realOpenAIKey = process.env.OPENAI_API_KEY || '';
const openRouterKey = process.env.OPENROUTER_API_KEY || '';

// evaluate.mjs valida la existencia de OPENAI_API_KEY antes de iniciar.
// Para OpenRouter usamos un placeholder que nunca sale de este proceso: la
// llamada real se reescribe server-side con OPENROUTER_API_KEY.
if (!process.env.OPENAI_API_KEY && openRouterKey) process.env.OPENAI_API_KEY = '__profile_router__';

const PROFILES = {
  sol: {
    id: 'sol',
    label: 'OpenAI GPT-5.6 Sol',
    provider: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/responses',
    model: 'gpt-5.6-sol',
    key: () => realOpenAIKey,
    rates: { input: 4.00, cached: 0.40, output: 20.00 },
    longContextThreshold: 272000,
    longInputMultiplier: 2,
    longOutputMultiplier: 1.5,
  },
  luna: {
    id: 'luna',
    label: 'OpenAI GPT-5.6 Luna',
    provider: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/responses',
    model: 'gpt-5.6-luna',
    key: () => realOpenAIKey,
    rates: { input: 0.20, cached: 0.02, output: 1.20 },
    longContextThreshold: 272000,
    longInputMultiplier: 2,
    longOutputMultiplier: 1.5,
  },
  free: {
    id: 'free',
    label: 'OpenRouter gpt-oss-120b free',
    provider: 'OpenRouter',
    endpoint: 'https://openrouter.ai/api/v1/responses',
    model: 'openai/gpt-oss-120b:free',
    key: () => openRouterKey,
    rates: { input: 0, cached: 0, output: 0 },
    longContextThreshold: null,
    longInputMultiplier: 1,
    longOutputMultiplier: 1,
  },
};

function getProfile(value) {
  const id = String(value || 'sol').trim().toLowerCase();
  return PROFILES[id] || PROFILES.sol;
}

function readRequestedProfile(req) {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    return getProfile(body.ai_profile);
  } catch {
    return PROFILES.sol;
  }
}

function priceUsage(profile, usage) {
  if (!profile?.rates || !usage) return null;
  const input = Number(usage.input_tokens || usage.prompt_tokens || 0);
  const cached = Math.min(input, Number(usage.input_tokens_details?.cached_tokens || 0));
  const uncached = Math.max(0, input - cached);
  const output = Number(usage.output_tokens || usage.completion_tokens || 0);
  const longContext = profile.longContextThreshold != null && input > profile.longContextThreshold;
  const inMult = longContext ? profile.longInputMultiplier : 1;
  const outMult = longContext ? profile.longOutputMultiplier : 1;
  return (uncached * profile.rates.input * inMult + cached * profile.rates.cached * inMult + output * profile.rates.output * outMult) / 1_000_000;
}

function recordUsage(store, data) {
  const usage = data?.usage;
  if (!store || !usage) return;
  store.calls += 1;
  store.response_model = String(data.model || store.response_model || store.profile.model);
  store.input_tokens += Number(usage.input_tokens || usage.prompt_tokens || 0);
  store.cached_input_tokens += Number(usage.input_tokens_details?.cached_tokens || 0);
  store.cache_write_tokens += Number(usage.input_tokens_details?.cache_write_tokens || 0);
  store.output_tokens += Number(usage.output_tokens || usage.completion_tokens || 0);
  store.reasoning_tokens += Number(usage.output_tokens_details?.reasoning_tokens || 0);
  store.total_tokens += Number(usage.total_tokens || 0);
  const cost = priceUsage(store.profile, usage);
  if (cost == null) store.cost_known = false;
  else store.estimated_cost_usd += cost;
}

function rewriteModelRequest(url, init, store) {
  if (!store || url !== 'https://api.openai.com/v1/responses') return null;
  const profile = store.profile;
  const key = profile.key();
  if (!key) throw new Error(`Falta configurar la credencial para ${profile.label}.`);

  let body;
  try { body = JSON.parse(String(init?.body || '{}')); }
  catch { throw new Error('No se pudo interpretar el request al modelo.'); }

  body.model = profile.model;

  const headers = new Headers(init?.headers || {});
  headers.set('Authorization', `Bearer ${key}`);
  headers.set('Content-Type', 'application/json');

  if (profile.provider === 'OpenRouter') {
    // OpenRouter OpenResponses acepta tools, reasoning, text.format y
    // previous_response_id, pero no acepta store:true. Omitimos ese flag y
    // exigimos un proveedor que soporte los parámetros solicitados.
    delete body.store;
    body.provider = { ...(body.provider || {}), require_parameters: true };
    headers.set('HTTP-Referer', 'https://evaluador-v5-web.vercel.app');
    headers.set('X-Title', 'Agente Evaluador V5 UCEMA');
    headers.set('X-OpenRouter-Metadata', 'enabled');
  }

  return { url: profile.endpoint, init: { ...init, headers, body: JSON.stringify(body) } };
}

if (!globalThis.__evaluadorV5RouterFetchPatched) {
  const baseFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (...args) => {
    const originalUrl = typeof args[0] === 'string' ? args[0] : String(args[0]?.url || '');
    const store = usageStorage.getStore();
    let fetchArgs = args;

    if (store && originalUrl === 'https://api.openai.com/v1/responses') {
      const rewritten = rewriteModelRequest(originalUrl, args[1] || {}, store);
      fetchArgs = [rewritten.url, rewritten.init];
    }

    const response = await baseFetch(...fetchArgs);

    if (store && originalUrl === 'https://api.openai.com/v1/responses') {
      try {
        const data = await response.clone().json();
        recordUsage(store, data);
        if (!response.ok) {
          console.error('model-provider-error', {
            provider: store.profile.provider,
            model: store.profile.model,
            status: response.status,
            error: data?.error || data,
          });
        }
      } catch {}
    }

    return response;
  };
  globalThis.__evaluadorV5RouterFetchPatched = true;
}

function usagePayload(store) {
  const p = store.profile;
  return {
    perfil: p.id,
    proveedor: p.provider,
    modelo: p.model,
    modelo_resuelto: store.response_model || p.model,
    llamadas_modelo: store.calls,
    input_tokens: store.input_tokens,
    cached_input_tokens: store.cached_input_tokens,
    cache_write_tokens: store.cache_write_tokens,
    output_tokens: store.output_tokens,
    reasoning_tokens: store.reasoning_tokens,
    total_tokens: store.total_tokens,
    costo_estimado_usd: store.cost_known ? Number(store.estimated_cost_usd.toFixed(6)) : null,
    tarifa_usd_por_millon: {
      entrada: p.rates.input,
      entrada_cacheada: p.rates.cached,
      salida: p.rates.output,
    },
    pricing_referencia: p.provider === 'OpenAI' ? 'OpenAI API pricing, 2026-09-08' : 'OpenRouter free model, 2026-09-08',
    nota: p.id === 'free'
      ? 'Perfil experimental de costo USD 0 sujeto a disponibilidad y límites del proveedor. Debe calibrarse contra Sol antes de usarse como corrector final.'
      : 'Los reasoning_tokens están incluidos dentro de output_tokens y no se suman dos veces. El costo es una estimación a partir del usage informado por el proveedor.',
  };
}

function sendError(res, status, message) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({ error: message }));
}

export default async function handler(req, res) {
  const profile = readRequestedProfile(req);
  if (!profile.key()) {
    const variable = profile.provider === 'OpenRouter' ? 'OPENROUTER_API_KEY' : 'OPENAI_API_KEY';
    return sendError(res, 503, `Falta configurar ${variable} para usar el perfil ${profile.label}.`);
  }

  const store = {
    profile,
    response_model: null,
    calls: 0,
    input_tokens: 0,
    cached_input_tokens: 0,
    cache_write_tokens: 0,
    output_tokens: 0,
    reasoning_tokens: 0,
    total_tokens: 0,
    estimated_cost_usd: 0,
    cost_known: true,
  };

  return usageStorage.run(store, async () => {
    // Proxy explícito: conserva statusCode/headers reales. El wrapper anterior
    // heredaba res y podía convertir un 502 del backend en HTTP 200 visual.
    const wrappedRes = {
      get statusCode() { return res.statusCode; },
      set statusCode(value) { res.statusCode = value; },
      setHeader(name, value) { return res.setHeader(name, value); },
      getHeader(name) { return res.getHeader?.(name); },
      end(chunk, encoding, callback) {
        let outgoing = chunk;
        try {
          if (chunk != null) {
            const text = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
            const body = JSON.parse(text);
            if (body && typeof body === 'object' && !body.error && res.statusCode < 400) {
              body.uso_api = usagePayload(store);
              outgoing = JSON.stringify(body);
            }
          }
        } catch {}
        return res.end(outgoing, encoding, callback);
      },
    };
    return evaluate(req, wrappedRes);
  });
}
