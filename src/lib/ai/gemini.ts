// Gemini provider — used when AI_PROVIDER=gemini and GEMINI_API_KEY is set.
// Uses the Generative Language REST API directly (no SDK dependency).

import { LlmProvider } from "./llm-provider";

export class GeminiProvider extends LlmProvider {
  readonly name = "gemini";

  constructor(
    private apiKey: string,
    private model = process.env.GEMINI_MODEL || "gemini-2.0-flash"
  ) {
    super();
  }

  protected async complete(system: string, user: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          temperature: 0.8,
          responseMimeType: "application/json",
        },
      }),
    });
    if (!res.ok) {
      throw new Error(`Gemini API error ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  }
}
