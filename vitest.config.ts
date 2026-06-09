import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: ['node_modules', 'dist', '.output', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'public/coverage',
      exclude: [
        'node_modules/',
        'test/',
        '**/*.test.ts',
        '**/*.config.ts',
        '**/routeTree.gen.ts',
      ],
    },
  },
  resolve: {
    alias: [
      {
        find: '@lovable.dev/vite-tanstack-config',
        replacement: path.resolve(__dirname, 'test/vite-tanstack-config-mock.js'),
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src'),
      },
    ],
  },
})
