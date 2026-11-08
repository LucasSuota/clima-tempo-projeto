import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/config.js';

const baseEnv = { DATABASE_URL: 'postgres://user:pass@localhost:5432/db' };

describe('loadConfig', () => {
  it('uses port 3333 when PORT is not set', () => {
    const config = loadConfig(baseEnv);

    expect(config.port).toBe(3333);
  });

  it('reads PORT as a number', () => {
    const config = loadConfig({ ...baseEnv, PORT: '4000' });

    expect(config.port).toBe(4000);
  });

  it('exposes the database urls and the CORS origin', () => {
    const config = loadConfig({
      ...baseEnv,
      DATABASE_URL_TEST: 'postgres://user:pass@localhost:5432/db_test',
      CORS_ORIGIN: 'http://localhost:5173',
    });

    expect(config).toMatchObject({
      databaseUrl: baseEnv.DATABASE_URL,
      databaseUrlTest: 'postgres://user:pass@localhost:5432/db_test',
      corsOrigin: 'http://localhost:5173',
    });
  });

  it('leaves the optional values undefined when they are missing', () => {
    const config = loadConfig(baseEnv);

    expect(config.databaseUrlTest).toBeUndefined();
    expect(config.corsOrigin).toBeUndefined();
  });

  it('uses 7 stale days when STALE_DAYS is not set', () => {
    expect(loadConfig(baseEnv).staleDays).toBe(7);
  });

  it('reads STALE_DAYS as a number', () => {
    expect(loadConfig({ ...baseEnv, STALE_DAYS: '10' }).staleDays).toBe(10);
  });

  it.each(['0', 'abc'])('throws when STALE_DAYS is %s', (days) => {
    expect(() => loadConfig({ ...baseEnv, STALE_DAYS: days })).toThrow(/STALE_DAYS/);
  });

  it('throws when DATABASE_URL is missing', () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL/);
  });

  it.each(['abc', '0', '70000', '3.5'])('throws when PORT is %s', (port) => {
    expect(() => loadConfig({ ...baseEnv, PORT: port })).toThrow(/PORT/);
  });
});
