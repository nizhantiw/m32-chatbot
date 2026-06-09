import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // Ensure streaming / SSE responses are not buffered
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes, req) => {
            const isStream =
              proxyRes.headers['content-type']?.includes('event-stream') ||
              proxyRes.headers['content-type']?.includes('text/plain') ||
              req.url?.includes('/message')
            if (isStream) {
              proxyRes.headers['cache-control'] = 'no-cache'
              delete proxyRes.headers['content-length']
            }
          })
        },
      },
    },
  },
})
