import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        headers: {
          // Security headers for development
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Production optimizations
        minify: isProduction ? 'esbuild' : false,
        sourcemap: !isProduction,
        target: 'es2020',
        cssCodeSplit: true,
        rollupOptions: {
          output: {
            manualChunks: {
              // Split vendor chunks for better caching
              'react-vendor': ['react', 'react-dom'],
              'charts': ['recharts'],
              'icons': ['react-icons'],
              'ai': ['@google/genai']
            }
          }
        },
        chunkSizeWarningLimit: 1000,
        // Enable compression hints
        reportCompressedSize: true,
      },
      // Performance optimizations
      optimizeDeps: {
        include: ['react', 'react-dom', 'recharts', 'react-icons'],
      },
      // Security: Don't expose source in production
      esbuild: {
        drop: isProduction ? ['console', 'debugger'] : [],
      }
    };
});
