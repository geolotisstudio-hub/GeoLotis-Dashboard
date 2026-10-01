import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ============================================
// CONFIGURATION VITE — DASHBOARD GÉOLOTIS
// ============================================
// Application web AUTONOME (plus embarquée dans le logiciel).
// Port 5174 pour ne jamais entrer en conflit avec le serveur de
// développement du logiciel GéoLotis (qui tourne sur 5173).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
  },
})
