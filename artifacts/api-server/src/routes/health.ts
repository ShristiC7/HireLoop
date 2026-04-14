import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  try {
    // Ping the database
    await db.execute(sql`SELECT 1`);
    const data = HealthCheckResponse.parse({ status: "ok" });
    res.json({ ...data, database: "connected" });
  } catch (err) {
    const pgError = err as { code?: string; message?: string; detail?: string; hint?: string };
    logger.error({ 
      code: pgError.code, 
      message: pgError.message, 
      detail: pgError.detail, 
      hint: pgError.hint 
    }, "Database health check failed");
    res.status(503).json({ status: "error", database: "disconnected", message: pgError.message });
  }
});

export default router;
