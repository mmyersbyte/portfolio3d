import { links, projects, allSkills } from '../data/content.js';

/**
 * Camada do chat: pergunta pra IA (backend /api/chat, que fala com o Groq).
 * Se o backend não existir ou falhar (sem chave, fora do ar, limite...),
 * cai nas respostas prontas daqui de baixo — o chat nunca fica quebrado.
 * VITE_CHAT_ENDPOINT troca o endereço; "off" desliga a IA de vez.
 */
const ENDPOINT = import.meta.env.VITE_CHAT_ENDPOINT || '/api/chat';

export async function askAvatar(messages, lang) {
  if (ENDPOINT !== 'off') {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, lang }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reply) return data.reply;
      }
    } catch {
      /* sem backend: usa as respostas prontas */
    }
  }
  await new Promise((r) => setTimeout(r, 400 + Math.random() * 500));
  return mockReply(messages.at(-1)?.content ?? '', lang);
}

const normalize = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const RULES = [
  {
    match: /\b(oi|ola|eai|e ai|hey|hello|hi|salve|bom dia|boa tarde|boa noite)\b/,
    pt: () => 'Opa! Tudo certo? Pergunta o que quiser 😄',
    en: () => "Hey! What's up? Ask me anything 😄",
  },
  {
    match: /(quem|who|sobre voce|about you|apresenta)/,
    pt: () =>
      `Sou o Pedro, dev backend-first de Fortaleza. Meu forte é Node.js e TypeScript, mas também curto coisas 3D como esse quarto.`,
    en: () =>
      `I'm Pedro, a backend-first dev from Fortaleza. Node.js and TypeScript are my thing, but I also enjoy 3D stuff like this room.`,
  },
  {
    match: /(projet|project|portfolio|trabalho|work)/,
    pt: () =>
      `Alguns projetos: ${projects.map((p) => p.title).join(', ')}. Clica no notebook em cima da mesa pra ver os detalhes!`,
    en: () =>
      `Some projects: ${projects.map((p) => p.title).join(', ')}. Click the laptop on the desk for details!`,
  },
  {
    match: /(tecnolog|stack|linguage|tech|skill|habilidade|ferramenta|tool)/,
    pt: () => `Meu dia a dia: ${allSkills('pt').slice(5, 14).join(', ')}.`,
    en: () => `My daily stack: ${allSkills('en').slice(5, 14).join(', ')}.`,
  },
  {
    match:
      /(contato|contact|linkedin|insta|email|e-mail|falar|reach|github|vaga|job|contrat|hire|oportunidade)/,
    pt: () =>
      `Tô aberto a processos seletivos! Me acha aqui:\nE-mail: ${links.email}\nLinkedIn: ${links.linkedin}\nGitHub: ${links.github}\nInstagram: ${links.instagram}`,
    en: () =>
      `I'm open to hiring processes! Find me here:\nEmail: ${links.email}\nLinkedIn: ${links.linkedin}\nGitHub: ${links.github}\nInstagram: ${links.instagram}`,
  },
  {
    match: /(gato|cat|gatinho|kitty)/,
    pt: () =>
      'O gato manda no quarto. Ele passeia, senta do meu lado e de vez em quando sobe na cama pra tirar um cochilo 🐈‍⬛',
    en: () =>
      'The cat runs this room. He wanders around, sits next to me and sometimes jumps on the bed for a nap 🐈‍⬛',
  },
  {
    match: /(cv|curriculo|resume|experiencia|experience)/,
    pt: () => 'Meu currículo tá no post-it amarelo na parede (ou no botão CV ali embaixo).',
    en: () => 'My resume is on the yellow post-it on the wall (or the Resume button below).',
  },
];

function mockReply(text, lang) {
  const q = normalize(text);
  const rule = RULES.find((r) => r.match.test(q));
  if (rule) return rule[lang]();
  return lang === 'pt'
    ? 'Boa pergunta! Ainda tô aprendendo a responder tudo. Em breve vou ter uma IA de verdade aqui. Enquanto isso, pergunta sobre projetos, stack ou contato.'
    : "Good question! I'm still learning to answer everything. A real AI is coming soon. Meanwhile, ask about projects, stack or contact.";
}
