import express from "express";

import { getDashboard } from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/",
  protect,
  requireRole("admin", "manager"),
  getDashboard
);

export default router;