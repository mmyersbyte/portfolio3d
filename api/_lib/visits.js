/**
 * Contador de visitas guardado num Redis da Upstash (plano free, pela Vercel:
 * Storage → Upstash Redis). Usa a API REST, sem SDK.
 *
 * Variáveis (a integração da Vercel cria sozinha; aceita os dois nomes):
 *   KV_REST_API_URL / UPSTASH_REDIS_REST_URL
 *   KV_REST_API_TOKEN / UPSTASH_REDIS_REST_TOKEN
 *
 * POST soma 1 · GET só lê. Os dois devolvem { count (total), today (hoje em Brasília) }.
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

  const key = env.VISITS_KEY || KEY;
  const dayKey = `${key}:${brasiliaDay()}`;
  // pipeline: tudo numa ida só ao Redis. Nada expira: o total e o contador de
  // cada dia ficam guardados pra sempre (dá até pra montar um histórico depois)
  const commands =
    method === 'POST'
      ? [
          ['INCR', key],
          ['INCR', dayKey],
        ]
      : [
          ['GET', key],
          ['GET', dayKey],
        ];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
      method: 'POST',
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(commands),
    });
    if (!res.ok) {
      console.error(`[visits] redis respondeu ${res.status}`);
      return { status: 502, body: { error: 'upstream_error' } };
    }
    const [total, today] = await res.json();
    return {
      status: 200,
      body: { count: Number(total?.result) || 0, today: Number(today?.result) || 0 },
    };
  } catch (err) {
    console.error(`[visits] falha no redis: ${err.name}`);
    return { status: 504, body: { error: 'upstream_timeout' } };
  } finally {
    clearTimeout(timer);
  }
}

/** Data de hoje em Brasília (AAAA-MM-DD), pro contador "hoje" virar à meia-noite daqui. */
function brasiliaDay(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(date);
}
