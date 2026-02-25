// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import { Router } from "express";
import { createApiKey, listApiKeys, revokeApiKey } from "../controllers/apiKeys";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createApiKeySchema } from "../shared";

export const apiKeyRouter = Router();

// All API key routes require authentication (JWT only — you can't use an API key to manage API keys)
apiKeyRouter.use(authenticate);

apiKeyRouter.post("/", validate(createApiKeySchema), createApiKey);
apiKeyRouter.get("/", listApiKeys);
apiKeyRouter.delete("/:id", revokeApiKey);
