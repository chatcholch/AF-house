// OpenAI provider — used when AI_PROVIDER=openai and OPENAI_API_KEY is set.
// Uses the Chat Completions REST API directly (no SDK dependency).

import { LlmProvider } from "./llm-provider";

export class OpenAiProvider extends LlmProvider {
  readonly name = "openai";

  constructor(
    private apiKey: string,
    private model = process.env.OPENAI_MODEL || "gpt-4o-mini"
  ) {
    super();
  }

  protected async complete(system: string, user: string): Promise<string> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.8,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      throw new Error(`OpenAI API error ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    return data.choices[0]?.message?.content ?? "";
  }
}
