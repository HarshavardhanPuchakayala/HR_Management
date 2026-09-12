import express from "express";

import {
  getMyLeaveBalances,
  getEmployeeLeaveBalances,
  initializeLeaveBalances,
  adjustLeaveBalance,
} from "../controllers/leaveBalanceController.js";

import {
  protect,
  requireRole,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/my",
  protect,
  getMyLeaveBalances
);

router.get(
  "/employee/:employeeId",
  protect,
  requireRole("manager", "admin"),
  getEmployeeLeaveBalances
);

router.post(
  "/initialize",
  protect,
  requireRole("admin"),
  initializeLeaveBalances
);

router.put(
  "/:id/adjust",
  protect,
  requireRole("admin"),
  adjustLeaveBalance
);

export default router;