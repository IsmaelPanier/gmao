import { Router } from "express";
import { InterventionsController } from "./interventions.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createInterventionSchema, updateInterventionSchema, listInterventionsSchema } from "./interventions.dto";

const router = Router();
router.use(authenticate);

// All authenticated users can list and view
router.get("/", validate(listInterventionsSchema, "query"), InterventionsController.list);
router.get("/:id", InterventionsController.getById);

// Managers and admins can create
router.post("/", requireRole("admin", "manager"), validate(createInterventionSchema), InterventionsController.create);

// All can update (service enforces role-based restrictions on fields)
router.patch("/:id", validate(updateInterventionSchema), InterventionsController.update);

// Only admins and managers can delete
router.delete("/:id", requireRole("admin", "manager"), InterventionsController.remove);

export default router;
