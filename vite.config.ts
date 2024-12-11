import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [svelte()],
  root: path.resolve(__dirname, 'src/renderer'),
  resolve: {
    alias: {
      '$lib': fileURLToPath(new URL('./src/renderer/lib', import.meta.url))
    }
  },
  server: {
    port: 5173
  },
})