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

  // JWT Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional(),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),

  // Redis
  REDIS_URL: z.string().optional(),

  // Security
  BCRYPT_SALT_ROUNDS: z.coerce.number().min(10).max(14).default(12),
  REFRESH_TOKEN_BYTES: z.coerce.number().min(16).max(64).default(32),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = parsed.error.flatten().fieldErrors;
  const errorMessage = Object.entries(errors)
    .map(([field, messages]) => `  ${field}: ${messages?.join(', ')}`)
    .join('\n');

  throw new Error(`Environment validation failed:\n${errorMessage}`);
}

// Require JWT_SECRET in production
if (parsed.data.NODE_ENV === 'production' && !parsed.data.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in production environment');
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
