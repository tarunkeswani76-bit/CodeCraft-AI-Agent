import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // This allows the Vercel environment variable API_KEY to be visible in the browser code
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});