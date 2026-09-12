import express from "express";

import {
  createReviewCycle,
  getReviewCycles,
  createPerformanceReview,
  getMyPerformanceReviews,
  getTeamPerformanceReviews,
  updatePerformanceReview,
  submitPerformanceReview,
  getAllPerformanceReviews,
  activateReviewCycle,
  completeReviewCycle,
} from "../controllers/performanceReviewController.js";

import {
  protect,
  requireRole,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/cycles",
  protect,
  requireRole("admin"),
  createReviewCycle
);

router.get(
  "/cycles",
  protect,
  getReviewCycles
);

router.put(
  "/cycles/:id/activate",
  protect,
  requireRole("admin"),
  activateReviewCycle
);

router.put(
  "/cycles/:id/complete",
  protect,
  requireRole("admin"),
  completeReviewCycle
);

router.post(
  "/",
  protect,
  requireRole("manager"),
  createPerformanceReview
);

router.get(
  "/my",
  protect,
  getMyPerformanceReviews
);

router.get(
  "/team",
  protect,
  requireRole("manager"),
  getTeamPerformanceReviews
);

router.get(
  "/all",
  protect,
  requireRole("admin"),
  getAllPerformanceReviews
);

router.put(
  "/:id",
  protect,
  requireRole("manager", "employee"),
  updatePerformanceReview
);

router.post(
  "/:id/submit",
  protect,
  requireRole("manager"),
  submitPerformanceReview
);

export default router;