import { Router } from "express";
import { DashboardController } from "./dashboard.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/rbac.middleware";

const router = Router();
router.use(authenticate);

// GET /api/dashboard/stats
router.get("/stats", requireRole("admin", "manager"), DashboardController.getStats);

export default router;
