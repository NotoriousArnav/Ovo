// Ovo — Smart Task Manager
// API Key controller
// SPDX-License-Identifier: GPL-3.0

import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import * as apiKeyService from "../services/apiKeys";

export async function createApiKey(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await apiKeyService.createApiKey(req.userId!, req.body.name);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function listApiKeys(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const keys = await apiKeyService.listApiKeys(req.userId!);
    res.json({ success: true, data: keys });
  } catch (error) {
    next(error);
  }
}

export async function revokeApiKey(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await apiKeyService.revokeApiKey(req.userId!, req.params.id as string);
    res.json({ success: true, message: "API key revoked" });
  } catch (error) {
    next(error);
  }
}
