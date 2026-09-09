const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const GATEWAY_ENDPOINT = 'https://ai-gateway.vercel.sh/v1/chat/completions';
const FREE_MODEL = 'gemini-3.5-flash';
const LUNA_MODEL = 'openai/gpt-5.6-luna';
const SOL_MODEL = 'openai/gpt-5.6-sol';

function geminiKey() {
  const key = process.env.GEMINI_API_KEY || '';
  return key === '__vercel_ai_gateway__' ? '' : key;
}

function gatewayKey() {
  return process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || '';
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  const free = geminiKey();
  const gateway = gatewayKey();
  if (!free && !gateway) {
    res.statusCode = 503;
    return res.end(JSON.stringify({ ok: false, free_key: false, gateway_key: false, route: [FREE_MODEL, LUNA_MODEL, SOL_MODEL] }));
  }

  if (String(req.query?.live || '') !== '1') {
    res.statusCode = 200;
    return res.end(JSON.stringify({
      ok: true,
      free_key: Boolean(free),
      gateway_key: Boolean(gateway),
      oidc: Boolean(process.env.VERCEL_OIDC_TOKEN),
      route: [FREE_MODEL, LUNA_MODEL, SOL_MODEL],
    }));
  }

  const attempts = [];
  if (free) {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${free}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: FREE_MODEL,
        messages: [{ role: 'user', content: 'Respondé únicamente: OK' }],
        max_completion_tokens: 8,
      }),
    });
    const data = await response.json().catch(() => ({}));
    attempts.push({ provider: 'Google Gemini Free Tier', model: data.model || FREE_MODEL, status: response.status });
    if (response.ok) {
      res.statusCode = 200;
      return res.end(JSON.stringify({ ok: true, provider: 'Google Gemini Free Tier', model: data.model || FREE_MODEL, cost_usd: 0, attempts }));
    }
  }

  if (gateway) {
    const response = await fetch(GATEWAY_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${gateway}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LUNA_MODEL,
        models: [SOL_MODEL],
        messages: [{ role: 'user', content: 'Respondé únicamente: OK' }],
        max_completion_tokens: 8,
      }),
    });
    const data = await response.json().catch(() => ({}));
    attempts.push({ provider: 'Vercel AI Gateway', model: data.model || LUNA_MODEL, status: response.status });
    res.statusCode = response.status;
    return res.end(JSON.stringify({
      ok: response.ok,
      provider: response.ok ? 'Vercel AI Gateway' : null,
      model: data.model || LUNA_MODEL,
      attempts,
      error: data?.error?.message || null,
    }));
  }

  res.statusCode = 503;
  return res.end(JSON.stringify({ ok: false, attempts, error: 'El modelo gratuito falló y no hay AI Gateway disponible.' }));
}
