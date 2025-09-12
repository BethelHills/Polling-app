import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/__tests__/examples/vitest-supabase-example-vitest.test.ts', '**/__tests__/examples/jest-vs-vitest-comparison-vitest.test.ts'],
    exclude: [
      'node_modules', 
      'dist', 
      '.idea', 
      '.git', 
      '.cache'
    ],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
});
