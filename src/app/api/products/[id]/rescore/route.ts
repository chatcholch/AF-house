import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  computeOpportunityScore,
  DEFAULT_WEIGHTS,
  validateWeights,
  type ScoringWeights,
} from "@/lib/scoring";

type RouteContext = { params: Promise<{ id: string }> };

/** Load scoring weights from AppSetting "scoringWeights", falling back to defaults. */
async function getScoringWeights(): Promise<ScoringWeights> {
  try {
    const setting = await db.appSetting.findUnique({ where: { key: "scoringWeights" } });
    if (!setting) return DEFAULT_WEIGHTS;
    const parsed = JSON.parse(setting.valueJson) as Partial<ScoringWeights>;
    const weights: ScoringWeights = { ...DEFAULT_WEIGHTS, ...parsed };
    if (validateWeights(weights) !== null) return DEFAULT_WEIGHTS;
    return weights;
  } catch {
    return DEFAULT_WEIGHTS;
  }
}

// ---------------------------------------------------------------------------
// POST /api/products/[id]/rescore — force recompute the opportunity score
// ---------------------------------------------------------------------------

export async function POST(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const weights = await getScoringWeights();
  const breakdown = computeOpportunityScore(existing, weights);

  const [product] = await db.$transaction([
    db.product.update({
      where: { id },
      data: { opportunityScore: breakdown.total },
    }),
    db.opportunityScore.updateMany({
      where: { productId: id, isCurrent: true },
      data: { isCurrent: false },
    }),
    db.opportunityScore.create({
      data: {
        productId: id,
        total: breakdown.total,
        trendMomentum: breakdown.trendMomentum,
        brandStrength: breakdown.brandStrength,
        commission: breakdown.commission,
        viralityPotential: breakdown.viralityPotential,
        competitionGap: breakdown.competitionGap,
        complianceSafety: breakdown.complianceSafety,
        weightsJson: JSON.stringify(weights),
        explanationJson: JSON.stringify(breakdown.explanations),
        isCurrent: true,
      },
    }),
  ]);

  return NextResponse.json({ product, breakdown });
}
