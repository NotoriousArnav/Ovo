// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import * as aiService from "../services/ai";

export async function getDailySummary(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const summary = await aiService.getDailySummary(req.userId!);
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
}
