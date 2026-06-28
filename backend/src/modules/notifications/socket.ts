import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import jwt from "jsonwebtoken";

let io: SocketIOServer;

export const initSocket = (httpServer: HttpServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];
    if (!token) return next(new Error("Authentication error"));

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as any;
      socket.data.user = payload;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const { sub: userId, role } = socket.data.user;
    logger.info(`User connected to socket: ${userId} (${role})`);

    // Room personnelle pour les notifications ciblées
    socket.join(`user:${userId}`);

    // Room de rôle pour les broadcasts (ex: planning → tous les managers)
    socket.join(`role:${role}`);

    socket.on("disconnect", () => {
      logger.info(`User disconnected from socket: ${userId}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
