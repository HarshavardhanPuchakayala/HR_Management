import express from "express";

import {
  createLeaveRequest,
  getMyLeaveRequests,
  approveOrRejectLeaveRequest,
  getAllLeaveRequests,
  getTeamLeaveRequests,
  cancelLeaveRequest
} from "../controllers/leaveRequestsController.js";

import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Any authenticated user
router.post("/", protect, createLeaveRequest);
router.get("/my", protect, getMyLeaveRequests);

// Manager only
router.get(
  "/team",
  protect,
  requireRole("manager"),
  getTeamLeaveRequests
);

// Admin only
router.get(
  "/",
  protect,
  requireRole("admin"),
  getAllLeaveRequests
);

// Admin or manager
router.put(
  "/:leaveRequestId",
  protect,
  requireRole("admin", "manager"),
  approveOrRejectLeaveRequest
);

router.patch(
  "/:leaveRequestId/cancel",
  protect,
  cancelLeaveRequest
);
export default router;