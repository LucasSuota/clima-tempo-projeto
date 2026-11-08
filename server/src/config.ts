import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3333),
  DATABASE_URL: z.string().min(1),
  DATABASE_URL_TEST: z.string().min(1).optional(),
  CORS_ORIGIN: z.string().min(1).optional(),
  STALE_DAYS: z.coerce.number().int().min(1).default(7),
});

export interface Config {
  port: number;
  databaseUrl: string;
  databaseUrlTest: string | undefined;
  corsOrigin: string | undefined;
  staleDays: number;
}

// Receives the env as a parameter so it stays testable; index.ts passes process.env.
export function loadConfig(env: Record<string, string | undefined>): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment variables: ${problems}`);
  }

  return {
    port: result.data.PORT,
    databaseUrl: result.data.DATABASE_URL,
    databaseUrlTest: result.data.DATABASE_URL_TEST,
    corsOrigin: result.data.CORS_ORIGIN,
    staleDays: result.data.STALE_DAYS,
  };
}
