import { Router } from "express";
import { UsersController } from "./users.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { updateUserSchema, listUsersSchema, createUserSchema } from "./users.dto";

const router = Router();

router.use(authenticate);

// GET /api/users
router.get("/", requireRole("admin", "manager"), validate(listUsersSchema, "query"), UsersController.list);

// POST /api/users
router.post("/", requireRole("admin", "manager"), validate(createUserSchema), UsersController.create);

// GET /api/users/:id
router.get("/:id", requireRole("admin", "manager"), UsersController.getById);

// PATCH /api/users/:id
router.patch("/:id", requireRole("admin", "manager"), validate(updateUserSchema), UsersController.update);

// DELETE /api/users/:id
router.delete("/:id", requireRole("admin", "manager"), UsersController.remove);

export default router;
