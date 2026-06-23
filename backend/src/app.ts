import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { requestLogger } from "./middlewares/requestLogger.middleware";
import { errorHandler } from "./middlewares/error.middleware";
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import clientsRoutes from "./modules/clients/clients.routes";
import interventionsRoutes from "./modules/interventions/interventions.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";

export function createApp() {
  const app = express();

  // ─── Security ──────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // ─── Rate limiting ─────────────────────────────
  app.use(
    "/api/auth",
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50,
      message: { success: false, error: { code: "RATE_LIMITED", message: "Too many requests" } },
    })
  );

  // ─── Body parsing ──────────────────────────────
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // ─── Request logging ───────────────────────────
  app.use(requestLogger);

  // ─── Health check ──────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), version: "1.0.0" });
  });

  // ─── Routes ────────────────────────────────────
  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/clients", clientsRoutes);
  app.use("/api/interventions", interventionsRoutes);
  app.use("/api/dashboard", dashboardRoutes);

  // ─── 404 ───────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Route not found" },
    });
  });

  // ─── Error handler (must be last) ─────────────
  app.use(errorHandler);

  return app;
}
