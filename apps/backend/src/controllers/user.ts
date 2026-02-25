// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";
import { notificationSettingsSchema } from "../shared";

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      data: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getNotificationTime(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        notificationHour: true,
        notificationMinute: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      data: {
        hour: user.notificationHour,
        minute: user.notificationMinute,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateNotificationTime(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = notificationSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { hour, minute } = parsed.data;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        notificationHour: hour,
        notificationMinute: minute,
      },
      select: {
        notificationHour: true,
        notificationMinute: true,
      },
    });

    res.json({
      success: true,
      data: {
        hour: user.notificationHour,
        minute: user.notificationMinute,
      },
    });
  } catch (error) {
    next(error);
  }
}
