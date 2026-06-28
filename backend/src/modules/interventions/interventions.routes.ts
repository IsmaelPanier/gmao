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

/**
 * @swagger
 * tags:
 *   name: Interventions
 *   description: Intervention management
 */

/**
 * @swagger
 * /api/interventions:
 *   get:
 *     summary: List interventions
 *     tags: [Interventions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/", validate(listInterventionsSchema, "query"), InterventionsController.list);

/**
 * @swagger
 * /api/interventions/{id}:
 *   get:
 *     summary: Get intervention by ID
 *     tags: [Interventions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/:id", InterventionsController.getById);

/**
 * @swagger
 * /api/interventions:
 *   post:
 *     summary: Create intervention
 *     tags: [Interventions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientId, type]
 *             properties:
 *               clientId:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 */
router.post("/", requireRole("admin", "manager"), validate(createInterventionSchema), auditLog("Intervention"), InterventionsController.create);

/**
 * @swagger
 * /api/interventions/{id}:
 *   patch:
 *     summary: Update intervention
 *     tags: [Interventions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 */
router.patch("/:id", validate(updateInterventionSchema), auditLog("Intervention"), InterventionsController.update);

/**
 * @swagger
 * /api/interventions/{id}:
 *   delete:
 *     summary: Delete intervention
 *     tags: [Interventions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.delete("/:id", requireRole("admin", "manager"), auditLog("Intervention"), InterventionsController.remove);

/**
 * @swagger
 * /api/interventions/{id}/accept:
 *   post:
 *     summary: Accept assigned intervention
 *     tags: [Interventions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.post("/:id/accept", InterventionsController.accept);

/**
 * @swagger
 * /api/interventions/{id}/refuse:
 *   post:
 *     summary: Refuse assigned intervention
 *     tags: [Interventions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.post("/:id/refuse", InterventionsController.refuse);

/**
 * @swagger
 * /api/interventions/{id}/time-log:
 *   post:
 *     summary: Add time log
 *     tags: [Interventions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [START, PAUSE, RESUME, END]
 *     responses:
 *       200:
 *         description: Success
 */
router.post("/:id/time-log", validate(timeLogSchema), InterventionsController.timeLog);

/**
 * @swagger
 * /api/interventions/{id}/media:
 *   post:
 *     summary: Upload media
 *     tags: [Interventions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Success
 */
router.post("/:id/media", upload.array("photos", 10), InterventionsController.uploadMedia);
router.post("/:id/signature", upload.single("signature"), InterventionsController.uploadSignature);

export default router;
