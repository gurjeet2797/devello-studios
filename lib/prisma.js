import { PrismaClient } from "@prisma/client";

let prisma;

try {
  if (typeof window === "undefined") {
    // Server-side environment
    // Use a single globalThis.prisma in all server environments to avoid
    // multiple client instances (important in serverless / hot reload).
    if (!globalThis.prisma) {
      globalThis.prisma =
        process.env.NODE_ENV === "production"
          ? new PrismaClient({
              log: ["error"],
              datasources: {
                db: {
                  url: process.env.DATABASE_URL,
                },
              },
            })
          : new PrismaClient();
    }
    prisma = globalThis.prisma;
  } else {
    // Browser environment - prisma should not be used
    prisma = undefined;
  }
} catch (error) {
  console.error('[PRISMA] Error initializing Prisma Client:', error);
  console.error('[PRISMA] This usually means Prisma Client needs to be regenerated. Run: npx prisma generate');
  prisma = undefined;
}

export default prisma;
