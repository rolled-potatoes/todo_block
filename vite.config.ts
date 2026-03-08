import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import { resolve } from 'path'
import manifest from './manifest.json'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  build: {
    rollupOptions: {
      // 차단 페이지를 Rollup 진입점으로 등록하여 CRXJS가 JS를 번들링하도록 한다
      // web_accessible_resources에 등록된 HTML은 자동 번들링 대상이 아니므로 명시적으로 추가
      input: {
        blocked: resolve(__dirname, 'src/pages/blocked/index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@background': resolve(__dirname, 'src/background'),
      '@popup': resolve(__dirname, 'src/popup'),
      '@content': resolve(__dirname, 'src/content'),
      '@pages': resolve(__dirname, 'src/pages'),
    },
  },
})
