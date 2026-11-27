/**
 * Contador de visitas guardado num Redis da Upstash (plano free, pela Vercel:
 * Storage → Upstash Redis). Usa a API REST, sem SDK.
 *
 * Variáveis (a integração da Vercel cria sozinha; aceita os dois nomes):
 *   KV_REST_API_URL / UPSTASH_REDIS_REST_URL
 *   KV_REST_API_TOKEN / UPSTASH_REDIS_REST_TOKEN
 *
 * POST soma 1 e devolve o total · GET só devolve o total.
 * (o navegador manda POST no máximo 1x por dia, ver src/services/visits.js)
 */
// VISITS_KEY permite separar contadores (o `pnpm dev` usa um próprio, pra não inflar o real)
const KEY = 'portfolio3d:visits';
const TIMEOUT_MS = 4000;

export async function handleVisits({ method, env = process.env }) {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return { status: 503, body: { error: 'counter_unavailable' } };
  if (method !== 'GET' && method !== 'POST')
    return { status: 405, body: { error: 'method_not_allowed' } };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const op = method === 'POST' ? 'incr' : 'get';
    const res = await fetch(`${url.replace(/\/$/, '')}/${op}/${env.VISITS_KEY || KEY}`, {
      method: 'POST',
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error(`[visits] redis respondeu ${res.status}`);
      return { status: 502, body: { error: 'upstream_error' } };
    }
    const { result } = await res.json();
    return { status: 200, body: { count: Number(result) || 0 } };
  } catch (err) {
    console.error(`[visits] falha no redis: ${err.name}`);
    return { status: 504, body: { error: 'upstream_timeout' } };
  } finally {
    clearTimeout(timer);
  }
}
