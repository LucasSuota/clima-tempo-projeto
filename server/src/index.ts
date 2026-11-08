import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createPool } from './db.js';

const config = loadConfig(process.env);
const pool = createPool(config.databaseUrl);
const app = createApp({
  pool,
  staleDays: config.staleDays,
  corsOrigin: config.corsOrigin,
});

const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${config.port}`);
});

function shutdown(): void {
  server.close(() => {
    pool.end().then(
      () => process.exit(0),
      (error: unknown) => {
        // eslint-disable-next-line no-console
        console.error(error);
        process.exit(1);
      },
    );
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
