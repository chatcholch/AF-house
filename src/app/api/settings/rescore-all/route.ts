import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeOpportunityScore, DEFAULT_WEIGHTS, type ScoringWeights } from "@/lib/scoring";

export const dynamic = "force-dynamic";

async function loadWeights(): Promise<ScoringWeights> {
  try {
    const row = await db.appSetting.findUnique({ where: { key: "scoringWeights" } });
    if (row) {
      const parsed = JSON.parse(row.valueJson);
      if (parsed && typeof parsed === "object") {
        return { ...DEFAULT_WEIGHTS, ...parsed };
      }
    }
  } catch {
    // fall through to defaults
  }
  return { ...DEFAULT_WEIGHTS };
}

/**
 * POST /api/settings/rescore-all
 * Recomputes the opportunity score for every product using the weights stored
 * in AppSetting (falling back to DEFAULT_WEIGHTS), updates the cached
 * product.opportunityScore, retires previous OpportunityScore rows and
 * creates fresh current ones. Returns { updated: n }.
 */
export async function POST() {
  try {
    const weights = await loadWeights();
    const products = await db.product.findMany();

    let updated = 0;
    for (const product of products) {
      const breakdown = computeOpportunityScore(product, weights);
      await db.$transaction([
        db.product.update({
          where: { id: product.id },
          data: { opportunityScore: breakdown.total },
        }),
        db.opportunityScore.updateMany({
          where: { productId: product.id, isCurrent: true },
          data: { isCurrent: false },
        }),
        db.opportunityScore.create({
          data: {
            productId: product.id,
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
      updated++;
    }

    return NextResponse.json({ updated });
  } catch (error) {
    console.error("Failed to rescore products", error);
    return NextResponse.json({ error: "Failed to rescore products" }, { status: 500 });
  }
}
