import express from "express";
import { createUserAccount,
  login,
  getMe} from "../controllers/authController.js";

import { protect,requireRole } from "../middleware/auth.js";

const router = express.Router();

// Public
router.post("/login", login);

// Admin only
router.post(
  "/users",
  protect,
  requireRole("admin"),
  createUserAccount
);


router.get("/me", protect, getMe);

export default router;