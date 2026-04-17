import { WebSocketServer, WebSocket } from "ws";
import { parse } from "url";
import jwt from "jsonwebtoken";
import { logger } from "./logger";
import http from "http";

const JWT_SECRET = process.env.SESSION_SECRET || "hireloop-secret-key-dev-only";

interface WSClient extends WebSocket {
  userId?: number;
  role?: string;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<number, Set<WSClient>> = new Map();

  constructor(server: http.Server) {
    this.wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", (request, socket, head) => {
      const { pathname, query } = parse(request.url || "", true);

      if (pathname === "/ws") {
        const token = query.token as string;
        
        if (!token) {
          socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
          socket.destroy();
          return;
        }

        try {
          const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
          
          this.wss.handleUpgrade(request, socket, head, (ws: WSClient) => {
            ws.userId = decoded.userId;
            ws.role = decoded.role;
            this.wss.emit("connection", ws, request);
          });
        } catch (err) {
          socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
          socket.destroy();
          return;
        }
      } else {
        socket.destroy();
      }
    });

    this.wss.on("connection", (ws: WSClient) => {
      if (!ws.userId) return;

      if (!this.clients.has(ws.userId)) {
        this.clients.set(ws.userId, new Set());
      }
      this.clients.get(ws.userId)!.add(ws);

      // Ping-pong heartbeat
      ws.isAlive = true;
      ws.on("pong", () => {
        ws.isAlive = true;
      });

      ws.on("close", () => {
        if (ws.userId) {
          const userClients = this.clients.get(ws.userId);
          if (userClients) {
            userClients.delete(ws);
            if (userClients.size === 0) {
              this.clients.delete(ws.userId);
            }
          }
        }
      });
    });

    // Heartbeat checker
    setInterval(() => {
      this.wss.clients.forEach((ws: any) => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  public broadcastToUser(userId: number, payload: any) {
    const userClients = this.clients.get(userId);
    if (!userClients) return false;

    const message = JSON.stringify(payload);
    let sent = false;

    userClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        sent = true;
      }
    });

    return sent;
  }
}

// Global instance to use across routes
export let wsManager: WebSocketManager;

export function initializeWebSocket(server: http.Server) {
  wsManager = new WebSocketManager(server);
  logger.info("WebSocket server initialized");
  return wsManager;
}

// Extend WebSocket to track heartbeat
declare module "ws" {
  export interface WebSocket {
    isAlive?: boolean;
  }
}
