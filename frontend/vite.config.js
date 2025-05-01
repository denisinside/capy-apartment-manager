import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    allowedHosts: [
      '.ngrok-free.app'
    ],
    proxy: {
      '^/api/.*': {
        target: 'https://6d7f-46-149-81-55.ngrok-free.app/',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
})