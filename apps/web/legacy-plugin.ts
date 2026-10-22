import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

/**
 * Serves the single-file prototype unchanged as the `legacy` entry.
 * Dev: GET /legacy/ returns prototype/timberline.html byte for byte.
 * Build: the same bytes are written to dist/legacy/index.html.
 * Vite never transforms the file, so it plays exactly as the standalone prototype.
 */
export const LEGACY_FILE = fileURLToPath(new URL('../../prototype/timberline.html', import.meta.url));

export function legacyPrototype(): Plugin {
  return {
    name: 'outpost-legacy-prototype',
    configureServer(server) {
      server.watcher.add(LEGACY_FILE);
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0];
        if (url === '/legacy') {
          res.statusCode = 302;
          res.setHeader('Location', '/legacy/');
          res.end();
          return;
        }
        if (url !== '/legacy/' && url !== '/legacy/index.html') return next();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(readFileSync(LEGACY_FILE));
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'legacy/index.html', source: readFileSync(LEGACY_FILE) });
    },
  };
}
