import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    target: 'node22',
    outDir: 'dist',
    ssr: true,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: [
        'express',
        'axios',
        'cheerio',
        'cookie-parser',
        'cors',
        'helmet',
        'express-rate-limit',
        'zod',
        'node:fs',
        'node:fs/promises',
        'node:path',
        'node:url',
        'node:http',
        'node:https',
        'fs',
        'fs/promises',
        'path',
        'url',
        'http',
        'https'
      ],
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
