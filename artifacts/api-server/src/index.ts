import "dotenv/config";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"] || "3001";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

import http from "http";
import { initializeWebSocket } from "./lib/wsManager";

const server = http.createServer(app);
initializeWebSocket(server);

server.listen(port, () => {
  logger.info({ port }, "Server listening");
});
