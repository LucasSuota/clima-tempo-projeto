import { readFile } from 'node:fs/promises';
import type { Pool } from 'pg';
import { createPool } from '../../src/db.js';

const schemaPath = new URL('../../../db/init/001-schema.sql', import.meta.url);

export function createTestPool(): Pool {
  // Never fall back to DATABASE_URL: API tests only talk to the test database (AGENTS.md §8).
  const databaseUrlTest = process.env.DATABASE_URL_TEST;
  if (!databaseUrlTest) {
    throw new Error('DATABASE_URL_TEST is not set. Copy .env.example to .env and start the db.');
  }
  return createPool(databaseUrlTest);
}

// Rebuilds the schema from the real script so tests never run against a stale table layout.
export async function resetTestSchema(pool: Pool): Promise<void> {
  const { rows } = await pool.query<{ name: string }>('SELECT current_database() AS name');
  const name = rows[0]?.name ?? '';
  if (!name.endsWith('_test')) {
    throw new Error(`Refusing to reset "${name}": the database name must end with _test.`);
  }
  const schemaSql = await readFile(schemaPath, 'utf8');
  await pool.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public; ${schemaSql}`);
}

export async function clearTables(pool: Pool): Promise<void> {
  await pool.query('TRUNCATE follow_ups, quotes, owners, clients RESTART IDENTITY CASCADE');
}
