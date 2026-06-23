import { Router } from "express";
import { NotificationsController } from "./notifications.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
router.use(authenticate);

router.get("/", NotificationsController.getMyNotifications);
router.post("/mark-all-read", NotificationsController.markAllAsRead);
router.post("/:id/read", NotificationsController.markAsRead);

export default router;
