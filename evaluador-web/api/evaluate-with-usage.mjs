const GEMINI_OPENAI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const GEMINI_FREE_MODEL = 'gemini-3.5-flash';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function retryDelayMs(data, fallbackMs = 25000) {
  const details = data?.error?.details || data?.[0]?.error?.details || [];
  const retry = details.find(x => String(x?.['@type'] || '').includes('RetryInfo'))?.retryDelay;
  const m = String(retry || '').match(/([0-9.]+)s/i);
  if (m) return Math.min(45000, Math.max(1000, Math.ceil(Number(m[1]) * 1000) + 1000));
  const message = data?.error?.message || data?.[0]?.error?.message || '';
  const mm = String(message).match(/retry\s+in\s+([0-9.]+)s/i);
  if (mm) return Math.min(45000, Math.max(1000, Math.ceil(Number(mm[1]) * 1000) + 1000));
  return fallbackMs;
}

if (!globalThis.__evaluadorGeminiCapacityFallbackV2) {
  const priorFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (...args) => {
    const url = typeof args[0] === 'string' ? args[0] : String(args[0]?.url || '');
    const init = args[1] || {};

    if (url === GEMINI_OPENAI_ENDPOINT) {
      let body;
      try { body = JSON.parse(String(init.body || '{}')); } catch {}

      // Durante calibración usamos directamente 3.5 Flash: evita gastar requests
      // intentando primero un 3.7 saturado y conserva el Free Tier.
      if (body?.model === 'gemini-3.7-flash') body.model = GEMINI_FREE_MODEL;
      const requestArgs = [args[0], { ...init, body: JSON.stringify(body || {}) }];

      for (let attempt = 0; attempt < 3; attempt++) {
        const response = await priorFetch(...requestArgs);
        if (response.status !== 429) return response;

        let data = {};
        try { data = await response.clone().json(); } catch {}
        if (attempt === 2) return response;

        const waitMs = retryDelayMs(data);
        console.warn('gemini-rate-limit-retry', JSON.stringify({ model: body?.model, attempt: attempt + 1, wait_ms: waitMs }));
        await sleep(waitMs);
      }
    }

    return priorFetch(...args);
  };
  globalThis.__evaluadorGeminiCapacityFallbackV2 = true;
}

let guardedPromise;

export default async function handler(req, res) {
  guardedPromise ||= import('./evaluate-guarded.mjs');
  const guarded = await guardedPromise;
  return guarded.default(req, res);
}
