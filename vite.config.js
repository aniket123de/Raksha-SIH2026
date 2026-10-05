import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 3000,
  },
  server: {
    port: 3000,
    host: true,
    watch: {
      ignored: ['**/*.zip', '**/Raksha.zip']
    }
  }
});
