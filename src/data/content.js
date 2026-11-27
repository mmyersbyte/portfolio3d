/**
 * Todo o conteúdo do portfólio mora aqui.
 * Campos traduzíveis usam { pt, en }.
 *
 * TODO: trocar LinkedIn/Instagram pelos usuários reais e o CV fictício pelo de verdade.
 */

export const profile = {
  name: 'Pedro Victor',
  photo: '/images/profile.jpg',
  // título que aparece no topo da tela (geral de propósito)
  role: { pt: 'Desenvolvedor de Software', en: 'Software Developer' },
  openToWork: true,
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
  email: 'pedrovictorcastro.dev@gmail.com',
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
  // "Sobre" exatamente como está no LinkedIn
  about: {
    pt: `Sou desenvolvedor backend especializado em APIs RESTful com Node.js e TypeScript / JavaScript.

Experiência em projetos aprovados e utilizados por usuários reais:

✅️ Eco Histórias: rede social de relatos anônimos com mais de 100 histórias publicadas por usuários autenticados.
🔗 https://ecohistorias.com.br/

✅️ LABEM (Liga Acadêmica da UNISUL): API em produção entregue como meu último freela pago.
🔗 github.com/mmyersbyte/labem

Aplicando frameworks como Express.js e Fastify. Atualmente aprendendo NestJS.
Também atuo com testes automatizados, documentação (Swagger), e aplicações com Docker Compose. Utilizo banco de dados SQL (PostgreSQL) e NoSQL (MongoDB), usando Query Builders e ORMs como o Prisma.

Graduação em ADS (Término previsto para 2026)

Atualmente atuando remotamente com Inteligência Artificial aplicada e operações com sistemas, ampliando minha visão prática sobre tecnologia no dia a dia.

Aberto a processos seletivos para times de desenvolvimento.

Busco evoluir como desenvolvedor e contribuir com projetos reais, unindo aprendizado técnico com impacto.

📧 pedrovictorcastro.dev@gmail.com
💻 GitHub: github.com/mmyersbyte`,
    en: `I'm a backend developer specialized in RESTful APIs with Node.js and TypeScript / JavaScript.

Experience with projects approved and used by real users:

✅️ Eco Histórias: anonymous stories social network with over 100 stories published by authenticated users.
🔗 https://ecohistorias.com.br/

✅️ LABEM (UNISUL Academic League): production API delivered as my latest paid freelance job.
🔗 github.com/mmyersbyte/labem

Working with frameworks like Express.js and Fastify. Currently learning NestJS.
I also work with automated tests, documentation (Swagger) and Docker Compose apps. I use SQL (PostgreSQL) and NoSQL (MongoDB) databases, with query builders and ORMs like Prisma.

Systems Analysis and Development degree (expected 2026)

Currently working remotely with applied Artificial Intelligence and systems operations, broadening my hands-on view of technology day to day.

Open to hiring processes for development teams.

I want to grow as a developer and contribute to real projects, combining technical learning with impact.

📧 pedrovictorcastro.dev@gmail.com
💻 GitHub: github.com/mmyersbyte`,
  },
};

/**
 * CV (currículo oficial + LinkedIn). Telefone fica de fora de propósito:
 * o site é público e o contato é por e-mail/LinkedIn.
 */
export const cv = {
  placeholder: false,
  headline: {
    pt: 'Estudante de Análise e Desenvolvimento de Sistemas | Desenvolvimento, Automação e IA',
    en: 'Systems Analysis and Development Student | Development, Automation and AI',
  },
  summary: {
    pt: 'Estudante de Análise e Desenvolvimento de Sistemas, com experiência profissional em automação de CRM, configuração de fluxos inteligentes, integração de ferramentas e soluções de IA. Experiência prática no desenvolvimento de APIs REST, aplicações web e integração com bancos de dados. Busco ampliar minha atuação em desenvolvimento de soluções empresariais e automação de processos, com interesse em tecnologias Microsoft e na Power Platform.',
    en: 'Systems Analysis and Development student with professional experience in CRM automation, smart workflow setup, tool integration and AI solutions. Hands-on experience building REST APIs, web applications and database integrations. Looking to grow in enterprise solution development and process automation, with interest in Microsoft technologies and the Power Platform.',
  },
  experience: [
    {
      role: { pt: 'Especialista em automação e suporte', en: 'Automation and Support Specialist' },
      company: 'Mind Tecnologia I.A',
      period: { pt: 'mar/2026 — atual', en: 'Mar 2026 — present' },
      meta: {
        pt: 'Tempo integral · Remoto (Salvador, BA) · Suporte e Automação com IA',
        en: 'Full-time · Remote (Salvador, BA) · AI Support and Automation',
      },
      bullets: {
        pt: [
          'Implementação de automações e fluxos inteligentes em CRM.',
          'Configuração de chatbots e assistentes automatizados.',
          'Uso de APIs de IA, como geração de respostas e classificação de tickets.',
          'Otimização do atendimento com ferramentas baseadas em IA.',
          'Integração de sistemas para melhorar a eficiência operacional.',
        ],
        en: [
          'Implemented automations and smart workflows in CRM.',
          'Set up chatbots and automated assistants.',
          'Used AI APIs such as response generation and ticket classification.',
          'Optimized customer support with AI-based tools.',
          'Integrated systems to improve operational efficiency.',
        ],
      },
    },
    {
      role: { pt: 'Freelancer Full Stack', en: 'Full Stack Freelancer' },
      company: '',
      period: { pt: 'out/2024 — atual', en: 'Oct 2024 — present' },
      bullets: {
        pt: [
          'APIs REST para o sistema da LABEM (UNISUL), com autenticação JWT e cookies HTTP-Only.',
          'Documentação de APIs com Swagger e upload de arquivos com Multer.',
          'Aplicações com Node.js, TypeScript, PostgreSQL e React.',
          'Criação do Eco, rede social com mais de 100 usuários cadastrados, publicações, interações e mais de 10 endpoints REST.',
          'Docker Compose e testes automatizados com Vitest.',
        ],
        en: [
          'REST APIs for the LABEM (UNISUL) system, with JWT auth and HTTP-Only cookies.',
          'API documentation with Swagger and file uploads with Multer.',
          'Applications with Node.js, TypeScript, PostgreSQL and React.',
          'Built Eco, a social network with 100+ registered users, posts, interactions and 10+ REST endpoints.',
          'Docker Compose and automated tests with Vitest.',
        ],
      },
    },
    {
      role: { pt: 'Operador de Crédito', en: 'Credit Operator' },
      company: 'Santander',
      period: { pt: 'nov/2022 — jul/2024', en: 'Nov 2022 — Jul 2024' },
      meta: { pt: 'Presencial', en: 'On-site' },
      bullets: {
        pt: [
          'Atendimento ao cliente, negociação, cumprimento de metas e resolução de demandas sob pressão.',
        ],
        en: ['Customer service, negotiation, meeting targets and solving demands under pressure.'],
      },
    },
  ],
  education: [
    {
      course: {
        pt: 'Análise e Desenvolvimento de Sistemas',
        en: 'Systems Analysis and Development',
      },
      school: 'Universidade Christus (Unichristus)',
      period: { pt: 'jan/2025 — dez/2027 (previsão)', en: 'Jan 2025 — Dec 2027 (expected)' },
    },
    {
      course: {
        pt: 'Desenvolvimento com JavaScript (presencial)',
        en: 'JavaScript Development (in person)',
      },
      school: 'Youth Space',
      period: { pt: '2024 — 2025', en: '2024 — 2025' },
    },
    {
      course: { pt: 'Inglês', en: 'English' },
      school: 'Youth Space',
      period: { pt: '2023 — 2025', en: '2023 — 2025' },
    },
  ],
  // conhecimentos técnicos por área (currículo + GitHub)
  skills: [
    {
      label: { pt: 'Automação e IA', en: 'Automation & AI' },
      items: [
        'CRM',
        'Chatbots',
        { pt: 'Fluxos inteligentes', en: 'Smart workflows' },
        { pt: 'APIs de IA', en: 'AI APIs' },
        { pt: 'Otimização de processos', en: 'Process optimization' },
      ],
    },
    {
      label: { pt: 'Backend', en: 'Backend' },
      items: ['Node.js', 'Express', 'Fastify', 'APIs REST', 'JWT', 'Swagger', 'Zod'],
    },
    {
      label: { pt: 'Frontend', en: 'Frontend' },
      items: ['JavaScript', 'TypeScript', 'React', 'React Native', 'HTML5', 'CSS3', 'Three.js'],
    },
    {
      label: { pt: 'Banco de dados', en: 'Databases' },
      items: ['PostgreSQL', 'MongoDB', 'SQLite', 'Prisma', 'Knex'],
    },
    {
      label: { pt: 'Ferramentas e qualidade', en: 'Tools & quality' },
      items: ['Git', 'GitHub', 'Docker Compose', 'Postman', 'Vitest', 'AWS S3'],
    },
    {
      label: { pt: 'Outros', en: 'Other' },
      items: ['SQL', 'Java', 'Python'],
    },
  ],
  // estudando / interesse profissional
  learning: ['NestJS', 'Microsoft Power Platform', 'Low-code / No-code'],
  courses: [
    { name: 'APIs com Node.js e Express', hours: 80, school: 'Alura' },
    { name: 'Conhecendo SQL', hours: 41, school: 'Alura' },
    { name: 'JavaScript Impressionador', hours: 164, school: 'Hashtag Treinamentos' },
    { name: 'Node.js', school: 'Rocketseat' },
    {
      name: 'Inteligência Artificial e Google Gemini: Criação de Ferramentas e Chatbots Inteligentes',
      hours: 18,
      school: 'Alura',
    },
    { name: 'Using MongoDB with Node.js', school: 'MongoDB' },
  ],
  languages: {
    pt: ['Português — nativo', 'Inglês — B2 (Youth Space)'],
    en: ['Portuguese — native', 'English — B2 (Youth Space)'],
  },
};

/** Todas as habilidades numa lista só (pro chat). */
export const allSkills = (lang) =>
  cv.skills.flatMap((g) => g.items.map((i) => (typeof i === 'string' ? i : i[lang])));

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
      hl('users', '100+ histórias publicadas', '100+ stories published'),
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
      hl('freelance', 'Freelance pago', 'Paid freelance'),
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
