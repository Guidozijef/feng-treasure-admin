import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174,
    proxy: {
      '/pb-api': {
        target: 'http://47.109.109.134:8091',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pb-api/, '')
      }
    }
  }
});
