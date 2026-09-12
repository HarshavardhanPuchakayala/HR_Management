import express from "express";

import {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployees,
  getEmployee,
  getDirectReports,
} from "../controllers/employeeController.js";

import {
  protect,
  requireRole,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/",
  protect,
  getEmployees
);

router.get(
  "/:employeeId",
  protect,
  getEmployee
);

router.get(
  "/:employeeId/direct-reports",
  protect,
  getDirectReports
);

router.post(
  "/",
  protect,
  requireRole("admin"),
  createEmployee
);

router.put(
  "/:employeeId",
  protect,
  requireRole("admin"),
  updateEmployee
);

router.delete(
  "/:employeeId",
  protect,
  requireRole("admin"),
  deleteEmployee
);

export default router;