import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/client-portal/',
  build: {
    outDir: 'build',
    sourcemap: true
  }
})
