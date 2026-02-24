// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validate = (schema: ZodSchema, source: "body" | "query" = "body") => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(source === "body" ? req.body : req.query);
      if (source === "body") {
        req.body = data;
      } else {
        (req as any).validatedQuery = data;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        error.errors.forEach((e) => {
          const path = e.path.join(".");
          if (!errors[path]) errors[path] = [];
          errors[path].push(e.message);
        });

        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }
      next(error);
    }
  };
};
