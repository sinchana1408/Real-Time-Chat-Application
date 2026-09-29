import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

// Load .env from workspace root or apps/api
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('postgresql://postgres:password@localhost:5432/pulsechat?schema=public'),
  JWT_SECRET: z.string().default('pulsechat_super_secure_jwt_secret_key_change_in_production_2026'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  UPLOAD_STORAGE_TYPE: z.enum(['local', 'cloudinary']).default('local'),
  UPLOAD_MAX_FILE_SIZE_MB: z.coerce.number().default(25),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

export const env = envSchema.parse(process.env);
