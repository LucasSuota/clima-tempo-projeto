import { existsSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// Loads ../.env into process.env (workers inherit it) so tests find DATABASE_URL_TEST.
// Done with Node's own loader to avoid importing `vite`, which is not a declared dependency.
if (existsSync('../.env')) process.loadEnvFile('../.env');

export default defineConfig({
  test: {
    // API tests share one test database, so files must not run in parallel.
    fileParallelism: false,
  },
});
