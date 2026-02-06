import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).optional(),

  // JWT (required in production)
  JWT_SECRET: z.string().optional(),
  JWT_ACCESS_EXPIRATION: z.string().optional(),
  JWT_REFRESH_EXPIRATION: z.string().optional(),

  // Redis
  REDIS_URL: z.string().optional(),

  // Security
  BCRYPT_SALT_ROUNDS: z.coerce.number().min(10).max(14).default(12),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = parsed.error.flatten().fieldErrors;
  const errorMessage = Object.entries(errors)
    .map(([field, messages]) => `  ${field}: ${messages?.join(', ')}`)
    .join('\n');

  throw new Error(`Environment validation failed:\n${errorMessage}`);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
