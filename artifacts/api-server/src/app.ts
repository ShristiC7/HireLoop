import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import helmet from "helmet";
import { generalRateLimiter } from "./middlewares/rateLimiter";

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
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : "*",
  credentials: true,
}));
app.use(generalRateLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/api", router);

// Serve static frontend files in production
const frontendPath = path.join(__dirname, "../../hireloop/dist/public");
app.use(express.static(frontendPath));

// Handle SPAs by serving index.html for unknown routes
app.get("(.*)", (req, res) => {
  if (req.url.startsWith("/api")) return;
  res.sendFile(path.join(frontendPath, "index.html"), (err) => {
    if (err) {
      // If index.html is missing, we just skip (likely in dev mode)
      res.status(404).send("Frontend build not found. Run 'pnpm run build' first.");
    }
  });
});

export default app;
