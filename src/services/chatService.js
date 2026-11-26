import { links, projects, cv } from '../data/content.js';

/**
 * Camada do chat. Hoje responde com mock; quando o backend (Groq) existir,
 * basta definir VITE_CHAT_ENDPOINT e ele faz POST { messages, lang } → { reply }.
 */
const ENDPOINT = import.meta.env.VITE_CHAT_ENDPOINT;

export async function askAvatar(messages, lang) {
  if (ENDPOINT) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, lang }),
    });
    if (!res.ok) throw new Error(`chat ${res.status}`);
    const data = await res.json();
    return data.reply;
  }
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 700));
  return mockReply(messages.at(-1)?.content ?? '', lang);
}

const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const RULES = [
  {
    match: /\b(oi|ola|eai|e ai|hey|hello|hi|salve|bom dia|boa tarde|boa noite)\b/,
    pt: () => 'Opa! Tudo certo? Pergunta o que quiser 😄',
    en: () => "Hey! What's up? Ask me anything 😄",
  },
  {
    match: /(quem|who|sobre voce|about you|apresenta)/,
    pt: () =>
      `Sou o Pedro, dev full stack. Curto JavaScript, Node e coisas 3D como esse quarto. ${cv.summary.pt}`,
    en: () =>
      `I'm Pedro, a full stack dev. I love JavaScript, Node and 3D stuff like this room. ${cv.summary.en}`,
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
    pt: () => `Meu dia a dia: ${cv.skills.slice(0, 7).join(', ')}.`,
    en: () => `My daily stack: ${cv.skills.slice(0, 7).join(', ')}.`,
  },
  {
    match: /(contato|contact|linkedin|insta|email|falar|reach|github)/,
    pt: () =>
      `Me acha aqui:\nGitHub: ${links.github}\nLinkedIn: ${links.linkedin}\nInstagram: ${links.instagram}`,
    en: () =>
      `Find me here:\nGitHub: ${links.github}\nLinkedIn: ${links.linkedin}\nInstagram: ${links.instagram}`,
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
