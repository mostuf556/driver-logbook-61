import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
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
