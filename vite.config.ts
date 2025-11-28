import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // ВАЖНО: имя твоего репозитория всё ещё нужно!
  base: '/USSR/', 

  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'), // Проверь, что папка src существует
    }
  },

  // Это для локальной разработки, можно оставить
  server: {
    port: 3000,
    host: '0.0.0.0',
  }
});
