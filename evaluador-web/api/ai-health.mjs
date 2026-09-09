const GATEWAY_ENDPOINT = 'https://ai-gateway.vercel.sh/v1/chat/completions';
const MODEL = 'openai/gpt-5.6-luna';

function token() {
  return process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || '';
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const auth = token();
  if (!auth) {
    res.statusCode = 503;
    return res.end(JSON.stringify({ ok: false, oidc: false, api_key: false, model: MODEL }));
  }

  if (String(req.query?.live || '') !== '1') {
    res.statusCode = 200;
    return res.end(JSON.stringify({ ok: true, oidc: Boolean(process.env.VERCEL_OIDC_TOKEN), api_key: Boolean(process.env.AI_GATEWAY_API_KEY), model: MODEL }));
  }

  const response = await fetch(GATEWAY_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: 'Respondé únicamente: OK' }],
      max_completion_tokens: 8,
    }),
  });
  const data = await response.json().catch(() => ({}));
  res.statusCode = response.status;
  return res.end(JSON.stringify({ ok: response.ok, status: response.status, model: data.model || MODEL, error: data?.error?.message || null }));
}
