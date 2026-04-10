import { PrismaClient } from "@prisma/client";
import { logger } from "./logger.js";

const prismaClientSingleton = () => {
    return new PrismaClient({
        log:
            process.env.NODE_ENV === "development"
                ? ["query", "info", "warn", "error"]
                : ["error"],

        errorFormat: "pretty",
    });
};

// In development, Next.js hot-reloading can create many Prisma instances.
// We attach the client to globalThis to prevent this.
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

// Helper: check if DB is reachable (used in health check)
export async function checkDatabaseHealth() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch (error) {
        logger.error("Database health check failed:", error);
        return false;
    }
}