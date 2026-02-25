// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import { Request, Response, NextFunction } from "express";
import { registerUser, loginUser, refreshAccessToken, logoutUser, initiateEventHorizonLogin, handleEventHorizonCallback } from "../services/auth";
import { ehLoginRedirectSchema } from "../shared";

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

// ─── Event Horizon OAuth ─────────────────────────────

export async function eventHorizonLoginRedirect(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = ehLoginRedirectSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "redirect_uri query parameter is required and must be a valid URL",
      });
      return;
    }

    const authorizeUrl = initiateEventHorizonLogin(parsed.data.redirect_uri);
    res.redirect(authorizeUrl);
  } catch (error) {
    next(error);
  }
}

export async function eventHorizonCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const { code, state, error: oauthError, error_description } = req.query;

    if (oauthError) {
      console.error("[EH Callback] OAuth error:", oauthError, error_description);
      res.status(400).json({
        success: false,
        message: `Event Horizon denied the request: ${oauthError}${error_description ? ` — ${error_description}` : ""}`,
      });
      return;
    }

    if (typeof code !== "string" || typeof state !== "string") {
      res.status(400).json({
        success: false,
        message: "Missing code or state parameter",
      });
      return;
    }

    const { redirectUri, accessToken, refreshToken } = await handleEventHorizonCallback(code, state);

    // Redirect back to the client with tokens
    const separator = redirectUri.includes("?") ? "&" : "?";
    const targetUrl = `${redirectUri}${separator}access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;

    res.redirect(targetUrl);
  } catch (error) {
    next(error);
  }
}
