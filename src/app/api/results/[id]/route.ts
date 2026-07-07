import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const metricInt = z.number().int().min(0);
const metricMoney = z.number().min(0);

const updateResultSchema = z.object({
  periodLabel: z.string().trim().max(80).nullable().optional(),
  views: metricInt.optional(),
  likes: metricInt.optional(),
  comments: metricInt.optional(),
  shares: metricInt.optional(),
  saves: metricInt.optional(),
  clicks: metricInt.optional(),
  orders: metricInt.optional(),
  gmv: metricMoney.optional(),
  commission: metricMoney.optional(),
  recordedAt: z.coerce.date().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

/**
 * PATCH /api/results/[id]
 * Partially updates a result snapshot (metrics, period, date, notes).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateResultSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    const existing = await db.campaignResult.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    const result = await db.campaignResult.update({
      where: { id },
      data: {
        ...(data.periodLabel !== undefined && {
          periodLabel: data.periodLabel || null,
        }),
        ...(data.views !== undefined && { views: data.views }),
        ...(data.likes !== undefined && { likes: data.likes }),
        ...(data.comments !== undefined && { comments: data.comments }),
        ...(data.shares !== undefined && { shares: data.shares }),
        ...(data.saves !== undefined && { saves: data.saves }),
        ...(data.clicks !== undefined && { clicks: data.clicks }),
        ...(data.orders !== undefined && { orders: data.orders }),
        ...(data.gmv !== undefined && { gmv: data.gmv }),
        ...(data.commission !== undefined && { commission: data.commission }),
        ...(data.recordedAt !== undefined && { recordedAt: data.recordedAt }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Failed to update result", error);
    return NextResponse.json(
      { error: "Failed to update result" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/results/[id]
 * Removes a result snapshot.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const existing = await db.campaignResult.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    await db.campaignResult.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete result", error);
    return NextResponse.json(
      { error: "Failed to delete result" },
      { status: 500 }
    );
  }
}
