// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import { Request, Response, NextFunction } from "express";
import { registerUser, loginUser, refreshAccessToken, logoutUser } from "../services/auth";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await registerUser(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await loginUser(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await refreshAccessToken(req.body.refreshToken);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    await logoutUser(req.body.refreshToken);
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
}
