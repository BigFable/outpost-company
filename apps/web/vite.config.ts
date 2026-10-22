import { defineConfig } from 'vite';
import { legacyPrototype } from './legacy-plugin';

export default defineConfig({
  // Relative asset paths so the build also works from file:// inside Electron.
  base: './',
  plugins: [legacyPrototype()],
  server: { port: 5173, open: '/legacy/' },
  build: { outDir: 'dist', emptyOutDir: true },
});
