// Ovo — Smart Task Manager
// API Key service — generate, list, revoke, and validate API keys
// SPDX-License-Identifier: GPL-3.0

import crypto from "crypto";
import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

const KEY_PREFIX = "ovo_k_";
const KEY_BYTES = 32; // 32 bytes = 64 hex chars

function generateRawKey(): string {
  return KEY_PREFIX + crypto.randomBytes(KEY_BYTES).toString("hex");
}

function hashKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

function getPrefix(rawKey: string): string {
  // Store first 12 chars for identification (includes "ovo_k_" + 6 hex)
  return rawKey.slice(0, 12);
}

export async function createApiKey(userId: string, name: string) {
  // Limit to 10 keys per user
  const count = await prisma.apiKey.count({ where: { userId } });
  if (count >= 10) {
    throw new AppError("Maximum of 10 API keys per user", 400);
  }

  const rawKey = generateRawKey();
  const keyHash = hashKey(rawKey);
  const keyPrefix = getPrefix(rawKey);

  const apiKey = await prisma.apiKey.create({
    data: {
      name,
      keyHash,
      keyPrefix,
      userId,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      createdAt: true,
    },
  });

  // Return the raw key ONCE — it's never stored or retrievable again
  return {
    ...apiKey,
    createdAt: apiKey.createdAt.toISOString(),
    key: rawKey,
  };
}

export async function listApiKeys(userId: string) {
  const keys = await prisma.apiKey.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return keys.map((k) => ({
    ...k,
    lastUsedAt: k.lastUsedAt?.toISOString() || null,
    createdAt: k.createdAt.toISOString(),
  }));
}

export async function revokeApiKey(userId: string, keyId: string) {
  const key = await prisma.apiKey.findFirst({
    where: { id: keyId, userId },
  });

  if (!key) {
    throw new AppError("API key not found", 404);
  }

  await prisma.apiKey.delete({ where: { id: keyId } });
}

/**
 * Validates a raw API key and returns the userId if valid.
 * Also updates lastUsedAt (fire-and-forget, non-blocking).
 */
export async function validateApiKey(rawKey: string): Promise<string | null> {
  if (!rawKey.startsWith(KEY_PREFIX)) {
    return null;
  }

  const keyHash = hashKey(rawKey);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: { id: true, userId: true },
  });

  if (!apiKey) {
    return null;
  }

  // Update lastUsedAt in the background — don't block the request
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {
      // Silently ignore — lastUsedAt is non-critical
    });

  return apiKey.userId;
}
