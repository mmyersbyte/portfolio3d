/**
 * Todo o conteúdo do portfólio mora aqui.
 * Campos traduzíveis usam { pt, en }.
 *
 * TODO: trocar LinkedIn/Instagram pelos usuários reais e o CV fictício pelo de verdade.
 */

export const profile = {
  name: 'Pedro Victor',
  role: {
    pt: 'Desenvolvedor backend-first · Node.js & TypeScript',
    en: 'Backend-first developer · Node.js & TypeScript',
  },
};

/** Usuários nas redes (o navegador do notebook usa pra montar as páginas). */
export const socials = {
  github: 'mmyersbyte',
  instagram: 'pedrovictorc',
  linkedin: null, // TODO: seu usuário do LinkedIn (o que vem depois de /in/)
};

export const links = {
  github: `https://github.com/${socials.github}`,
  linkedin: socials.linkedin
    ? `https://www.linkedin.com/in/${socials.linkedin}`
    : 'https://www.linkedin.com/',
  instagram: `https://www.instagram.com/${socials.instagram}/`,
};

/**
 * Posts do Instagram pra mostrar no navegador (embed oficial do Instagram).
 * Cole aqui links de posts, ex: 'https://www.instagram.com/p/ABC123/'.
 * Vazio = mostra só o perfil com o botão pra abrir no Instagram.
 */
export const instagramPosts = [];

export const cv = {
  placeholder: true,
  summary: {
    pt: 'Desenvolvedor backend-first em Fortaleza, focado em Node.js e TypeScript. Gosto de APIs seguras e bem documentadas: autenticação com cookies httpOnly, validação com Zod/Joi, testes com Vitest, Swagger e deploy com Docker. Tenho sistemas no ar sendo usados de verdade.',
    en: 'Backend-first developer from Fortaleza, focused on Node.js and TypeScript. I like secure, well-documented APIs: httpOnly cookie auth, Zod/Joi validation, Vitest tests, Swagger and Docker deploys. I have systems live and in real use.',
  },

  experience: [
    {
      role: { pt: 'Desenvolvedor Full Stack', en: 'Full Stack Developer' },
      company: 'Nebula Labs',
      period: { pt: '2024 — atual', en: '2024 — present' },
      bullets: {
        pt: [
          'APIs REST e WebSocket em Node.js atendendo milhares de usuários diários.',
          'Migração de front-end legado para Vite + componentes modernos, reduzindo o bundle em 40%.',
        ],
        en: [
          'Built REST and WebSocket APIs in Node.js serving thousands of daily users.',
          'Migrated a legacy front-end to Vite + modern components, cutting bundle size by 40%.',
        ],
      },
    },
    {
      role: { pt: 'Desenvolvedor Front-end', en: 'Front-end Developer' },
      company: 'Estúdio Aurora',
      period: { pt: '2022 — 2024', en: '2022 — 2024' },
      bullets: {
        pt: [
          'Landing pages interativas com Three.js e animações em WebGL.',
          'Criação de um design system usado em 6 produtos.',
        ],
        en: [
          'Interactive landing pages with Three.js and WebGL animations.',
          'Created a design system used across 6 products.',
        ],
      },
    },
  ],
  education: [
    {
      course: {
        pt: 'Análise e Desenvolvimento de Sistemas',
        en: 'Systems Analysis and Development',
      },
      school: 'Universidade Exemplo',
      period: '2020 — 2023',
    },
  ],
  // stack real (README do GitHub + projetos)
  skills: [
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
    pt: ['Português — nativo', 'Inglês — avançado'],
    en: ['Portuguese — native', 'English — advanced'],
  },
};

/** Projetos (tirados dos repositórios fixados no GitHub). */
export const projects = [
  {
    title: 'Eco Histórias',
    description: {
      pt: 'Rede para contar histórias de forma anônima, com codinomes e avatares fixos. API com JWT em cookies httpOnly, recuperação de senha por e-mail, avatares no S3 e deploy com Docker.',
      en: 'A network to share stories anonymously, with fixed codenames and avatars. API with JWT in httpOnly cookies, email password recovery, avatars on S3 and Docker deploys.',
    },
    tags: ['TypeScript', 'Express', 'PostgreSQL', 'Knex', 'Vitest', 'Docker'],
    repo: 'https://github.com/mmyersbyte/eco',
    demo: 'https://ecohistorias.com.br/',
  },
  {
    title: 'LABEM',
    description: {
      pt: 'Sistema da Liga Acadêmica de Biomedicina Estética da UNISUL: painéis por perfil, eventos, upload de PDFs e parcerias. Em produção, usado pela liga.',
      en: "Management system for UNISUL's Aesthetic Biomedicine academic league: role-based dashboards, events, PDF uploads and partnerships. Live and used by the league.",
    },
    tags: ['Node.js', 'Express', 'MongoDB', 'JWT', 'Multer', 'Winston'],
    repo: 'https://github.com/mmyersbyte/labem',
    demo: 'https://www.labemunisul.com.br/',
  },
  {
    title: 'Desatende',
    description: {
      pt: 'App pra registrar reclamações de atendimento (restaurantes, faculdades, companhias aéreas…) e as empresas responderem publicamente. Feito sozinho, do app à API.',
      en: 'App to report poor customer service (restaurants, colleges, airlines…) where companies answer publicly. Built solo, from the app to the API.',
    },
    tags: ['React Native', 'Node.js', 'Express', 'MongoDB', 'Joi'],
    repo: 'https://github.com/mmyersbyte/appdesatende',
  },
  {
    title: 'WittyWidget Server',
    description: {
      pt: 'API de microaprendizado de inglês: uma expressão por dia, com significado e exemplos, pensada pra um widget de Android.',
      en: 'English micro-learning API: one expression a day, with meaning and examples, built for an Android widget.',
    },
    tags: ['TypeScript', 'Express', 'MongoDB', 'Zod', 'Swagger'],
    repo: 'https://github.com/mmyersbyte/WittyWidgetServer',
  },
  {
    title: 'Portfolio 3D',
    description: {
      pt: 'Este quarto aqui! Three.js puro, câmera isométrica, gato com pathfinding, clima na hora de Brasília e lo-fi gerado no navegador.',
      en: 'This very room! Vanilla Three.js, isometric camera, a cat with pathfinding, Brasília-time weather and lo-fi generated in the browser.',
    },
    tags: ['Three.js', 'Vite', 'Web Audio'],
    repo: 'https://github.com/mmyersbyte/portfolio3d',
  },
];
