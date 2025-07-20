import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        profile: 'src/content/index.tsx',
        feed: 'src/content/feed.tsx',
        post: 'src/content/post.tsx',
        popup: 'src/popup/index.tsx',
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'popup') {
            return 'popup/popup.js';
          }
          return 'content/[name].js';
        },
        format: 'es',
        inlineDynamicImports: false,
        manualChunks: undefined
      },
    },
    emptyOutDir: true,
  },
});
