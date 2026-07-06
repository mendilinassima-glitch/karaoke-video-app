import { defineConfig } from 'vite'

// Autoriser le host localtunnel pour que le front accepte les connexions
export default defineConfig({
  server: {
    // bind to all interfaces (already used via CLI --host)
    host: true,
    // Accept any host during development to avoid host header rejections from tunnels
    allowedHosts: 'all'
  }
})
