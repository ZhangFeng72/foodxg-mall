import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/admin-ui/',
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/admin': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/user': { target: 'http://127.0.0.1:8080', changeOrigin: true }
    }
  }
})
