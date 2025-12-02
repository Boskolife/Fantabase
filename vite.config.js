/* eslint-disable no-undef */
import { resolve } from 'path';
import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';
import { htmlFiles } from './getHTMLFileNames';

const input = { main: resolve(__dirname, 'src/index.html') };
htmlFiles.forEach((file) => {
  input[file.replace('.html', '')] = resolve(__dirname, 'src', file);
});

export default defineConfig({
  base: '/Fantabase',
  root: 'src',
  publicDir: '../public',
  plugins: [
    handlebars({ partialDirectory: resolve(__dirname, 'src/templates') }),
  ],
  server: {
    port: 3000,
    host: true,
  },
  build: {
    rollupOptions: {
      input,
    },
    outDir: '../dist/',
    emptyOutDir: true,
  },
});
