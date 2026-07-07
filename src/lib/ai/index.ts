// AI provider factory.
//
// Provider selection order:
//   1. AppSetting "aiProvider" (set from the Settings page), if present
//   2. AI_PROVIDER env var
//   3. mock
// Falls back to mock whenever the chosen provider's key is missing.

import { db } from "../db";
import type { AiProvider } from "./provider";
import { MockAiProvider } from "./mock";
import { OpenAiProvider } from "./openai";
import { GeminiProvider } from "./gemini";

export type { AiProvider } from "./provider";
export * from "./provider";

const mockProvider = new MockAiProvider();

async function credential(provider: string): Promise<string | null> {
  try {
    const row = await db.integrationCredential.findUnique({ where: { provider } });
    return row?.isActive && row.apiKey ? row.apiKey : null;
  } catch {
    return null;
  }
}

export async function getAiProvider(): Promise<AiProvider> {
  let choice = process.env.AI_PROVIDER || "mock";
  try {
    const setting = await db.appSetting.findUnique({ where: { key: "aiProvider" } });
    if (setting) choice = JSON.parse(setting.valueJson);
  } catch {
    // table may not exist yet (before first db push) — fall through to env
  }

  if (choice === "openai") {
    const key = process.env.OPENAI_API_KEY || (await credential("OPENAI"));
    if (key) return new OpenAiProvider(key);
  }
  if (choice === "gemini") {
    const key = process.env.GEMINI_API_KEY || (await credential("GEMINI"));
    if (key) return new GeminiProvider(key);
  }
  return mockProvider;
}
