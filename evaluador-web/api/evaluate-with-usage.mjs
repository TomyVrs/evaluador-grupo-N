const GEMINI_OPENAI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

if (!globalThis.__evaluadorGeminiCapacityFallbackV1) {
  const priorFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (...args) => {
    const url = typeof args[0] === 'string' ? args[0] : String(args[0]?.url || '');
    const init = args[1] || {};

    if (url === GEMINI_OPENAI_ENDPOINT) {
      let body;
      try { body = JSON.parse(String(init.body || '{}')); } catch {}
      if (body?.model === 'gemini-3.7-flash') {
        const primary = await priorFetch(...args);
        if (primary.status !== 503) return primary;

        console.warn('gemini-capacity-fallback', JSON.stringify({ from: 'gemini-3.7-flash', to: 'gemini-3.5-flash', reason: 'HTTP 503' }));
        body.model = 'gemini-3.5-flash';
        return priorFetch(args[0], { ...init, body: JSON.stringify(body) });
      }
    }

    return priorFetch(...args);
  };
  globalThis.__evaluadorGeminiCapacityFallbackV1 = true;
}

let guardedPromise;

export default async function handler(req, res) {
  guardedPromise ||= import('./evaluate-guarded.mjs');
  const guarded = await guardedPromise;
  return guarded.default(req, res);
}
