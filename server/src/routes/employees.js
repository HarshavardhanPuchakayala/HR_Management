import express from "express";

import {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployees,
  getEmployee,
  getDirectReports,
  getMyProfile,
  updateMyProfile,
} from "../controllers/employeeController.js";

import {
  changeMyPassword,
  resetUserPassword,
} from "../controllers/authController.js";

import {
  protect,
  requireRole,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
 * Employee changes their own password.
 *
 * IMPORTANT:
 * This must be before /:employeeId
 */
router.post(
  "/change-password",
  protect,
  changeMyPassword
);

/*
 * Employee views/updates their own profile.
 *
 * IMPORTANT:
 * This must be before /:employeeId
 */
router.get(
  "/me",
  protect,
  getMyProfile
);

router.patch(
  "/me",
  protect,
  updateMyProfile
);

/*
 * Admin creates employee.
 */
router.post(
  "/",
  protect,
  requireRole("admin"),
  createEmployee
);

/*
 * Admin resets employee password.
 *
 * Must be before /:employeeId
 */
router.post(
  "/:employeeId/reset-password",
  protect,
  requireRole("admin"),
  resetUserPassword
);

/*
 * Get all employees.
 */
router.get(
  "/",
  protect,
  getEmployees
);

/*
 * Get direct reports.
 *
 * This must be before /:employeeId
 */
router.get(
  "/:employeeId/direct-reports",
  protect,
  getDirectReports
);

/*
 * Get one employee.
 */
router.get(
  "/:employeeId",
  protect,
  getEmployee
);

/*
 * Update employee.
 */
router.put(
  "/:employeeId",
  protect,
  requireRole("admin"),
  updateEmployee
);

/*
 * Deactivate employee.
 */
router.delete(
  "/:employeeId",
  protect,
  requireRole("admin"),
  deleteEmployee
);

export default router;