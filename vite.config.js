import { defineConfig } from 'vite';

export default defineConfig({
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
});
