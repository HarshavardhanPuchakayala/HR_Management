import express from "express";

import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/",
  protect,
  getMyNotifications
);

router.get(
  "/unread-count",
  protect,
  getUnreadCount
);

router.put(
  "/read-all",
  protect,
  markAllAsRead
);

router.put(
  "/:id/read",
  protect,
  markAsRead
);

export default router;