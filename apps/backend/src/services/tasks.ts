// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import type { CreateTaskInput, UpdateTaskInput, TaskFiltersInput } from "../shared";
import { Prisma, TaskStatus, TaskPriority } from "@prisma/client";

// Map shared types to Prisma enums
const statusMap: Record<string, TaskStatus> = {
  pending: "PENDING",
  in_progress: "IN_PROGRESS",
  completed: "COMPLETED",
};

const priorityMap: Record<string, TaskPriority> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
};

const reverseStatusMap: Record<TaskStatus, string> = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

const reversePriorityMap: Record<TaskPriority, string> = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

function serializeTask(task: any) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: reverseStatusMap[task.status as TaskStatus],
    priority: reversePriorityMap[task.priority as TaskPriority],
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    userId: task.userId,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export async function getTasks(userId: string, filters: TaskFiltersInput) {
  const where: Prisma.TaskWhereInput = { userId };

  if (filters.status) {
    where.status = statusMap[filters.status];
  }

  if (filters.priority) {
    where.priority = priorityMap[filters.priority];
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      orderBy: { [filters.sortBy]: filters.sortOrder },
    }),
    prisma.task.count({ where }),
  ]);

  return {
    data: tasks.map(serializeTask),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export async function getTaskById(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  return serializeTask(task);
}

export async function createTask(userId: string, input: CreateTaskInput) {
  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description || "",
      status: statusMap[input.status || "pending"],
      priority: priorityMap[input.priority || "medium"],
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      userId,
    },
  });

  return serializeTask(task);
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput
) {
  // Verify ownership
  const existing = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!existing) {
    throw new AppError("Task not found", 404);
  }

  const data: any = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.status !== undefined) data.status = statusMap[input.status];
  if (input.priority !== undefined) data.priority = priorityMap[input.priority];
  if (input.dueDate !== undefined)
    data.dueDate = input.dueDate ? new Date(input.dueDate) : null;

  const task = await prisma.task.update({
    where: { id: taskId },
    data,
  });

  return serializeTask(task);
}

export async function deleteTask(userId: string, taskId: string) {
  const existing = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!existing) {
    throw new AppError("Task not found", 404);
  }

  await prisma.task.delete({ where: { id: taskId } });
}

export async function getTaskStats(userId: string) {
  const [total, pending, inProgress, completed] = await Promise.all([
    prisma.task.count({ where: { userId } }),
    prisma.task.count({ where: { userId, status: "PENDING" } }),
    prisma.task.count({ where: { userId, status: "IN_PROGRESS" } }),
    prisma.task.count({ where: { userId, status: "COMPLETED" } }),
  ]);

  return {
    total,
    pending,
    inProgress,
    completed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}
