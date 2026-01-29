import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  resolve: {
    mainFields: ['module'],
    alias: {
      '@src': resolve(__dirname, 'src')
    }
  },
  // Prevent Vite's dependency scanner from walking built `dist/**` HTML files.
  // Restrict scanning to source files only so Vitest can start reliably.
  optimizeDeps: {
    entries: ['src/**/*.ts']
  },
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      },
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/**/*.module.ts',
        'src/app/testing/*.ts',
        'src/**/*.routes.ts',
        'src/**/*.mock.ts',
        'src/**/*.routes.server.ts',
        'src/app/app.routes.ts',
        'src/app/app.routes.server.ts',
        'src/app/app.config.ts',
        'src/app/app.config.server.ts',
        'src/main.ts',
        'src/main.server.ts',
        'src/server.ts',
        'src/environments/**',
        'src/**/*.stories.ts'
      ]
    }
  }
});
