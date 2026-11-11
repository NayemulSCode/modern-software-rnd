import "server-only";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and run `npm run db:setup`.",
    );
  }
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
}

// In development, hot reload re-evaluates this module on every edit. Keeping
// the client on globalThis stops each reload from opening a new connection.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
