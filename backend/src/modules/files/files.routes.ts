import { Router } from "express";
import multer from "multer";
import { FilesController } from "./files.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/rbac.middleware";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

router.use(authenticate);

// POST /api/files/interventions/:interventionId
router.post("/interventions/:interventionId", upload.single("file"), FilesController.upload);

// DELETE /api/files/:id
router.delete("/:id", requireRole("admin", "manager"), FilesController.remove);

export default router;
