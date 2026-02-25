// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";
import { validateApiKey } from "../services/apiKeys";

export interface AuthRequest extends Request {
  userId?: string;
}

const API_KEY_PREFIX = "ovo_k_";

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Authentication required", 401);
    }

    const token = authHeader.split(" ")[1];

    // ── API Key auth ──────────────────────────────────
    if (token.startsWith(API_KEY_PREFIX)) {
      const userId = await validateApiKey(token);
      if (!userId) {
        throw new AppError("Invalid API key", 401);
      }
      req.userId = userId;
      return next();
    }

    // ── JWT auth ──────────────────────────────────────
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret) {
      throw new AppError("Server configuration error", 500);
    }

    const decoded = jwt.verify(token, secret) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError("Token expired", 401));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError("Invalid token", 401));
    } else {
      next(new AppError("Authentication failed", 401));
    }
  }
};
