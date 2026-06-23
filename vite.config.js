import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    
    server: {
      port: 5173,
      open: true
    },
    
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 2000,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        }
      },
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/css/[name]-[hash].[ext]',
          manualChunks: {
            'react-vendor': [
              'react', 
              'react-dom', 
              'react-router-dom'
            ],
            'file-handlers': [
              'file-saver', 
              'xlsx', 
              'jspdf', 
              'jspdf-autotable'
            ],
            'http-client': ['axios'],
          }
        }
      }
    },
    
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL)
    },
    
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'axios',
        'file-saver',
        'xlsx',
        'jspdf',
        'jspdf-autotable'
      ]
    }
  }
})