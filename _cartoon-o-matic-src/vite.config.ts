import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// `base: './'` keeps the built site portable: it works from any sub-path
// (e.g. https://example.github.io/cartoon-o-matic/) as well as `vite preview`.
export default defineConfig({
  base: './',
  plugins: [react()],
  // Builds straight into the site folder served at /cartoon-o-matic/.
  // (This source folder starts with "_" so GitHub Pages' Jekyll skips it.)
  build: { outDir: '../cartoon-o-matic', emptyOutDir: true },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
