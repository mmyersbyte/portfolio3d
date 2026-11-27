import { defineConfig, loadEnv } from 'vite';

/**
 * No `pnpm dev` roda a mesma função do chat que vai pra Vercel (api/_lib/chat.js),
 * lendo a GROQ_API_KEY do .env.local. Assim dá pra testar a IA sem a CLI da Vercel.
 * A chave fica só no servidor do Vite: o navegador só enxerga variáveis VITE_*.
 */
function devChatApi(env) {
  return {
    name: 'dev-chat-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end(JSON.stringify({ error: 'method_not_allowed' }));
        }
        let raw = '';
        for await (const chunk of req) {
          raw += chunk;
          if (raw.length > 64_000) break; // corpo gigante não passa
        }
        let body = null;
        try {
          body = JSON.parse(raw);
        } catch {
          /* inválido: o handler responde 400 */
        }
        // ssrLoadModule: editou o prompt/CV, o dev server já usa a versão nova
        const { handleChat } = await server.ssrLoadModule('/api/_lib/chat.js');
        const result = await handleChat({ body, ip: req.socket.remoteAddress, env });
        res.statusCode = result.status;
        res.end(JSON.stringify(result.body));
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // '' = carrega todas as variáveis do .env* (inclusive GROQ_*), só pro lado servidor
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
  return {
    plugins: [devChatApi(env)],
    server: { host: true },
    build: {
      target: 'es2020',
      // three.js sozinho passa de 500 kB; já fica num chunk próprio e cacheado
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          // three é grande e muda pouco: chunk separado = cache melhor entre deploys
          manualChunks(id) {
            if (id.includes('node_modules/three')) return 'three';
          },
        },
      },
    },
  };
});
