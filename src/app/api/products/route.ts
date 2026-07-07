import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  computeOpportunityScore,
  DEFAULT_WEIGHTS,
  validateWeights,
  type ScoringWeights,
} from "@/lib/scoring";
import { PRODUCT_PLATFORMS, PRODUCT_STATUSES, RISK_CATEGORIES } from "@/lib/types";

/** Load scoring weights from AppSetting "scoringWeights", falling back to defaults. */
async function getScoringWeights(): Promise<ScoringWeights> {
  try {
    const setting = await db.appSetting.findUnique({ where: { key: "scoringWeights" } });
    if (!setting) return DEFAULT_WEIGHTS;
    const parsed = JSON.parse(setting.valueJson) as Partial<ScoringWeights>;
    const weights: ScoringWeights = { ...DEFAULT_WEIGHTS, ...parsed };
    // Invalid custom weights (don't sum to 1) fall back to the defaults.
    if (validateWeights(weights) !== null) return DEFAULT_WEIGHTS;
    return weights;
  } catch {
    return DEFAULT_WEIGHTS;
  }
}

// ---------------------------------------------------------------------------
// GET /api/products — list products (optional query filters)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q") ?? sp.get("search");
  const platform = sp.get("platform");
  const category = sp.get("category");
  const status = sp.get("status");
  const minScore = Number(sp.get("minScore") ?? 0);
  const minCommission = Number(sp.get("minCommission") ?? 0);

  const where: Prisma.ProductWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { brand: { contains: q } },
      { category: { contains: q } },
    ];
  }
  if (platform && platform !== "ALL") {
    // A product listed on BOTH platforms matches either single-platform filter.
    where.platform = platform === "BOTH" ? "BOTH" : { in: [platform, "BOTH"] };
  }
  if (category && category !== "ALL") where.category = category;
  if (status && status !== "ALL") where.status = status;
  if (minScore > 0) where.opportunityScore = { gte: minScore };
  if (minCommission > 0) where.commissionRate = { gte: minCommission };

  const products = await db.product.findMany({
    where,
    include: {
      trendSignals: { orderBy: { detectedAt: "desc" } },
      affiliateLinks: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { opportunityScore: "desc" },
  });

  return NextResponse.json({ products });
}

// ---------------------------------------------------------------------------
// POST /api/products — create a product (source MANUAL) + initial score/signals
// ---------------------------------------------------------------------------

const score0to100 = z.coerce.number().int().min(0).max(100);

const createProductSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  category: z.string().trim().min(1, "Category is required"),
  brand: z.string().trim().optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be 0 or more"),
  commissionRate: z.coerce.number().min(0).max(100).default(0),
  platform: z.enum(PRODUCT_PLATFORMS).default("SHOPEE"),
  riskCategory: z.enum(RISK_CATEGORIES).default("GENERAL"),
  status: z.enum(PRODUCT_STATUSES).default("WATCHLIST"),
  isNewLaunch: z.boolean().default(false),
  isKnownBrand: z.boolean().default(false),
  isRising: z.boolean().default(false),
  isSeasonal: z.boolean().default(false),
  isEvergreen: z.boolean().default(false),
  seasonalWindow: z.string().optional(),
  demandScore: score0to100.default(50),
  trendScore: score0to100.default(50),
  competitionScore: score0to100.default(50),
  contentDifficultyScore: score0to100.default(50),
  trustScore: score0to100.default(50),
  launchDate: z.string().optional().nullable(),
  productUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  affiliateUrl: z.string().optional(),
  whyItMightSell: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
});

/** Best-effort platform for an affiliate link, guessed from the URL. */
function affiliateLinkPlatform(url: string, productPlatform: string): string {
  const u = url.toLowerCase();
  if (u.includes("tiktok")) return "TIKTOK_SHOP";
  if (u.includes("shopee") || u.includes("shp.ee")) return "SHOPEE";
  return productPlatform === "BOTH" ? "OTHER" : productPlatform;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createProductSchema.safeParse(body);
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

  let launchDate: Date | null = null;
  if (data.launchDate) {
    const d = new Date(data.launchDate);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "launchDate is not a valid date" }, { status: 400 });
    }
    launchDate = d;
  }

  const weights = await getScoringWeights();
  const breakdown = computeOpportunityScore({ ...data, launchDate }, weights);

  // Initial trend signals for whichever opportunity flags are set.
  const signals: Prisma.TrendSignalCreateWithoutProductInput[] = [];
  if (data.isNewLaunch) {
    signals.push({
      signalType: data.isKnownBrand ? "KNOWN_BRAND_LAUNCH" : "NEW_BRAND_DROP",
      source: "MANUAL",
      strength: 70,
      note: "Flagged as a new launch when added manually",
    });
  }
  if (data.isRising) {
    signals.push({
      signalType: "RISING",
      source: "MANUAL",
      strength: Math.max(data.trendScore, 50),
      note: "Flagged as rising when added manually",
    });
  }
  if (data.isSeasonal) {
    signals.push({
      signalType: "SEASONAL",
      source: "MANUAL",
      strength: 60,
      note: data.seasonalWindow?.trim() || "Flagged as seasonal when added manually",
    });
  }
  if (data.isEvergreen) {
    signals.push({
      signalType: "EVERGREEN",
      source: "MANUAL",
      strength: 55,
      note: "Flagged as evergreen when added manually",
    });
  }

  const affiliateUrl = data.affiliateUrl?.trim();

  const product = await db.product.create({
    data: {
      name: data.name,
      category: data.category,
      brand: data.brand?.trim() || null,
      description: data.description?.trim() || null,
      price: data.price,
      commissionRate: data.commissionRate,
      platform: data.platform,
      riskCategory: data.riskCategory,
      status: data.status,
      source: "MANUAL",
      isNewLaunch: data.isNewLaunch,
      isKnownBrand: data.isKnownBrand,
      isRising: data.isRising,
      isSeasonal: data.isSeasonal,
      isEvergreen: data.isEvergreen,
      seasonalWindow: data.seasonalWindow?.trim() || null,
      demandScore: data.demandScore,
      trendScore: data.trendScore,
      competitionScore: data.competitionScore,
      contentDifficultyScore: data.contentDifficultyScore,
      trustScore: data.trustScore,
      opportunityScore: breakdown.total,
      launchDate,
      productUrl: data.productUrl?.trim() || null,
      imageUrl: data.imageUrl?.trim() || null,
      whyItMightSell: data.whyItMightSell?.trim() || null,
      tags: data.tags?.trim() || null,
      notes: data.notes?.trim() || null,
      opportunityScores: {
        create: {
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
      },
      trendSignals: signals.length > 0 ? { create: signals } : undefined,
      affiliateLinks: affiliateUrl
        ? {
            create: {
              platform: affiliateLinkPlatform(affiliateUrl, data.platform),
              url: affiliateUrl,
              label: "Primary link",
            },
          }
        : undefined,
    },
    include: {
      trendSignals: true,
      affiliateLinks: true,
      opportunityScores: { where: { isCurrent: true } },
    },
  });

  return NextResponse.json({ product, breakdown }, { status: 201 });
}
