import router from './evaluate-router.mjs';

export default async function handler(req, res) {
  const wrappedRes = {
    get statusCode() { return res.statusCode; },
    set statusCode(value) { res.statusCode = value; },
    setHeader(name, value) { return res.setHeader(name, value); },
    getHeader(name) { return res.getHeader?.(name); },
    end(chunk, encoding, callback) {
      let outgoing = chunk;
      try {
        if (chunk != null && res.statusCode < 400) {
          const text = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
          const body = JSON.parse(text);
          const calls = Number(body?.uso_api?.llamadas_modelo || 0);
          if (body && !body.error && calls < 2) {
            res.statusCode = 502;
            outgoing = JSON.stringify({
              error: 'La evaluación fue descartada porque el modelo intentó puntuar sin inspeccionar evidencia mediante herramientas de lectura.',
              codigo: 'EVIDENCE_NOT_READ',
            });
          }
        }
      } catch {}
      return res.end(outgoing, encoding, callback);
    },
  };
  return router(req, wrappedRes);
}
