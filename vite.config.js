import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/NET-VOCHER.APP/',   // ⬅️ TAMBAHKAN INI
  server: {
    host: '0.0.0.0'
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
})