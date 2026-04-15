import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { logger } from "./logger";

let io: SocketServer | null = null;

/**
 * Initializes the SocketServer.
 * Should only be called once in index.ts
 */
export function initSocket(server: HttpServer) {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Socket client connected");

    // Allow user to join a room based on their userId
    socket.on("join-room", (userId: string | number) => {
      socket.join(`user:${userId}`);
      logger.info({ socketId: socket.id, userId }, "Socket joined user room");
    });

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "Socket client disconnected");
    });
  });

  return io;
}

/**
 * Sends a real-time notification to a specific user.
 */
export function emitNotification(userId: number, payload: { title: string; message: string; type?: string }) {
  if (!io) {
    logger.warn("Socket.io not initialized, cannot emit notification");
    return;
  }
  
  io.to(`user:${userId}`).emit("notification", {
    ...payload,
    timestamp: new Date().toISOString(),
  });
  
  logger.info({ userId, title: payload.title }, "Emitted socket notification to user");
}

/**
 * Broadcasts a notification to all connected clients.
 */
export function broadcastNotification(payload: { title: string; message: string; type?: string }) {
  if (!io) return;
  io.emit("notification", {
    ...payload,
    timestamp: new Date().toISOString(),
  });
}

export { io };
