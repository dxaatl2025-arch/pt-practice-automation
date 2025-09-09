import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/api/**/*.spec.ts'],  // only look in tests/api
    reporters: ['default'],
    coverage: {
      reporter: ['text', 'html'],
    }
  }
});
