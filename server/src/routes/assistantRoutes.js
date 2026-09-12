import express from "express";

import { protect } from "../middleware/auth.js";
import { chat } from "../controllers/assistantController.js";

const router = express.Router();

router.post("/chat", protect, chat);

export default router;