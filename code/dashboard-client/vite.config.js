import { index } from 'd3'
import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  publicDir: 'public',
  build: {
    target: 'esnext',
    outDir: '../dist',
    emptyOutDir: true,
    assetsDir: '.',
    rollupOptions: {
      input: {
        index: './src/index.html',
        power: './src/power.html',
        planes: './src/planes.html',
        packets: './src/packets.html',
        weather: './src/weather.html'
      }
    }
  },
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
