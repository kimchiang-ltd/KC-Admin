import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/KC-Admin/',
  build: {
    chunkSizeWarningLimit: 1000,
  },
})