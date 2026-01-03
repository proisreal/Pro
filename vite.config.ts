
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // This shim ensures process.env.API_KEY is replaced by the real key during build
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
});
