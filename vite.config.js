import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Vite Module Federation Phase 1 Setup - Verified Page Auditor integration
    federation({
      name: 'shell',
      remotes: {
        page_auditor: 'http://localhost:5001/assets/remoteEntry.js'
      },
      shared: ['react', 'react-dom']
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/page-auditor')
    }
  },
  define: {
    'process.env': {}
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  },
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
  }
})
