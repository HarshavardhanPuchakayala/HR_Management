import express from "express";

import {
  checkIn,
  checkOut,
  getMyAttendance,
  getEmployeeAttendance,
  getAllAttendance,
} from "../controllers/attendanceController.js";

import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Any authenticated employee
router.post("/check-in", protect, checkIn);
router.post("/check-out", protect, checkOut);
router.get("/my", protect, getMyAttendance);

// Admin or manager
router.get(
  "/employee/:employeeId",
  protect,
  requireRole("admin", "manager"),
  getEmployeeAttendance
);

// Admin only
router.get(
  "/",
  protect,
  requireRole("admin"),
  getAllAttendance
);

export default router;