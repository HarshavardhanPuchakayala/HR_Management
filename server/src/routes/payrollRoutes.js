import express from "express";

import {
  calculateEmployeePayroll,
  calculateBulkPayroll,
  getPayrollRuns,
  getPayrollRunById,
  getPayslip,
  approvePayroll,
} from "../controllers/payrollController.js";

import { protect } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/",
  protect,
  requireRole("admin"),
  getPayrollRuns
);

router.post(
  "/bulk/calculate",
  protect,
  requireRole("admin"),
  calculateBulkPayroll
);

router.get(
  "/:id/payslip",
  protect,
  requireRole("admin"),
  getPayslip
);

router.get(
  "/:id",
  protect,
  requireRole("admin"),
  getPayrollRunById
);

router.post(
  "/employee/:employeeId/calculate",
  protect,
  requireRole("admin"),
  calculateEmployeePayroll
);

router.put(
  "/:id/approve",
  protect,
  requireRole("admin"),
  approvePayroll
);

export default router;