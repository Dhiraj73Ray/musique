import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Musique App',
        short_name: 'Musique',
        description: 'Stream music from Google Drive',
        theme_color: '#12121f',
        background_color: '#12121f',
        display: 'standalone', // App ki tarah fullscreen khulega
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/3844/3844724.png', // Apna logo URL daal sakte ho
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://cdn-icons-png.flaticon.com/512/3844/3844724.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
})