import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { CAMPAIGN_STATUSES, CONTENT_PLATFORMS } from "@/lib/types";

// Accepts an ISO string (or Date) and coerces to Date; "" and null → null.
const zDateOptional = z.preprocess(
  (v) => (v === "" || v === null ? null : typeof v === "string" ? new Date(v) : v),
  z.date().nullable().optional(),
);

const createCampaignSchema = z.object({
  productId: z.string().min(1),
  contentIdeaId: z.string().min(1).nullable().optional(),
  personaId: z.string().min(1).nullable().optional(),
  videoPromptId: z.string().min(1).nullable().optional(),
  platform: z.enum(CONTENT_PLATFORMS),
  title: z.string().min(1),
  videoStyle: z.string().nullable().optional(),
  hookUsed: z.string().nullable().optional(),
  scriptText: z.string().nullable().optional(),
  captionText: z.string().nullable().optional(),
  promptText: z.string().nullable().optional(),
  status: z.enum(CAMPAIGN_STATUSES).default("GENERATED"),
  scheduledDate: zDateOptional,
  notes: z.string().nullable().optional(),
});

export async function GET() {
  const campaigns = await db.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { id: true, name: true, platform: true } },
      persona: { select: { id: true, name: true } },
      results: { orderBy: { recordedAt: "desc" } },
    },
  });
  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const data = parsed.data;
  try {
    const campaign = await db.campaign.create({
      data: {
        productId: data.productId,
        contentIdeaId: data.contentIdeaId ?? null,
        personaId: data.personaId ?? null,
        videoPromptId: data.videoPromptId ?? null,
        platform: data.platform,
        title: data.title,
        videoStyle: data.videoStyle ?? null,
        hookUsed: data.hookUsed ?? null,
        scriptText: data.scriptText ?? null,
        captionText: data.captionText ?? null,
        promptText: data.promptText ?? null,
        status: data.status,
        scheduledDate: data.scheduledDate ?? null,
        notes: data.notes ?? null,
      },
      include: {
        product: { select: { id: true, name: true, platform: true } },
        persona: { select: { id: true, name: true } },
        results: true,
      },
    });
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err) {
    // Foreign key violations (unknown productId / personaId / etc.)
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2003") {
      return NextResponse.json(
        { error: "Related record not found (check productId / personaId / contentIdeaId / videoPromptId)" },
        { status: 400 },
      );
    }
    console.error("POST /api/campaigns failed", err);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
