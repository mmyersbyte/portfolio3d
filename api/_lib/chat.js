import { buildSystemPrompt } from './knowledge.js';

/**
 * Núcleo do chat, independente de servidor: a função da Vercel (api/chat.js)
 * e o plugin do Vite no `pnpm dev` só adaptam req/res e chamam isto.
 *
 * Variáveis de ambiente:
 *   GROQ_API_KEY   (obrigatória) — fica só no servidor
 *   GROQ_MODEL     (opcional)    — padrão: openai/gpt-oss-120b
 *   GROQ_BASE_URL  (opcional)    — útil pra testes
 */

// em ordem de preferência: se um modelo falhar (fora do ar, limite do plano), tenta o próximo
const FALLBACK_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];
const DEFAULT_BASE = 'https://api.groq.com/openai/v1';
const MAX_MESSAGES = 12; // histórico enviado pro modelo
const MAX_CHARS = 1200; // por mensagem
const TIMEOUT_MS = 9000; // abaixo do limite de 10 s das funções da Vercel (plano free)

// limite por IP (melhor esforço: em serverless cada instância tem a sua memória)
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 30;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.start > WINDOW_MS) {
    hits.set(ip, { start: now, count: 1 });
    if (hits.size > 5000) hits.clear(); // não deixa o mapa crescer pra sempre
    return false;
  }
  entry.count++;
  return entry.count > MAX_PER_WINDOW;
}

/** Valida e limpa o histórico vindo do navegador (nunca confia no cliente). */
function sanitize(body) {
  if (!body || !Array.isArray(body.messages)) return null;
  const messages = body.messages
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim(),
    )
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_CHARS) }));
  if (!messages.length || messages.at(-1).role !== 'user') return null;
  const lang = body.lang === 'en' ? 'en' : 'pt';
  return { messages, lang };
}

/**
 * @returns {Promise<{ status: number, body: object }>}
 */
export async function handleChat({ body, ip = 'unknown', env = process.env }) {
  if (!env.GROQ_API_KEY) return { status: 503, body: { error: 'chat_unavailable' } };
  if (rateLimited(ip)) return { status: 429, body: { error: 'too_many_requests' } };

  const input = sanitize(body);
  if (!input) return { status: 400, body: { error: 'invalid_request' } };

  const models = [...new Set([env.GROQ_MODEL, ...FALLBACK_MODELS].filter(Boolean))];
  const messages = [{ role: 'system', content: buildSystemPrompt(input.lang) }, ...input.messages];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    for (const model of models) {
      const res = await fetch(`${env.GROQ_BASE_URL || DEFAULT_BASE}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.6,
          max_completion_tokens: 700,
          // modelos gpt-oss "pensam" antes: pouco raciocínio = resposta rápida,
          // e o raciocínio não volta junto do texto
          ...(model.startsWith('openai/gpt-oss')
            ? { reasoning_effort: 'low', include_reasoning: false }
            : {}),
        }),
      });
      // modelo fora do ar (404), no limite do plano (429) ou instável (5xx): tenta o próximo
      if (res.status === 404 || res.status === 429 || res.status >= 500) {
        console.error(`[chat] ${model} indisponível agora (${res.status})`);
        continue;
      }
      if (!res.ok) {
        // loga só o status (nunca a chave nem o conteúdo da conversa)
        console.error(`[chat] groq respondeu ${res.status}`);
        return { status: 502, body: { error: 'upstream_error' } };
      }
      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content?.trim();
      if (!reply) return { status: 502, body: { error: 'empty_reply' } };
      return { status: 200, body: { reply } };
    }
    return { status: 502, body: { error: 'no_model_available' } };
  } catch (err) {
    console.error(`[chat] falha ao chamar o groq: ${err.name}`);
    return { status: 504, body: { error: 'upstream_timeout' } };
  } finally {
    clearTimeout(timer);
  }
}
