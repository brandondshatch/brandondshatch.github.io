import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// `base: './'` keeps the built site portable: it works from any sub-path
// (e.g. https://example.github.io/cartoon-o-matic/) as well as `vite preview`.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
