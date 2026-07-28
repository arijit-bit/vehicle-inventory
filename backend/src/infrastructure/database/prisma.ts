import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';

export const createPrismaClient = (databaseUrl: string) => {
  const adapter = new PrismaPg({ connectionString: databaseUrl });

  return new PrismaClient({ adapter });
};

export type DatabaseClient = ReturnType<typeof createPrismaClient>;
