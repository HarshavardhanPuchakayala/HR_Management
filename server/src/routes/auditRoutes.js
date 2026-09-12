import express from "express";

import { getAuditLogs } from "../controllers/auditController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/",
  protect,
  requireRole("admin"),
  getAuditLogs
);

export default router;