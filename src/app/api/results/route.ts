import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const metricInt = z.number().int().min(0).default(0);
const metricMoney = z.number().min(0).default(0);

const createResultSchema = z.object({
  campaignId: z.string().min(1, "campaignId is required"),
  periodLabel: z.string().trim().max(80).optional().nullable(),
  views: metricInt,
  likes: metricInt,
  comments: metricInt,
  shares: metricInt,
  saves: metricInt,
  clicks: metricInt,
  orders: metricInt,
  gmv: metricMoney,
  commission: metricMoney,
  recordedAt: z.coerce.date().optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

/**
 * GET /api/results?campaignId=...
 * Lists CampaignResults (newest first) with campaign title/platform.
 * Optional campaignId filter.
 */
export async function GET(req: NextRequest) {
  try {
    const campaignId = req.nextUrl.searchParams.get("campaignId");

    const results = await db.campaignResult.findMany({
      where: campaignId ? { campaignId } : undefined,
      include: { campaign: { select: { title: true, platform: true } } },
      orderBy: { recordedAt: "desc" },
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Failed to list results", error);
    return NextResponse.json(
      { error: "Failed to list results" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/results
 * Creates a manual result snapshot for a campaign. All metrics default to 0.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createResultSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    const campaign = await db.campaign.findUnique({
      where: { id: data.campaignId },
      select: { id: true },
    });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const result = await db.campaignResult.create({
      data: {
        campaignId: data.campaignId,
        periodLabel: data.periodLabel || null,
        views: data.views,
        likes: data.likes,
        comments: data.comments,
        shares: data.shares,
        saves: data.saves,
        clicks: data.clicks,
        orders: data.orders,
        gmv: data.gmv,
        commission: data.commission,
        recordedAt: data.recordedAt ?? new Date(),
        source: "MANUAL",
        notes: data.notes || null,
      },
    });

    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    console.error("Failed to create result", error);
    return NextResponse.json(
      { error: "Failed to create result" },
      { status: 500 }
    );
  }
}
