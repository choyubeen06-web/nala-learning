// NALA shared storage API — Vercel Serverless Function backed by Upstash Redis (REST).
// Connect "Upstash for Redis" from the Vercel Marketplace; it sets KV_REST_API_URL and KV_REST_API_TOKEN.
// Without those variables the API reports {enabled:false} and the app saves data in each browser instead.
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const HASH = process.env.NALA_KEY || 'nala:docs';
const PATH_RE = /^(nala\/config|learners\/[A-Za-z0-9_-]{1,64})$/;
const MAX = 256 * 1024;

async function redis(cmd) {
  const r = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || `Redis HTTP ${r.status}`);
  return j.result;
}

async function readBody(req) {
  if (req.body !== undefined && req.body !== null) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > MAX + 1024) throw new Error('too large'); }
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!REDIS_URL || !REDIS_TOKEN) return res.status(200).json({ enabled: false });
  try {
    if (req.method === 'GET') {
      const arr = (await redis(['HGETALL', HASH])) || [];
      const docs = {};
      for (let i = 0; i < arr.length; i += 2) docs[arr[i]] = arr[i + 1];
      return res.status(200).json({ enabled: true, docs });
    }
    const path = String((req.query && req.query.path) || new URL(req.url, 'http://x').searchParams.get('path') || '');
    if (!PATH_RE.test(path)) return res.status(400).json({ error: 'invalid path' });
    if (req.method === 'PUT') {
      const body = await readBody(req);
      const json = body && body.json;
      if (typeof json !== 'string' || json.length > MAX) return res.status(400).json({ error: 'invalid body' });
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return res.status(400).json({ error: 'invalid document' });
      await redis(['HSET', HASH, path, json]);
      return res.status(200).json({ ok: true });
    }
    if (req.method === 'DELETE') {
      await redis(['HDEL', HASH, path]);
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, PUT, DELETE');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(e instanceof SyntaxError ? 400 : 500).json({ error: String((e && e.message) || e) });
  }
}
