import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/h5/',
  plugins: [vue()],
  server: {
    port: 5174,
    host: true,
    proxy: {
      '/user': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/admin': { target: 'http://127.0.0.1:8080', changeOrigin: true }
    }
  }
})
