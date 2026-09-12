import express from "express";

import {
  createUserAccount,
  login,
  getMe,
} from "../controllers/authController.js";

import {
  protect,
  requireRole,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/login",
  login
);

router.post(
  "/users",
  protect,
  requireRole("admin"),
  createUserAccount
);

router.get(
  "/me",
  protect,
  getMe
);

export default router;