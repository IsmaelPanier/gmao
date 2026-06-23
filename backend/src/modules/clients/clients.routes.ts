import { Router } from "express";
import { ClientsController } from "./clients.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createClientSchema, updateClientSchema, listClientsSchema } from "./clients.dto";
import { auditLog } from "../../middlewares/audit.middleware";

const router = Router();
router.use(authenticate);

router.get("/", requireRole("admin", "manager"), validate(listClientsSchema, "query"), ClientsController.list);
router.get("/:id", requireRole("admin", "manager"), ClientsController.getById);
router.post("/", requireRole("admin", "manager"), validate(createClientSchema), auditLog("Client"), ClientsController.create);
router.patch("/:id", requireRole("admin", "manager"), validate(updateClientSchema), auditLog("Client"), ClientsController.update);
router.delete("/:id", requireRole("admin"), auditLog("Client"), ClientsController.remove);

export default router;
