import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

export default defineConfig({
  main: { plugins: [externalizeDepsPlugin()], build: { rollupOptions: { input: resolve('electron/main.ts'), output: { entryFileNames: 'index.js' } } } },
  preload: { plugins: [externalizeDepsPlugin()], build: { rollupOptions: { input: resolve('electron/preload.ts'), output: { format: 'cjs', entryFileNames: 'index.cjs' } } } },
  renderer: { root: '.', resolve: { alias: { '@': resolve('src') } }, plugins: [react(), tailwindcss(), { name:'local-dev-csp', apply:'serve', transformIndexHtml(html){ return html.replace("script-src 'self';", "script-src 'self' 'unsafe-inline';") } }], build: { rollupOptions: { input: resolve('index.html') } } }
})
