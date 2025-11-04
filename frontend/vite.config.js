import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables
  const env = loadEnv(mode, process.cwd(), '');
  
  // API URL from env or default
  const apiUrl = env.VITE_API_URL || 'http://localhost:5000/api';
  
  // Determine if we should use network IP
  const useNetworkIp = env.VITE_USE_NETWORK_IP === 'true' || process.argv.includes('--network');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      // Host options
      host: useNetworkIp ? '0.0.0.0' : 'localhost',
      port: 3000,
      
      // CORS settings
      cors: true,
      
      // API Proxy untuk development
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          timeout: 120000, // 120 seconds timeout for slow queries
          proxyTimeout: 120000
        }
      }
    },
    preview: {
      // Untuk mode preview (npm run preview)
      port: 4173,
      host: useNetworkIp ? '0.0.0.0' : 'localhost',
      cors: true
    },
    // Mode development/production
    mode,
    
    // Build options
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      
      // Opsi minify
      minify: mode === 'production' ? 'esbuild' : false,
      
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom']
          }
        }
      }
    },
    
    // Define environment variables for the client
    define: {
      __API_URL__: JSON.stringify(apiUrl),
      __DEV__: mode !== 'production'
    }
  };
}); 