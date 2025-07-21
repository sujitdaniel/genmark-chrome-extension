import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'src/manifest.json',
          dest: '.',
        },
        {
          src: 'src/assets',
          dest: '.',
        },
      ],
    }),
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        profile: 'src/content/profile.tsx',
        feed: 'src/content/feed.tsx',
        post: 'src/content/post.tsx',
        popup: 'src/popup/index.html',
        sidepanel: 'src/sidepanel/index.html',
        background: 'background.js',
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
    emptyOutDir: true,
  },
});
