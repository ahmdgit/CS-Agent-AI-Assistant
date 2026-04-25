import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/CS-Agent-AI-Assistant/',
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.GEMINI_API_KEY_1': JSON.stringify(env.GEMINI_API_KEY_1),
      'import.meta.env.GEMINI_API_KEY_2': JSON.stringify(env.GEMINI_API_KEY_2),
      'import.meta.env.GEMINI_API_KEY_3': JSON.stringify(env.GEMINI_API_KEY_3),
      'import.meta.env.GEMINI_API_KEY_4': JSON.stringify(env.GEMINI_API_KEY_4),
      'import.meta.env.GEMINI_API_KEY_5': JSON.stringify(env.GEMINI_API_KEY_5),
      'import.meta.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
