import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 8000
  },
  preview: {
    port: 8000
  },
  resolve: {
    alias: {
      $src: '/src'
    }
  }
})
