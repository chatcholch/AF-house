import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  computeOpportunityScore,
  DEFAULT_WEIGHTS,
  validateWeights,
  type ScoringWeights,
} from "@/lib/scoring";
import { PRODUCT_PLATFORMS, PRODUCT_STATUSES, RISK_CATEGORIES } from "@/lib/types";

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
// GET /api/products/[id] — single product with relations
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    include: {
      platformData: true,
      affiliateLinks: { orderBy: { createdAt: "asc" } },
      trendSignals: { orderBy: { detectedAt: "desc" } },
      opportunityScores: { orderBy: { computedAt: "desc" }, take: 10 },
      contentIdeas: { orderBy: { createdAt: "desc" } },
      campaigns: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  return NextResponse.json({ product });
}

// ---------------------------------------------------------------------------
// PATCH /api/products/[id] — partial update, rescoring when inputs change
// ---------------------------------------------------------------------------

const score0to100 = z.coerce.number().int().min(0).max(100);

const updateProductSchema = z.object({
  name: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  brand: z.string().trim().nullable().optional(),
  description: z.string().nullable().optional(),
  price: z.coerce.number().min(0).optional(),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
  platform: z.enum(PRODUCT_PLATFORMS).optional(),
  riskCategory: z.enum(RISK_CATEGORIES).optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
  isNewLaunch: z.boolean().optional(),
  isKnownBrand: z.boolean().optional(),
  isRising: z.boolean().optional(),
  isSeasonal: z.boolean().optional(),
  isEvergreen: z.boolean().optional(),
  seasonalWindow: z.string().nullable().optional(),
  demandScore: score0to100.optional(),
  trendScore: score0to100.optional(),
  competitionScore: score0to100.optional(),
  contentDifficultyScore: score0to100.optional(),
  trustScore: score0to100.optional(),
  launchDate: z.string().nullable().optional(),
  productUrl: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  whyItMightSell: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// Fields that feed computeOpportunityScore — changing any of them triggers a rescore.
const SCORING_KEYS = [
  "price",
  "commissionRate",
  "demandScore",
  "trendScore",
  "competitionScore",
  "contentDifficultyScore",
  "trustScore",
  "isNewLaunch",
  "isKnownBrand",
  "isRising",
  "isSeasonal",
  "isEvergreen",
  "riskCategory",
] as const;

const PRODUCT_INCLUDE = {
  trendSignals: { orderBy: { detectedAt: "desc" } },
  affiliateLinks: { orderBy: { createdAt: "asc" } },
} as const;

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues
          .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
          .join("; "),
      },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  let launchDate: Date | null | undefined;
  if (data.launchDate !== undefined) {
    if (data.launchDate === null || data.launchDate === "") {
      launchDate = null;
    } else {
      const d = new Date(data.launchDate);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: "launchDate is not a valid date" }, { status: 400 });
      }
      launchDate = d;
    }
  }

  const scoringChanged =
    SCORING_KEYS.some((k) => data[k] !== undefined && data[k] !== existing[k]) ||
    (launchDate !== undefined &&
      (launchDate?.getTime() ?? null) !== (existing.launchDate?.getTime() ?? null));

  const { launchDate: _rawLaunchDate, ...rest } = data;
  void _rawLaunchDate;

  let product = await db.product.update({
    where: { id },
    data: { ...rest, launchDate },
    include: PRODUCT_INCLUDE,
  });

  if (!scoringChanged) {
    return NextResponse.json({ product });
  }

  const weights = await getScoringWeights();
  const breakdown = computeOpportunityScore(product, weights);

  const [updated] = await db.$transaction([
    db.product.update({
      where: { id },
      data: { opportunityScore: breakdown.total },
      include: PRODUCT_INCLUDE,
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
  product = updated;

  return NextResponse.json({ product, breakdown });
}

// ---------------------------------------------------------------------------
// DELETE /api/products/[id]
// ---------------------------------------------------------------------------

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const existing = await db.product.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  await db.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
