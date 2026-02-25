// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import { Router } from "express";
import { getDailySummary } from "../controllers/ai";
import { authenticate } from "../middleware/auth";
import { aiRateLimit } from "../middleware/rateLimit";

export const aiRouter = Router();

// All AI routes require authentication + rate limiting
aiRouter.use(authenticate);
aiRouter.use(aiRateLimit);

aiRouter.get("/daily-summary", getDailySummary);
