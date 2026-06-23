import { Router } from "express";
import { AuditController } from "./audit.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/rbac.middleware";

const router = Router();

router.use(authenticate);

// Seul l'admin a accès aux logs d'audit
router.get("/", requireRole("admin"), AuditController.list);

export default router;
