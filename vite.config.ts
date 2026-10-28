import { defineConfig } from 'vite';

// Vite only bundles the small client script and stylesheet with fixed file
// names. All HTML and AI-facing files are generated afterwards by
// scripts/build-content.ts, which stamps asset URLs with a content hash.
export default defineConfig({
  base: '/cc_webmcp/',
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: 'src/main.ts',
      output: {
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/app[extname]',
      },
    },
  },
});
