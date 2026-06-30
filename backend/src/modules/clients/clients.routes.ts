import { Router } from "express";
import { ClientsController } from "./clients.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createClientSchema, updateClientSchema, listClientsSchema } from "./clients.dto";
import { auditLog } from "../../middlewares/audit.middleware";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Clients
 *   description: Client management
 */

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: List clients
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/", requireRole("admin", "manager"), validate(listClientsSchema, "query"), ClientsController.list);
router.get("/search", validate(listClientsSchema, "query"), ClientsController.list);

/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     summary: Get client by ID
 *     tags: [Clients]
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
router.get("/:id", requireRole("admin", "manager"), ClientsController.getById);

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Create client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, phone, address, city]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [PARTICULIER, ENTREPRISE]
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               companyName:
 *                 type: string
 *               siret:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               housingType:
 *                 type: string
 *                 enum: [APPARTEMENT, MAISON]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 */
router.post("/", requireRole("admin", "manager"), validate(createClientSchema), auditLog("Client"), ClientsController.create);

/**
 * @swagger
 * /api/clients/{id}:
 *   patch:
 *     summary: Update client
 *     tags: [Clients]
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
router.patch("/:id", requireRole("admin", "manager"), validate(updateClientSchema), auditLog("Client"), ClientsController.update);

/**
 * @swagger
 * /api/clients/{id}:
 *   delete:
 *     summary: Delete client
 *     tags: [Clients]
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
router.delete("/:id", requireRole("admin"), auditLog("Client"), ClientsController.remove);

export default router;
