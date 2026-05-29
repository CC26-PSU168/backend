import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { env } from './env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

// Enable SSL for cloud providers like Supabase while keeping local configs unchanged
const shouldUseSsl =
  env.DATABASE_URL.includes('.supabase.co') ||
  env.DATABASE_URL.includes('rdr.free') ||
  process.env.DB_FORCE_SSL === 'true';

const pool =
  globalForPrisma.pool ??
  new pg.Pool({
    connectionString: env.DATABASE_URL,
    max: 1, // Required for pgbouncer/Supabase pooler in serverless/dev
    ...(shouldUseSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });

// Create the Prisma adapter for Prisma 7
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  } as any);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}