export function defineConfig(config) {
  // Return a minimal object with the same shape used in vite.config.ts
  return {
    tanstackStart: config?.tanstackStart ?? {},
    vite: config?.vite ?? {},
  };
}
