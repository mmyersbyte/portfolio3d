/**
 * Todo o conteúdo do portfólio mora aqui.
 * Campos traduzíveis usam { pt, en }.
 *
 * TODO: trocar LinkedIn/Instagram pelos usuários reais e o CV fictício pelo de verdade.
 */

export const profile = {
  name: 'Pedro Victor',
  role: { pt: 'Desenvolvedor Full Stack · JS & Node', en: 'Full Stack Developer · JS & Node' },
};

export const links = {
  github: 'https://github.com/mmyersbyte',
  linkedin: 'https://www.linkedin.com/in/SEU-USUARIO',
  instagram: 'https://www.instagram.com/SEU-USUARIO',
};

export const cv = {
  placeholder: true,
  summary: {
    pt: 'Desenvolvedor full stack apaixonado por JavaScript, Node.js e interfaces que dão vontade de clicar. Gosto de transformar ideias em produtos rápidos, acessíveis e bem testados.',
    en: 'Full stack developer who loves JavaScript, Node.js and interfaces that make you want to click. I enjoy turning ideas into fast, accessible, well-tested products.',
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
      company: 'Café & Código Studio',
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
  skills: [
    'JavaScript',
    'TypeScript',
    'Node.js',
    'Express',
    'Three.js',
    'React',
    'PostgreSQL',
    'MongoDB',
    'Docker',
    'Git',
  ],
  languages: {
    pt: ['Português — nativo', 'Inglês — avançado'],
    en: ['Portuguese — native', 'English — advanced'],
  },
};

export const projects = [
  {
    title: 'Portfolio 3D',
    description: {
      pt: 'Este quarto aqui! Three.js puro, câmera isométrica, gato com pathfinding e chat com IA.',
      en: 'This very room! Vanilla Three.js, isometric camera, a cat with pathfinding and an AI chat.',
    },
    tags: ['Three.js', 'Vite', 'Groq'],
    repo: 'https://github.com/mmyersbyte',
  },
  {
    title: 'API de Tarefas',
    description: {
      pt: 'API REST com autenticação JWT, testes e documentação OpenAPI. (exemplo)',
      en: 'REST API with JWT auth, tests and OpenAPI docs. (example)',
    },
    tags: ['Node.js', 'Express', 'PostgreSQL'],
    repo: 'https://github.com/mmyersbyte',
  },
  {
    title: 'Chat em Tempo Real',
    description: {
      pt: 'Salas de chat com WebSocket, presença online e histórico persistido. (exemplo)',
      en: 'Chat rooms with WebSocket, online presence and persisted history. (example)',
    },
    tags: ['Socket.io', 'Redis'],
    repo: 'https://github.com/mmyersbyte',
  },
  {
    title: 'Dashboard Financeiro',
    description: {
      pt: 'Painel com gráficos, filtros e exportação para CSV. (exemplo)',
      en: 'Dashboard with charts, filters and CSV export. (example)',
    },
    tags: ['React', 'Chart.js'],
    repo: 'https://github.com/mmyersbyte',
  },
];
