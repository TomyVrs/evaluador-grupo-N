import { AsyncLocalStorage } from 'node:async_hooks';
import evaluate from './evaluate.mjs';

const usageStorage = globalThis.__evaluadorV5RouterStorage || new AsyncLocalStorage();
globalThis.__evaluadorV5RouterStorage = usageStorage;

const realOpenAIKey = process.env.OPENAI_API_KEY || '';
const openRouterKey = process.env.OPENROUTER_API_KEY || '';
const geminiKey = process.env.GEMINI_API_KEY || '';
if (!process.env.OPENAI_API_KEY && (openRouterKey || geminiKey)) process.env.OPENAI_API_KEY = '__profile_router__';

const PROFILES = {
  sol: {
    id: 'sol', label: 'OpenAI GPT-5.6 Sol', provider: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/responses', model: 'gpt-5.6-sol', key: () => realOpenAIKey,
    rates: { input: 4.00, cached: 0.40, output: 20.00 }, longContextThreshold: 272000, longInputMultiplier: 2, longOutputMultiplier: 1.5,
  },
  luna: {
    id: 'luna', label: 'OpenAI GPT-5.6 Luna', provider: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/responses', model: 'gpt-5.6-luna', key: () => realOpenAIKey,
    rates: { input: 0.20, cached: 0.02, output: 1.20 }, longContextThreshold: 272000, longInputMultiplier: 2, longOutputMultiplier: 1.5,
  },
  free: {
    id: 'free', label: 'Google Gemini 3.7 Flash free', provider: 'Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', model: 'gemini-3.7-flash', key: () => geminiKey,
    rates: { input: 0, cached: 0, output: 0 }, longContextThreshold: null, longInputMultiplier: 1, longOutputMultiplier: 1,
  },
  openrouter: {
    id: 'openrouter', label: 'OpenRouter experimental', provider: 'OpenRouter',
    endpoint: 'https://openrouter.ai/api/v1/responses', model: 'dots-studio/dots-3-note-preview:free', key: () => openRouterKey,
    rates: { input: 0, cached: 0, output: 0 }, longContextThreshold: null, longInputMultiplier: 1, longOutputMultiplier: 1,
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
  } catch { return PROFILES.sol; }
}

function priceUsage(profile, usage) {
  if (!profile?.rates || !usage) return null;
  const input = Number(usage.input_tokens || usage.prompt_tokens || 0);
  const cached = Math.min(input, Number(usage.input_tokens_details?.cached_tokens || usage.prompt_tokens_details?.cached_tokens || 0));
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
  store.cached_input_tokens += Number(usage.input_tokens_details?.cached_tokens || usage.prompt_tokens_details?.cached_tokens || 0);
  store.cache_write_tokens += Number(usage.input_tokens_details?.cache_write_tokens || 0);
  store.output_tokens += Number(usage.output_tokens || usage.completion_tokens || 0);
  store.reasoning_tokens += Number(usage.output_tokens_details?.reasoning_tokens || usage.completion_tokens_details?.reasoning_tokens || 0);
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
    delete body.store;
    delete body.reasoning;
    delete body.provider;
    headers.set('HTTP-Referer', 'https://evaluador-v5-web.vercel.app');
    headers.set('X-Title', 'Agente Evaluador V5 UCEMA');
  }

  return { url: profile.endpoint, init: { ...init, headers, body: JSON.stringify(body) } };
}

function responsesToolToChat(tool) {
  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description || '',
      parameters: tool.parameters || { type: 'object', properties: {} },
    },
  };
}

function responseFormatToChat(format) {
  if (!format || format.type !== 'json_schema') return undefined;
  return {
    type: 'json_schema',
    json_schema: {
      name: format.name || 'evaluacion_v5',
      strict: format.strict !== false,
      schema: format.schema,
    },
  };
}

function extractAssistantText(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.map(part => typeof part === 'string' ? part : (part?.text || '')).join('');
}

async function geminiAsOpenAIResponses(init, store, baseFetch) {
  let body;
  try { body = JSON.parse(String(init?.body || '{}')); }
  catch { throw new Error('No se pudo interpretar el request al modelo.'); }

  if (!store.gemini_messages) {
    store.gemini_messages = [];
    if (body.instructions) store.gemini_messages.push({ role: 'system', content: String(body.instructions) });
  }

  for (const item of body.input || []) {
    if (item?.type === 'function_call_output') {
      store.gemini_messages.push({ role: 'tool', tool_call_id: item.call_id, content: String(item.output || '') });
    } else if (item?.role) {
      store.gemini_messages.push({ role: item.role, content: typeof item.content === 'string' ? item.content : JSON.stringify(item.content ?? '') });
    }
  }

  const chatBody = {
    model: store.profile.model,
    messages: store.gemini_messages,
    tools: (body.tools || []).map(responsesToolToChat),
    tool_choice: body.tool_choice || 'auto',
    reasoning_effort: body.reasoning?.effort || 'high',
    max_completion_tokens: body.max_output_tokens || 18000,
  };
  const responseFormat = responseFormatToChat(body.text?.format);
  if (responseFormat) chatBody.response_format = responseFormat;

  const r = await baseFetch(store.profile.endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${store.profile.key()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(chatBody),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const errBody = JSON.stringify(data);
    return new Response(errBody, { status: r.status, headers: { 'Content-Type': 'application/json' } });
  }

  const message = data?.choices?.[0]?.message || {};
  store.gemini_messages.push(message);
  const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
  const output = toolCalls.length
    ? toolCalls.map((tc, index) => ({
        type: 'function_call',
        call_id: tc.id || `gemini_call_${store.calls + 1}_${index}`,
        name: tc.function?.name || '',
        arguments: tc.function?.arguments || '{}',
      }))
    : [{ type: 'message', content: [{ type: 'output_text', text: extractAssistantText(message.content) }] }];

  const fake = {
    id: data.id || `gemini-response-${Date.now()}-${store.calls + 1}`,
    model: data.model || store.profile.model,
    output,
    usage: data.usage || {},
  };
  return new Response(JSON.stringify(fake), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

if (!globalThis.__evaluadorV5RouterFetchPatchedV3) {
  const baseFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (...args) => {
    const originalUrl = typeof args[0] === 'string' ? args[0] : String(args[0]?.url || '');
    const store = usageStorage.getStore();
    let response;

    if (store && originalUrl === 'https://api.openai.com/v1/responses' && store.profile.provider === 'Gemini') {
      response = await geminiAsOpenAIResponses(args[1] || {}, store, baseFetch);
    } else {
      let fetchArgs = args;
      if (store && originalUrl === 'https://api.openai.com/v1/responses') {
        const rewritten = rewriteModelRequest(originalUrl, args[1] || {}, store);
        fetchArgs = [rewritten.url, rewritten.init];
      }
      response = await baseFetch(...fetchArgs);
    }

    if (store && originalUrl === 'https://api.openai.com/v1/responses') {
      try {
        const data = await response.clone().json();
        recordUsage(store, data);
        if (!response.ok) console.error('model-provider-error', JSON.stringify({provider:store.profile.provider,model:store.profile.model,status:response.status,error:data?.error||data}));
      } catch {}
    }
    return response;
  };
  globalThis.__evaluadorV5RouterFetchPatchedV3 = true;
}

function usagePayload(store) {
  const p = store.profile;
  return {
    perfil: p.id, proveedor: p.provider, modelo: p.model, modelo_resuelto: store.response_model || p.model,
    llamadas_modelo: store.calls, input_tokens: store.input_tokens, cached_input_tokens: store.cached_input_tokens,
    cache_write_tokens: store.cache_write_tokens, output_tokens: store.output_tokens, reasoning_tokens: store.reasoning_tokens,
    total_tokens: store.total_tokens, costo_estimado_usd: store.cost_known ? Number(store.estimated_cost_usd.toFixed(6)) : null,
    tarifa_usd_por_millon: { entrada: p.rates.input, entrada_cacheada: p.rates.cached, salida: p.rates.output },
    pricing_referencia: p.provider === 'OpenAI' ? 'OpenAI API pricing, 2026-09-08' : p.provider === 'Gemini' ? 'Gemini Developer API Free Tier, 2026-09-08' : 'OpenRouter free model, 2026-09-08',
    nota: p.id === 'free'
      ? 'Perfil gratuito de Gemini sujeto a los límites del Free Tier. Debe calibrarse contra la referencia V5 antes de usarse como corrector final.'
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
    const variable = profile.provider === 'Gemini' ? 'GEMINI_API_KEY' : profile.provider === 'OpenRouter' ? 'OPENROUTER_API_KEY' : 'OPENAI_API_KEY';
    return sendError(res, 503, `Falta configurar ${variable} para usar el perfil ${profile.label}.`);
  }

  const store = {
    profile, response_model: null, calls: 0, input_tokens: 0, cached_input_tokens: 0,
    cache_write_tokens: 0, output_tokens: 0, reasoning_tokens: 0, total_tokens: 0,
    estimated_cost_usd: 0, cost_known: true, gemini_messages: null,
  };

  return usageStorage.run(store, async () => {
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
