import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { loginSchema, registerSchema, refreshSchema } from "./auth.dto";

const router = Router();

// POST /api/auth/login
router.post("/login", validate(loginSchema), AuthController.login);

// POST /api/auth/register
router.post("/register", validate(registerSchema), AuthController.register);

// POST /api/auth/refresh
router.post("/refresh", validate(refreshSchema), AuthController.refresh);

// POST /api/auth/logout
router.post("/logout", AuthController.logout);

// GET /api/auth/me
router.get("/me", authenticate, AuthController.me);

export default router;
