import { defineConfig } from 'vitest/config';
import { normalize, resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['./app/core', './dashboard-v2', './node_modules/**'],
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json',
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './app')
    }
  }
});
