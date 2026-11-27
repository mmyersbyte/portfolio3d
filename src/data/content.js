/**
 * Todo o conteúdo do portfólio mora aqui.
 * Campos traduzíveis usam { pt, en }.
 *
 * TODO: trocar LinkedIn/Instagram pelos usuários reais e o CV fictício pelo de verdade.
 */

export const profile = {
  name: 'Pedro Victor',
  photo: '/images/profile.jpg',
  role: {
    pt: 'Desenvolvedor backend-first · Node.js & TypeScript',
    en: 'Backend-first developer · Node.js & TypeScript',
  },
};

/** Usuários nas redes (o navegador do notebook usa pra montar as páginas). */
export const socials = {
  github: 'mmyersbyte',
  instagram: 'pedrovictorc',
  linkedin: 'pedrovictorcss',
};

export const links = {
  github: `https://github.com/${socials.github}`,
  linkedin: socials.linkedin
    ? `https://www.linkedin.com/in/${socials.linkedin}`
    : 'https://www.linkedin.com/',
  instagram: `https://www.instagram.com/${socials.instagram}/`,
};

/**
 * Perfil do Instagram como aparece lá (números atualizados à mão:
 * sem a API oficial não dá pra puxar automaticamente).
 */
export const instagramProfile = {
  name: 'Pedro Victor Castro de Sousa',
  pronouns: { pt: 'ele/dele', en: 'he/him' },
  bio: 'Fortaleza, 🇧🇷',
  posts: 4,
  followers: 735,
  following: 371,
};

/**
 * Posts do Instagram mostrados no navegador (embed oficial), do mais recente
 * pro mais antigo. Pra adicionar: cole o link do post (sem o ?img_index).
 */
export const instagramPosts = [
  'https://www.instagram.com/p/DeUU8MYEdZE/',
  'https://www.instagram.com/p/DbEXG39DyZI/',
  'https://www.instagram.com/p/DaslNBmERXN/',
  'https://www.instagram.com/p/C-xrTZCRNFI/',
];

/** Dados do LinkedIn (como aparecem lá). */
export const linkedinProfile = {
  name: 'Pedro Victor Castro de Sousa',
  pronouns: { pt: 'Ele/Dele', en: 'He/Him' },
  headline: 'Desenvolvedor de Software | Java | JavaScript | Node.js',
  location: { pt: 'Fortaleza, Ceará, Brasil', en: 'Fortaleza, Ceará, Brazil' },
  company: 'Mind Tecnologia I.A',
  school: 'Unichristus',
  connections: { pt: '+500 conexões', en: '500+ connections' },
};

/**
 * CV com dados reais (LinkedIn + GitHub). Campos que eu ainda não sei
 * (cargo/período exatos, curso) ficam de fora em vez de inventados.
 */
export const cv = {
  placeholder: false,
  summary: {
    pt: 'Desenvolvedor backend-first em Fortaleza, focado em Node.js e TypeScript. Gosto de APIs seguras e bem documentadas: autenticação com cookies httpOnly, validação com Zod/Joi, testes com Vitest, Swagger e deploy com Docker. Tenho sistemas no ar sendo usados de verdade.',
    en: 'Backend-first developer from Fortaleza, focused on Node.js and TypeScript. I like secure, well-documented APIs: httpOnly cookie auth, Zod/Joi validation, Vitest tests, Swagger and Docker deploys. I have systems live and in real use.',
  },
  experience: [
    {
      role: { pt: 'Desenvolvedor de Software', en: 'Software Developer' },
      company: 'Mind Tecnologia I.A',
      period: { pt: 'atual', en: 'present' },
    },
    {
      role: { pt: 'Desenvolvedor freelancer', en: 'Freelance Developer' },
      company: 'LABEM · UNISUL',
      period: { pt: '2025', en: '2025' },
      bullets: {
        pt: [
          'Sistema em produção usado pela Liga Acadêmica de Biomedicina Estética da UNISUL.',
          'API em Node.js/Express + MongoDB com JWT em cookies httpOnly, upload de PDFs e logs com Winston.',
        ],
        en: [
          "Production system used by UNISUL's Aesthetic Biomedicine academic league.",
          'Node.js/Express + MongoDB API with JWT in httpOnly cookies, PDF uploads and Winston logging.',
        ],
      },
    },
  ],
  education: [{ school: 'Unichristus' }],
  // stack real (LinkedIn + README do GitHub + projetos)
  skills: [
    'Java',
    'JavaScript',
    'TypeScript',
    'Node.js',
    'Express',
    'PostgreSQL',
    'MongoDB',
    'Vitest',
    'Docker',
    'React Native',
    'Zod',
    'Swagger',
    'AWS S3',
    'Three.js',
  ],
  languages: {
    pt: ['Português — nativo'],
    en: ['Portuguese — native'],
  },
};

/**
 * Destaques dos projetos (selos coloridos). `tone` define a cor:
 * solo (laranja) · users (verde) · live (azul) · freelance (roxo) · academic (amarelo) · personal (rosa)
 */
const hl = (tone, pt, en) => ({ tone, label: { pt, en } });
// todos os projetos foram feitos por mim, do zero
const SOLO = hl('solo', 'Feito sozinho', 'Built solo');

/** Projetos (tirados dos repositórios fixados no GitHub). */
export const projects = [
  {
    title: 'Eco Histórias',
    highlights: [
      SOLO,
      hl('users', '100+ usuários', '100+ users'),
      hl('users', '50+ histórias publicadas', '50+ stories published'),
      hl('live', 'No ar', 'Live'),
    ],
    description: {
      pt: 'Rede social pra contar histórias de forma anônima.',
      en: 'Social network to share stories anonymously.',
    },
    tags: ['TypeScript', 'Express', 'PostgreSQL', 'Knex', 'Vitest', 'Docker'],
    repo: 'https://github.com/mmyersbyte/eco',
    demo: 'https://ecohistorias.com.br/',
  },
  {
    title: 'LABEM',
    highlights: [
      SOLO,
      hl('freelance', 'Freelance', 'Freelance'),
      hl('users', 'Usado por uma equipe real', 'Used by a real team'),
      hl('live', 'Em produção', 'In production'),
    ],
    description: {
      pt: 'Sistema de gestão da Liga de Biomedicina Estética da UNISUL.',
      en: "Management system for UNISUL's Aesthetic Biomedicine league.",
    },
    tags: ['Node.js', 'Express', 'MongoDB', 'JWT', 'Multer', 'Winston'],
    repo: 'https://github.com/mmyersbyte/labem',
    demo: 'https://www.labemunisul.com.br/',
  },
  {
    title: 'Desatende',
    highlights: [SOLO, hl('academic', 'Projeto acadêmico', 'Academic project')],
    description: {
      pt: 'App pra registrar reclamações de atendimento e as empresas responderem.',
      en: 'App to report poor customer service and let companies reply.',
    },
    tags: ['React Native', 'Node.js', 'Express', 'MongoDB', 'Joi'],
    repo: 'https://github.com/mmyersbyte/appdesatende',
  },
  {
    title: 'WittyWidget Server',
    highlights: [SOLO, hl('personal', 'App pessoal', 'Personal app')],
    description: {
      pt: 'Uma expressão em inglês por dia, pra um widget de Android.',
      en: 'One English expression a day, for an Android widget.',
    },
    tags: ['TypeScript', 'Express', 'MongoDB', 'Zod', 'Swagger'],
    repo: 'https://github.com/mmyersbyte/WittyWidgetServer',
  },
  {
    title: 'Portfolio 3D',
    highlights: [SOLO, hl('personal', 'Você está aqui', 'You are here')],
    description: {
      pt: 'Este quarto aqui, feito com Three.js puro.',
      en: 'This very room, built with vanilla Three.js.',
    },
    tags: ['Three.js', 'Vite', 'Web Audio'],
    repo: 'https://github.com/mmyersbyte/portfolio3d',
  },
];
