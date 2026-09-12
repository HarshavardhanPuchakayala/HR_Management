import express from "express";

import {
  createLeaveRequest,
  getMyLeaveRequests,
  approveOrRejectLeaveRequest,
  getAllLeaveRequests,
  getTeamLeaveRequests,
  cancelLeaveRequest,
} from "../controllers/leaveController.js";

import {
  protect,
  requireRole,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  createLeaveRequest
);

router.get(
  "/my",
  protect,
  getMyLeaveRequests
);

router.get(
  "/team",
  protect,
  requireRole("manager"),
  getTeamLeaveRequests
);

router.get(
  "/",
  protect,
  requireRole("admin"),
  getAllLeaveRequests
);

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