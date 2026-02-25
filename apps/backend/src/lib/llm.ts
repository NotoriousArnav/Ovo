// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import { ChatGroq } from "@langchain/groq";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

// ─── LLM Model Factory ──────────────────────────────
// Returns a LangChain chat model configured from environment variables.
// Currently supports Groq; add more providers by extending the switch.

const AI_PROVIDER = process.env.AI_PROVIDER || "groq";
const AI_MODEL = process.env.AI_MODEL || "llama-3.3-70b-versatile";

let _model: BaseChatModel | null = null;

/**
 * Returns true if AI features are configured (i.e. the required API key is set).
 */
export function isAIConfigured(): boolean {
  switch (AI_PROVIDER) {
    case "groq":
      return !!process.env.GROQ_API_KEY;
    default:
      return false;
  }
}

/**
 * Returns a singleton LangChain chat model.
 * Throws if the required API key is not configured.
 */
export function getModel(): BaseChatModel {
  if (_model) return _model;

  switch (AI_PROVIDER) {
    case "groq":
      if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not set — AI features are unavailable");
      }
      _model = new ChatGroq({
        model: AI_MODEL,
        temperature: 0.3,
        maxRetries: 2,
      });
      break;

    default:
      throw new Error(`Unsupported AI_PROVIDER: ${AI_PROVIDER}`);
  }

  return _model;
}
