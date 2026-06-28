import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { loginSchema, registerSchema, refreshSchema, setPasswordSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.dto";
import { z } from "zod";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication management
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.post("/login", validate(loginSchema), AuthController.login);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 */
router.post("/register", validate(registerSchema), AuthController.register);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.post("/refresh", validate(refreshSchema), AuthController.refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Success
 */
router.post("/logout", AuthController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/me", authenticate, AuthController.me);

// Mot de passe oublié
router.post("/forgot-password", validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post("/reset-password/:token", validate(resetPasswordSchema), AuthController.resetPassword);

// Activation de compte (routes publiques)
router.get("/activate/:token", AuthController.validateActivationToken);
router.post(
  "/activate/:token",
  validate(z.object({ password: setPasswordSchema.shape.password })),
  AuthController.activateAccount
);

export default router;
