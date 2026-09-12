import express from "express";

import {
  createTemplate,
  getTemplates,
  createOnboarding,
  getEmployeeOnboarding,
  getMyOnboardingTasks,
  updateOnboardingTask,
  createOffboarding,
  getOffboardingRecords,
  updateOffboarding,
} from "../controllers/onboardingController.js";

import { protect } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/templates",
  protect,
  requireRole("admin", "manager"),
  getTemplates
);

router.post(
  "/templates",
  protect,
  requireRole("admin"),
  createTemplate
);

router.post(
  "/assign",
  protect,
  requireRole("admin"),
  createOnboarding
);

router.get(
  "/my",
  protect,
  getMyOnboardingTasks
);

router.get(
  "/employee/:employeeId",
  protect,
  requireRole("admin"),
  getEmployeeOnboarding
);

router.put(
  "/tasks/:id",
  protect,
  updateOnboardingTask
);

router.post(
  "/offboarding",
  protect,
  requireRole("admin", "manager"),
  createOffboarding
);

router.get(
  "/offboarding",
  protect,
  requireRole("admin", "manager"),
  getOffboardingRecords
);

router.put(
  "/offboarding/:id",
  protect,
  requireRole("admin", "manager"),
  updateOffboarding
);

export default router;