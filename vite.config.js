import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

const rewritePlugin = () => ({
  name: 'rewrite-plugin',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url.startsWith('/blog/') && req.url !== '/blog/') {
        req.url = '/blog.html';
      } else if (req.url.startsWith('/guides/') && req.url !== '/guides/') {
        req.url = '/guides.html';
      }
      next();
    });
  }
});

export default defineConfig({
  plugins: [rewritePlugin()],
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
        blog: resolve(__dirname, 'blog.html'),
        guidesHub: resolve(__dirname, 'guides.html')
      }
    }
  }
});
