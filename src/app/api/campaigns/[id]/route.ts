import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { CAMPAIGN_STATUSES, CONTENT_PLATFORMS } from "@/lib/types";

// Accepts an ISO string (or Date) and coerces to Date; "" and null → null.
const zDateOptional = z.preprocess(
  (v) => (v === "" || v === null ? null : typeof v === "string" ? new Date(v) : v),
  z.date().nullable().optional(),
);

const patchCampaignSchema = z.object({
  productId: z.string().min(1).optional(),
  contentIdeaId: z.string().min(1).nullable().optional(),
  personaId: z.string().min(1).nullable().optional(),
  videoPromptId: z.string().min(1).nullable().optional(),
  platform: z.enum(CONTENT_PLATFORMS).optional(),
  title: z.string().min(1).optional(),
  videoStyle: z.string().nullable().optional(),
  hookUsed: z.string().nullable().optional(),
  scriptText: z.string().nullable().optional(),
  captionText: z.string().nullable().optional(),
  promptText: z.string().nullable().optional(),
  status: z.enum(CAMPAIGN_STATUSES).optional(),
  scheduledDate: zDateOptional,
  postedDate: zDateOptional,
  postUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const fullInclude = {
  product: true,
  persona: true,
  contentIdea: true,
  videoPrompt: true,
  results: { orderBy: { recordedAt: "desc" as const } },
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id }, include: fullInclude });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  return NextResponse.json({ campaign });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const existing = await db.campaign.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const data = { ...parsed.data };
  // Marking as posted without an explicit posted date stamps it now.
  if (data.status === "POSTED" && data.postedDate === undefined && !existing.postedDate) {
    data.postedDate = new Date();
  }

  try {
    const campaign = await db.campaign.update({ where: { id }, data, include: fullInclude });
    return NextResponse.json({ campaign });
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2003") {
      return NextResponse.json(
        { error: "Related record not found (check productId / personaId / contentIdeaId / videoPromptId)" },
        { status: 400 },
      );
    }
    console.error(`PATCH /api/campaigns/${id} failed`, err);
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.campaign.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
    console.error(`DELETE /api/campaigns/${id} failed`, err);
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }
}
