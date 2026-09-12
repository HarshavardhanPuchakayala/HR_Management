import express from "express";

import {
  uploadDocument,
  getEmployeeDocuments,
  getMyDocuments,
  deleteDocument,
} from "../controllers/documentController.js";

import { protect } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/my",
  protect,
  getMyDocuments
);

router.get(
  "/employee/:employeeId",
  protect,
  requireRole("admin", "manager"),
  getEmployeeDocuments
);

router.post(
  "/",
  protect,
  requireRole("admin", "manager"),
  uploadDocument
);

router.delete(
  "/:id",
  protect,
  requireRole("admin"),
  deleteDocument
);

export default router;