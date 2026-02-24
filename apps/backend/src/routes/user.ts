// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import { Router } from "express";
import { getProfile } from "../controllers/user";
import { authenticate } from "../middleware/auth";

export const userRouter = Router();

userRouter.use(authenticate);

userRouter.get("/profile", getProfile);
