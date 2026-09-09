const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const GATEWAY_ENDPOINT = 'https://ai-gateway.vercel.sh/v1/chat/completions';
const FREE_GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.6-flash'];
const LUNA_MODEL = 'openai/gpt-5.6-luna';
const SOL_MODEL = 'openai/gpt-5.6-sol';

function geminiKey() {
  const key = process.env.GEMINI_API_KEY || '';
  return key.startsWith('__') ? '' : key;
}

function gatewayKey() {
  return process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || '';
}

function route() {
  return [...FREE_GEMINI_MODELS, LUNA_MODEL, SOL_MODEL];
}

async function probe(url, key, model, provider) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'Respondé únicamente: OK' }],
      max_completion_tokens: 8,
    }),
  });
  const data = await response.json().catch(() => ({}));
  return { response, data, attempt: { provider, model: data.model || model, status: response.status } };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  const gemini = geminiKey();
  const gateway = gatewayKey();
  if (!gemini && !gateway) {
    res.statusCode = 503;
    return res.end(JSON.stringify({ ok: false, gemini_key: false, gateway_key: false, route: route() }));
  }

  if (String(req.query?.live || '') !== '1') {
    res.statusCode = 200;
    return res.end(JSON.stringify({
      ok: true,
      gemini_key: Boolean(gemini),
      gateway_key: Boolean(gateway),
      oidc: Boolean(process.env.VERCEL_OIDC_TOKEN),
      route: route(),
    }));
  }

  const attempts = [];
  if (gemini) {
    for (const model of FREE_GEMINI_MODELS) {
      const result = await probe(GEMINI_ENDPOINT, gemini, model, 'Google Gemini Free Tier');
      attempts.push(result.attempt);
      if (result.response.ok) {
        res.statusCode = 200;
        return res.end(JSON.stringify({ ok: true, provider: 'Google Gemini Free Tier', model: result.data.model || model, cost_usd: 0, attempts }));
      }
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
    if (response.ok) {
      res.statusCode = 200;
      return res.end(JSON.stringify({ ok: true, provider: 'Vercel AI Gateway', model: data.model || LUNA_MODEL, attempts }));
    }
  }

  res.statusCode = 503;
  return res.end(JSON.stringify({ ok: false, attempts, error: 'La capacidad de evaluación está temporalmente ocupada.' }));
}
