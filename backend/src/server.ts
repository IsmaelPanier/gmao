import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import prisma from "./config/database";
import { initSocket } from "./modules/notifications/socket";
import http from "http";

async function bootstrap() {
  const app = createApp();
  const server = http.createServer(app);

  // Test DB connection
  try {
    await prisma.$connect();
    logger.info("✅ Database connected");
  } catch (err) {
    logger.fatal({ err }, "❌ Failed to connect to database");
    process.exit(1);
  }

  // Initialize WebSockets
  initSocket(server);

  server.listen(env.PORT, () => {
    logger.info(`🚀 GMAO API running on http://localhost:${env.PORT}`);
    logger.info(`   Environment: ${env.NODE_ENV}`);
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info("Server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // Catch unhandled rejections
  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "Unhandled promise rejection");
  });
}

bootstrap();
