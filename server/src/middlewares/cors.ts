import type { RequestHandler } from 'express';

// Only the configured origin is allowed (exact match, never "*"): AGENTS.md §12.
// Without it the API stays same-origin only, which is how the web reaches it in dev and in Docker.
export function createCorsMiddleware(allowedOrigin: string | undefined): RequestHandler {
  return (req, res, next) => {
    if (allowedOrigin === undefined || req.headers.origin !== allowedOrigin) {
      next();
      return;
    }

    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.vary('Origin');

    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Max-Age', '600');
      res.sendStatus(204);
      return;
    }

    next();
  };
}
