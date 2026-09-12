import express from "express";

import {
  checkIn,
  checkOut,
  getMyAttendance,
  getEmployeeAttendance,
  getAllAttendance,
} from "../controllers/attendanceController.js";

import {
  protect,
  requireRole,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/check-in",
  protect,
  checkIn
);

router.post(
  "/check-out",
  protect,
  checkOut
);

router.get(
  "/my",
  protect,
  getMyAttendance
);

router.get(
  "/employee/:employeeId",
  protect,
  requireRole("admin", "manager"),
  getEmployeeAttendance
);

router.get(
  "/",
  protect,
  requireRole("admin"),
  getAllAttendance
);

export default router;