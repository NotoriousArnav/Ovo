// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import rateLimit from "express-rate-limit";
import type { Request } from "express";

// ─── AI Rate Limiter ─────────────────────────────────
// Per-user rate limiting for AI endpoints.
// Keyed by userId (set by auth middleware), not IP.

const AI_RATE_LIMIT_ENABLED = process.env.AI_RATE_LIMIT_ENABLED !== "false";
const AI_RATE_LIMIT_MAX = parseInt(process.env.AI_RATE_LIMIT_MAX || "20", 10);
const AI_RATE_LIMIT_WINDOW_MS = parseInt(
  process.env.AI_RATE_LIMIT_WINDOW_MS || "3600000",
  10
);

export const aiRateLimit = AI_RATE_LIMIT_ENABLED
  ? rateLimit({
      windowMs: AI_RATE_LIMIT_WINDOW_MS,
      max: AI_RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req: Request) => {
        // Use userId from auth middleware; fall back to IP
        return (req as any).userId || req.ip || "unknown";
      },
      message: {
        success: false,
        message: "Too many AI requests — please try again later",
      },
    })
  : (_req: Request, _res: any, next: () => void) => next();
