import { handleChat } from './_lib/chat.js';

/**
 * POST /api/chat  { messages: [{ role, content }], lang } → { reply }
 * Função serverless da Vercel. A chave do Groq vem das variáveis de ambiente
 * do projeto (Settings → Environment Variables) e nunca vai pro navegador.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  const ip =
    String(req.headers['x-forwarded-for'] ?? '')
      .split(',')[0]
      .trim() || req.socket?.remoteAddress;
  const { status, body } = await handleChat({ body: req.body, ip });
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}
