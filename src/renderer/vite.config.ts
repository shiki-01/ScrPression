import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  root: __dirname,
  base: './',
  server: {
    port: 5173
  }
})