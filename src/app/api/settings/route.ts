import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_WEIGHTS, validateWeights, type ScoringWeights } from "@/lib/scoring";
import { AI_PROVIDERS, type AiProviderName } from "@/lib/types";

export const dynamic = "force-dynamic";

const WEIGHT_KEYS: (keyof ScoringWeights)[] = [
  "trendMomentum",
  "brandStrength",
  "commission",
  "viralityPotential",
  "competitionGap",
  "complianceSafety",
];

async function readSettings(): Promise<{
  scoringWeights: ScoringWeights;
  aiProvider: AiProviderName;
}> {
  const rows = await db.appSetting.findMany({
    where: { key: { in: ["scoringWeights", "aiProvider"] } },
  });

  let scoringWeights: ScoringWeights = { ...DEFAULT_WEIGHTS };
  let aiProvider: AiProviderName = "mock";

  for (const row of rows) {
    try {
      const value = JSON.parse(row.valueJson);
      if (row.key === "scoringWeights" && value && typeof value === "object") {
        scoringWeights = { ...DEFAULT_WEIGHTS, ...value };
      }
      if (row.key === "aiProvider" && (AI_PROVIDERS as readonly string[]).includes(value)) {
        aiProvider = value as AiProviderName;
      }
    } catch {
      // ignore malformed rows, keep defaults
    }
  }
  return { scoringWeights, aiProvider };
}

/** GET /api/settings — current scoring weights + AI provider choice. */
export async function GET() {
  return NextResponse.json(await readSettings());
}

/**
 * PATCH /api/settings
 * Body: { scoringWeights?: ScoringWeights, aiProvider?: "mock"|"openai"|"gemini" }
 */
export async function PATCH(req: NextRequest) {
  let body: { scoringWeights?: Partial<ScoringWeights>; aiProvider?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.scoringWeights !== undefined) {
    const input = body.scoringWeights;
    if (!input || typeof input !== "object") {
      return NextResponse.json({ error: "scoringWeights must be an object" }, { status: 400 });
    }
    const weights = {} as ScoringWeights;
    for (const key of WEIGHT_KEYS) {
      const value = Number(input[key]);
      if (!Number.isFinite(value) || value < 0 || value > 1) {
        return NextResponse.json(
          { error: `scoringWeights.${key} must be a number between 0 and 1` },
          { status: 400 }
        );
      }
      weights[key] = value;
    }
    const validationError = validateWeights(weights);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
    await db.appSetting.upsert({
      where: { key: "scoringWeights" },
      update: { valueJson: JSON.stringify(weights) },
      create: { key: "scoringWeights", valueJson: JSON.stringify(weights) },
    });
  }

  if (body.aiProvider !== undefined) {
    if (!(AI_PROVIDERS as readonly string[]).includes(body.aiProvider)) {
      return NextResponse.json(
        { error: `aiProvider must be one of: ${AI_PROVIDERS.join(", ")}` },
        { status: 400 }
      );
    }
    await db.appSetting.upsert({
      where: { key: "aiProvider" },
      update: { valueJson: JSON.stringify(body.aiProvider) },
      create: { key: "aiProvider", valueJson: JSON.stringify(body.aiProvider) },
    });
  }

  return NextResponse.json(await readSettings());
}
