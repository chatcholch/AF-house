// Shared prompt-building + JSON parsing for the OpenAI and Gemini providers.
//
// Both real providers work the same way: build one system+user prompt pair
// per generation task, ask the model to return strict JSON, and validate the
// shape before returning. If anything fails, callers fall back to the mock
// provider so the app never breaks.

import type { GenerationOptions, PersonaInput, ProductInput } from "./provider";

export const SYSTEM_PROMPT = `You are a senior short-form video strategist for Shopee/TikTok/Facebook affiliate marketing in Thailand.
Rules you must always follow:
- Content must feel natural, human, trustworthy — never spammy or hard-selling.
- Always include an affiliate disclosure where captions are produced.
- Never impersonate real people or celebrities; presenters are fictional AI personas.
- No exaggerated, medical, or guaranteed-result claims. For skincare/supplement/health/beauty products use conservative sensory wording and add "results vary".
- No fake scarcity, fake discounts, or fabricated personal usage history.
- Thai output should be casual, friendly spoken Thai (ภาษาพูด), not stiff formal Thai.
Respond ONLY with valid JSON matching the requested schema. No markdown fences, no commentary.`;

export function productContext(product: ProductInput): string {
  return [
    `Product: ${product.name}`,
    product.brand ? `Brand: ${product.brand}` : null,
    `Category: ${product.category}`,
    product.description ? `Description: ${product.description}` : null,
    `Price: ฿${product.price}`,
    `Commission: ${product.commissionRate}%`,
    `Risk category: ${product.riskCategory}`,
    product.isNewLaunch ? "This is a NEW LAUNCH (early opportunity)." : null,
    product.isKnownBrand ? "This is a KNOWN, trusted brand." : null,
    product.isRising ? "Trend signals show RISING interest." : null,
    product.tags ? `Tags: ${product.tags}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function optionsContext(options: GenerationOptions, persona: PersonaInput | null): string {
  const lang =
    options.language === "TH"
      ? "Thai (casual spoken)"
      : options.language === "EN"
        ? "English (conversational)"
        : "Thai mixed with natural English loanwords";
  return [
    `Target platform: ${options.platform}`,
    `Video style: ${options.style}`,
    `Language: ${lang}`,
    `Tone: ${options.tone}`,
    `Duration: ${options.durationSec} seconds`,
    `Claim strictness: ${options.claimStrictness}`,
    persona && options.includePersona
      ? `Fictional AI persona presenter: ${persona.name} — ${persona.visualDescription}. Voice/tone: ${persona.voiceTone}. Speaking style: ${persona.speakingStyle}.`
      : "No persona presenter (product-only content).",
  ].join("\n");
}

// Strip markdown fences and parse JSON defensively.
export function parseJson<T>(raw: string): T {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf(text.startsWith("[") ? "[" : "{");
  const end = text.lastIndexOf(text.startsWith("[") ? "]" : "}");
  if (start >= 0 && end > start) text = text.slice(start, end + 1);
  return JSON.parse(text) as T;
}
