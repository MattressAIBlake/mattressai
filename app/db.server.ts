import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

declare global {
  var __db__: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient();
  }
  prisma = global.__db__;
}

/**
 * Get Prisma client instance
 * Can be called from anywhere without causing bundling issues
 */
export function getPrisma(): PrismaClient {
  return prisma;
}

export { prisma };

