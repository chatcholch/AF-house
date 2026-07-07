import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAiProvider } from "@/lib/ai";

export const dynamic = "force-dynamic";

/**
 * POST /api/products/[id]/angles
 * Generates fresh product angles via the configured AI provider, persists
 * whyItMightSell / buyerPersonasJson / painPointsJson on the product and
 * returns the full ProductAngles payload (contentAngles, riskWarnings and
 * productBenefits are generated on demand and not stored).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const product = await db.product.findUnique({ where: { id } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  try {
    const provider = await getAiProvider();
    const angles = await provider.generateProductAngles(product);

    await db.product.update({
      where: { id },
      data: {
        whyItMightSell: angles.whyItMightSell,
        buyerPersonasJson: JSON.stringify(angles.buyerPersonas),
        painPointsJson: JSON.stringify(angles.painPoints),
      },
    });

    return NextResponse.json(angles);
  } catch (error) {
    console.error("Failed to generate product angles", error);
    return NextResponse.json(
      { error: "Failed to generate product angles" },
      { status: 500 }
    );
  }
}
