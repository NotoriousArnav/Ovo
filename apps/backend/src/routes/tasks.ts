// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import { Router } from "express";
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats,
} from "../controllers/tasks";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createTaskSchema, updateTaskSchema, taskFiltersSchema } from "@ovo/shared";

export const taskRouter = Router();

// All task routes require authentication
taskRouter.use(authenticate);

taskRouter.get("/", validate(taskFiltersSchema, "query"), getTasks);
taskRouter.get("/stats", getTaskStats);
taskRouter.get("/:id", getTask);
taskRouter.post("/", validate(createTaskSchema), createTask);
taskRouter.put("/:id", validate(updateTaskSchema), updateTask);
taskRouter.delete("/:id", deleteTask);
