import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Get pooled database URL from environment
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.');
  }

  // Create Neon adapter with pooled connection string
  const adapter = new PrismaNeon({ connectionString: databaseUrl });

  // Initialize Prisma Client with Neon adapter
  return new PrismaClient({ adapter });
}

// Create Prisma Client instance (singleton pattern for development)
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
