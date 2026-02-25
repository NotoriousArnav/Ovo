// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger";
import { authRouter } from "./routes/auth";
import { taskRouter } from "./routes/tasks";
import { userRouter } from "./routes/user";
import { apiKeyRouter } from "./routes/apiKeys";
import { aiRouter } from "./routes/ai";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// ─── Middleware ───────────────────────────────────────
// Helmet for all routes except /api/docs (Swagger UI needs inline scripts/styles)
app.use("/api/docs", helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(/^(?!\/api\/docs)/, helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "10kb" }));

// ─── Health Check ────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "Ovo API is running", timestamp: new Date().toISOString() });
});

// ─── API Documentation ──────────────────────────────
app.get("/api/docs.json", (_req, res) => {
  res.json(swaggerDocument);
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: "Ovo API Docs",
  customCss: ".swagger-ui .topbar { display: none }",
}));

// ─── Routes ──────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/user", userRouter);
app.use("/api/keys", apiKeyRouter);
app.use("/api/ai", aiRouter);

// ─── 404 Handler ─────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Error Handler ───────────────────────────────────
app.use(errorHandler);

export default app;
