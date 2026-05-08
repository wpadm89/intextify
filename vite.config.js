import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        contact: resolve(__dirname, 'contact.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        terms: resolve(__dirname, 'terms.html'),
        guide5Marla: resolve(__dirname, 'guide-5-marla.html'),
        writeForUs: resolve(__dirname, 'write-for-us.html'),
        blog: resolve(__dirname, 'blog.html')
      }
    }
  }
});
