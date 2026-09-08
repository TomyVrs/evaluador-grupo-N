import { AsyncLocalStorage } from 'node:async_hooks';
import evaluate from './evaluate.mjs';

const usageStorage = globalThis.__evaluadorV5UsageStorage || new AsyncLocalStorage();
globalThis.__evaluadorV5UsageStorage = usageStorage;

const PRICES_PER_MILLION = {
  'gpt-5.6-sol': { input: 4.00, cached: 0.40, output: 20.00 },
  'gpt-5.6': { input: 4.00, cached: 0.40, output: 20.00 },
  'gpt-5.6-terra': { input: 2.00, cached: 0.20, output: 12.00 },
  'gpt-5.6-luna': { input: 0.20, cached: 0.02, output: 1.20 },
};

function priceUsage(model, usage) {
  const rates = PRICES_PER_MILLION[model];
  if (!rates || !usage) return null;
  const input = Number(usage.input_tokens || 0);
  const cached = Math.min(input, Number(usage.input_tokens_details?.cached_tokens || 0));
  const uncached = Math.max(0, input - cached);
  const longContext = input > 272000;
  const inputMultiplier = longContext ? 2 : 1;
  const outputMultiplier = longContext ? 1.5 : 1;
  const cost = (
    uncached * rates.input * inputMultiplier +
    cached * rates.cached * inputMultiplier +
    Number(usage.output_tokens || 0) * rates.output * outputMultiplier
  ) / 1_000_000;
  return cost;
}

function recordUsage(store, data) {
  const usage = data?.usage;
  if (!store || !usage) return;
  const model = String(data.model || store.model || process.env.OPENAI_MODEL || 'gpt-5.6-sol');
  store.model = model;
  store.calls += 1;
  store.input_tokens += Number(usage.input_tokens || 0);
  store.cached_input_tokens += Number(usage.input_tokens_details?.cached_tokens || 0);
  store.cache_write_tokens += Number(usage.input_tokens_details?.cache_write_tokens || 0);
  store.output_tokens += Number(usage.output_tokens || 0);
  store.reasoning_tokens += Number(usage.output_tokens_details?.reasoning_tokens || 0);
  store.total_tokens += Number(usage.total_tokens || 0);
  const cost = priceUsage(model, usage);
  if (cost == null) store.cost_known = false;
  else store.estimated_cost_usd += cost;
}

if (!globalThis.__evaluadorV5FetchPatched) {
  const baseFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (...args) => {
    const response = await baseFetch(...args);
    try {
      const url = typeof args[0] === 'string' ? args[0] : String(args[0]?.url || '');
      const store = usageStorage.getStore();
      if (store && url === 'https://api.openai.com/v1/responses') {
        const data = await response.clone().json();
        recordUsage(store, data);
      }
    } catch {}
    return response;
  };
  globalThis.__evaluadorV5FetchPatched = true;
}

function usagePayload(store) {
  const model = store.model || process.env.OPENAI_MODEL || 'gpt-5.6-sol';
  const rates = PRICES_PER_MILLION[model] || null;
  return {
    proveedor: 'OpenAI',
    modelo: model,
    llamadas_modelo: store.calls,
    input_tokens: store.input_tokens,
    cached_input_tokens: store.cached_input_tokens,
    cache_write_tokens: store.cache_write_tokens,
    output_tokens: store.output_tokens,
    reasoning_tokens: store.reasoning_tokens,
    total_tokens: store.total_tokens,
    costo_estimado_usd: store.cost_known ? Number(store.estimated_cost_usd.toFixed(6)) : null,
    tarifa_usd_por_millon: rates ? {
      entrada: rates.input,
      entrada_cacheada: rates.cached,
      salida: rates.output,
    } : null,
    pricing_referencia: 'OpenAI API pricing, 2026-09-08',
    nota: 'Los reasoning_tokens están incluidos dentro de output_tokens y no se suman dos veces. Las llamadas con más de 272K tokens de entrada aplican el multiplicador de contexto largo informado por OpenAI.',
  };
}

export default async function handler(req, res) {
  const store = {
    model: process.env.OPENAI_MODEL || 'gpt-5.6-sol',
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
    const wrappedRes = Object.create(res);
    wrappedRes.end = function end(chunk, encoding, callback) {
      let outgoing = chunk;
      try {
        if (chunk != null) {
          const text = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
          const body = JSON.parse(text);
          if (body && typeof body === 'object' && !body.error) {
            body.uso_api = usagePayload(store);
            outgoing = JSON.stringify(body);
          }
        }
      } catch {}
      return res.end(outgoing, encoding, callback);
    };
    return evaluate(req, wrappedRes);
  });
}
