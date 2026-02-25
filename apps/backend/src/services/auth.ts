// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import type { RegisterInput, LoginInput } from "../shared";

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const EH_STATE_EXPIRY = "5m";

function generateAccessToken(userId: string): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new AppError("JWT_ACCESS_SECRET not configured", 500);
  return jwt.sign({ userId }, secret, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

// ─── EH OAuth helpers ────────────────────────────────

function getEHConfig() {
  const clientId = process.env.EH_CLIENT_ID;
  const clientSecret = process.env.EH_CLIENT_SECRET;
  const ehUrl = process.env.EH_URL || "https://events.neopanda.tech";
  const allowedRedirects = (process.env.EH_ALLOWED_REDIRECTS || "").split(",").map((s) => s.trim()).filter(Boolean);

  if (!clientId || !clientSecret) {
    throw new AppError("Event Horizon OAuth is not configured", 500);
  }

  return { clientId, clientSecret, ehUrl, allowedRedirects };
}

function signStateToken(payload: Record<string, unknown>): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new AppError("JWT_ACCESS_SECRET not configured", 500);
  return jwt.sign(payload, secret, { expiresIn: EH_STATE_EXPIRY });
}

function verifyStateToken(token: string): { redirectUri: string; nonce: string; codeVerifier: string } {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new AppError("JWT_ACCESS_SECRET not configured", 500);
  try {
    return jwt.verify(token, secret) as { redirectUri: string; nonce: string; codeVerifier: string };
  } catch {
    throw new AppError("Invalid or expired OAuth state", 400);
  }
}

// ─── Local Auth ──────────────────────────────────────

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  return {
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
    tokens: { accessToken, refreshToken },
  };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.passwordHash) {
    throw new AppError("This account uses Event Horizon login. Please sign in with Event Horizon.", 401);
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
    tokens: { accessToken, refreshToken },
  };
}

export async function refreshAccessToken(refreshTokenValue: string) {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshTokenValue },
    include: { user: true },
  });

  if (!storedToken) {
    throw new AppError("Invalid refresh token", 401);
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new AppError("Refresh token expired", 401);
  }

  // Rotate refresh token
  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  const accessToken = generateAccessToken(storedToken.userId);
  const newRefreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: storedToken.userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logoutUser(refreshTokenValue: string) {
  await prisma.refreshToken.deleteMany({
    where: { token: refreshTokenValue },
  });
}

// ─── Event Horizon OAuth ─────────────────────────────

export function initiateEventHorizonLogin(redirectUri: string): string {
  const { clientId, ehUrl, allowedRedirects } = getEHConfig();

  if (!allowedRedirects.includes(redirectUri)) {
    throw new AppError("Redirect URI not allowed", 400);
  }

  const nonce = crypto.randomBytes(16).toString("hex");

  // PKCE: generate code_verifier and code_challenge
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  const state = signStateToken({ redirectUri, nonce, codeVerifier });

  // Build the backend callback URL (same origin as the request)
  const backendUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${process.env.PORT || 3001}`;
  const callbackUri = `${backendUrl}/api/auth/eventhorizon/callback`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: callbackUri,
    scope: "read",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const authorizeUrl = `${ehUrl}/o/authorize/?${params.toString()}`;

  return authorizeUrl;
}

export async function handleEventHorizonCallback(code: string, state: string) {
  const { clientId, clientSecret, ehUrl } = getEHConfig();
  const { redirectUri, codeVerifier } = verifyStateToken(state);

  // Build the backend callback URL (must match what was sent in authorize)
  const backendUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${process.env.PORT || 3001}`;
  const callbackUri = `${backendUrl}/api/auth/eventhorizon/callback`;

  // 1. Exchange code for EH access token
  const tokenRes = await fetch(`${ehUrl}/o/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUri,
      client_id: clientId,
      client_secret: clientSecret,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("[EH Token Error]", err);
    throw new AppError("Failed to exchange authorization code with Event Horizon", 502);
  }

  const tokenData = (await tokenRes.json()) as { access_token: string };

  // 2. Fetch user profile from EH
  const profileRes = await fetch(`${ehUrl}/accounts/api/me/`, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!profileRes.ok) {
    throw new AppError("Failed to fetch profile from Event Horizon", 502);
  }

  const profile = (await profileRes.json()) as {
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };

  if (!profile.email) {
    throw new AppError("Event Horizon account has no email address", 400);
  }

  // 3. Find or create Ovo user (auto-link if existing)
  const ehName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.username;

  let user = await prisma.user.findUnique({
    where: { email: profile.email },
  });

  if (user) {
    // Auto-link: update authProvider if they were previously local-only
    if (user.authProvider !== "eventhorizon") {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { authProvider: "eventhorizon" },
      });
    }
  } else {
    // Create new user with no password
    user = await prisma.user.create({
      data: {
        name: ehName,
        email: profile.email,
        passwordHash: null,
        authProvider: "eventhorizon",
      },
    });
  }

  // 4. Generate Ovo tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  return { redirectUri, accessToken, refreshToken };
}
