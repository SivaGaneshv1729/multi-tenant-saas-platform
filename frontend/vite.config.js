import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // CRITICAL: Listen on all network interfaces
    port: 3000,
    strictPort: true, // Fail if port 3000 is busy
    watch: {
      usePolling: true, // needed for Windows/WSL/Docker to see changes
    }
  }
})