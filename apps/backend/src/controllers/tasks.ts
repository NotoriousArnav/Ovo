// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import * as taskService from "../services/tasks";

export async function getTasks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await taskService.getTasks(req.userId!, (req as any).validatedQuery);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getTask(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const task = await taskService.getTaskById(req.userId!, req.params.id as string);
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

export async function createTask(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const task = await taskService.createTask(req.userId!, req.body);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

export async function updateTask(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const task = await taskService.updateTask(req.userId!, req.params.id as string, req.body);
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

export async function deleteTask(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await taskService.deleteTask(req.userId!, req.params.id as string);
    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    next(error);
  }
}

export async function getTaskStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const stats = await taskService.getTaskStats(req.userId!);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}
