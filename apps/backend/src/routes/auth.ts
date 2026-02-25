// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import { Router } from "express";
import { register, login, refresh, logout } from "../controllers/auth";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema, refreshTokenSchema } from "../shared";

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/refresh", validate(refreshTokenSchema), refresh);
authRouter.post("/logout", logout);
