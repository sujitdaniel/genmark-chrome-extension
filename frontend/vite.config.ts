import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        popup: resolve(__dirname, 'src/popup/index.html'),
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        // Content scripts
        profile: resolve(__dirname, 'src/content/profile.tsx'),
        feed: resolve(__dirname, 'src/content/feed.tsx'),
        post: resolve(__dirname, 'src/content/post.tsx'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'profile') return 'assets/profile.js'
          if (chunkInfo.name === 'feed') return 'assets/feed.js'
          if (chunkInfo.name === 'post') return 'assets/post.js'
          return 'assets/[name]-[hash].js'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
