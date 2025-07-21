import { build } from 'vite';
import path from 'path-browserify';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

await build({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        content: path.resolve(__dirname, '../src/content/index.ts'),
        popup: path.resolve(__dirname, '../src/popup/index.html'),
        sidepanel: path.resolve(__dirname, '../src/sidepanel/index.html'),
        background: path.resolve(__dirname, '../background.js'),
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
