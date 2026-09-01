import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

export default defineConfig({
  plugins: [uni()],
  server: {
    proxy: {
      '/doubao-api': {
        target: 'https://ark.cn-beijing.volces.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/doubao-api/, '')
      },
      '/deepseek-api': {
        target: 'https://api.deepseek.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/deepseek-api/, '')
      },
      '/tos-api': {
        target: 'https://ark-acg-cn-beijing.tos-cn-beijing.volces.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tos-api/, '')
      },
      '/speech-api': {
        target: 'https://openspeech.bytedance.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/speech-api/, '')
      }
    }
  }
});
