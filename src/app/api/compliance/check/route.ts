import { NextRequest, NextResponse } from "next/server";
import { runComplianceRules } from "@/lib/compliance";
import { db } from "@/lib/db";

// POST /api/compliance/check
// body: { text: string, productId?: string, isAiGenerated?: boolean, save?: boolean (default true) }
// → { verdict, score, hasDisclosure, flags }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const text = typeof body?.text === "string" ? body.text : "";
    if (!text.trim()) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const productId =
      typeof body?.productId === "string" && body.productId.length > 0
        ? body.productId
        : undefined;
    const isAiGenerated = Boolean(body?.isAiGenerated);
    const save = body?.save === undefined ? true : Boolean(body.save);

    let riskCategory = "GENERAL";
    let resolvedProductId: string | undefined;
    if (productId) {
      const product = await db.product.findUnique({
        where: { id: productId },
        select: { id: true, riskCategory: true },
      });
      if (product) {
        riskCategory = product.riskCategory;
        resolvedProductId = product.id;
      }
    }

    const result = runComplianceRules({ text, riskCategory, isAiGenerated });

    if (save) {
      await db.complianceCheck.create({
        data: {
          contentText: text.slice(0, 2000),
          verdict: result.verdict,
          score: result.score,
          flagsJson: JSON.stringify(result.flags),
          hasDisclosure: result.hasDisclosure,
          checkedBy: "RULES",
          productId: resolvedProductId,
        },
      });
    }

    return NextResponse.json({
      verdict: result.verdict,
      score: result.score,
      hasDisclosure: result.hasDisclosure,
      flags: result.flags,
    });
  } catch (error) {
    console.error("POST /api/compliance/check failed", error);
    return NextResponse.json({ error: "Compliance check failed" }, { status: 500 });
  }
}
