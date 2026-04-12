import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/debug/db-info", async (_req, res) => {
  try {
    const tables = await db.execute(sql`
      SELECT tablename, schemaname 
      FROM pg_catalog.pg_tables 
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    `);
    res.json({ 
      database: "connected",
      tables: tables.rows,
      environment: process.env.NODE_ENV
    });
  } catch (err) {
    const pgError = err as { code?: string; message?: string };
    res.status(500).json({ 
      database: "error", 
      message: pgError.message, 
      code: pgError.code 
    });
  }
});

app.get("/", (_req, res) => {
  res.json({ message: "HireLoop API Server is running" });
});

app.get("/api", (_req, res) => {
  res.json({ message: "Welcome to HireLoop API", status: "online", endpoints: { health: "/api/healthz" } });
});

app.use("/api", router);


export default app;
