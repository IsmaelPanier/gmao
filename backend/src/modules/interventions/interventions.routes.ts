import { Router } from "express";
import { InterventionsController } from "./interventions.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createInterventionSchema, updateInterventionSchema, listInterventionsSchema, timeLogSchema } from "./interventions.dto";
import { auditLog } from "../../middlewares/audit.middleware";
import { upload } from "../../middlewares/upload.middleware";

const router = Router();
router.use(authenticate);

// All authenticated users can list and view
router.get("/", validate(listInterventionsSchema, "query"), InterventionsController.list);
router.get("/:id", InterventionsController.getById);

// Managers and admins can create
router.post("/", requireRole("admin", "manager"), validate(createInterventionSchema), auditLog("Intervention"), InterventionsController.create);

// All can update (service enforces role-based restrictions on fields)
router.patch("/:id", validate(updateInterventionSchema), auditLog("Intervention"), InterventionsController.update);

// Only admins and managers can delete
router.delete("/:id", requireRole("admin", "manager"), auditLog("Intervention"), InterventionsController.remove);

// Technician quick actions
router.post("/:id/accept", InterventionsController.accept);
router.post("/:id/refuse", InterventionsController.refuse);
router.post("/:id/time-log", validate(timeLogSchema), InterventionsController.timeLog);
router.post("/:id/media", upload.array("photos", 10), InterventionsController.uploadMedia);

export default router;
