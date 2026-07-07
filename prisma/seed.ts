// Seed data for Affiliate Command Center.
// Run with: npm run db:seed  (or npx prisma db seed)

import { PrismaClient } from "@prisma/client";
import { computeOpportunityScore, DEFAULT_WEIGHTS } from "../src/lib/scoring";
import { MockAiProvider } from "../src/lib/ai/mock";
import { runComplianceRules } from "../src/lib/compliance";
import type { GenerationOptions } from "../src/lib/ai/provider";

const db = new PrismaClient();
const ai = new MockAiProvider();

const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);
const daysAhead = (n: number) => new Date(Date.now() + n * DAY);

async function main() {
  console.log("Clearing existing data…");
  await db.campaignResult.deleteMany();
  await db.complianceCheck.deleteMany();
  await db.campaign.deleteMany();
  await db.videoPrompt.deleteMany();
  await db.caption.deleteMany();
  await db.script.deleteMany();
  await db.contentIdea.deleteMany();
  await db.opportunityScore.deleteMany();
  await db.trendSignal.deleteMany();
  await db.affiliateLink.deleteMany();
  await db.platformProductData.deleteMany();
  await db.product.deleteMany();
  await db.persona.deleteMany();
  await db.integrationCredential.deleteMany();
  await db.appSetting.deleteMany();

  // -------------------------------------------------------------------------
  // Personas (fictional — EDIT DEFAULT PERSONA HERE)
  // -------------------------------------------------------------------------
  console.log("Creating personas…");
  const nara = await db.persona.create({
    data: {
      name: "Nara",
      isDefault: true,
      isFictional: true,
      ageRange: "Early-to-mid 20s appearance",
      style: "Clean, minimal, approachable — everyday Bangkok casual",
      voiceTone: "Warm, calm, friendly — like a helpful friend, never salesy",
      personality:
        "Curious, honest, a little playful. Recommends carefully, admits limitations, never pressures.",
      clothingStyle:
        "Plain soft-tone t-shirts or light knit tops, minimal accessories, tidy natural look",
      background:
        "Cozy, softly lit room corner — warm neutral walls, small plant, tidy desk or shelf",
      cameraStyle:
        "Handheld selfie framing at chest-up, slight natural movement, TikTok-native feel",
      speakingStyle:
        "Simple natural spoken Thai (or casual English), short sentences, real pauses, no hype words",
      doList: [
        "Explain products like a helpful friend",
        "Show the product clearly at chest height",
        "Give one honest consideration before the CTA",
        "Keep claims sensory and verifiable",
        "Stay consistent in face, hair, and style across videos",
      ].join("\n"),
      dontList: [
        "Never hard-sell or shout",
        "Never claim medical or guaranteed results",
        "Never imitate a real person or celebrity",
        "Never fake long-term personal usage",
        "Never use fake scarcity",
      ].join("\n"),
      consistencyPrompt:
        "Same fictional Thai/Asian young woman across all videos: shoulder-length black hair with soft natural waves, warm light-medium skin tone, friendly rounded face with gentle smile, light natural makeup. Identical facial features, hairstyle, and styling in every video.",
      visualDescription:
        "A fictional Thai/Asian young adult woman in her early 20s, shoulder-length black hair, warm friendly eyes, light natural makeup, wearing a plain soft-colored top. Trustworthy, relaxed, girl-next-door energy. Entirely fictional — not modeled on any real person.",
      brandSafeRules:
        "Fictional persona only; no real-person likeness. Conservative claims. Affiliate disclosure always present. Friendly, honest, family-safe language.",
    },
  });

  const tan = await db.persona.create({
    data: {
      name: "Tan",
      isDefault: false,
      isFictional: true,
      ageRange: "Late 20s appearance",
      style: "Smart-casual tech reviewer — tidy, slightly nerdy, credible",
      voiceTone: "Even, confident, informative — a calm explainer",
      personality:
        "Detail-oriented and fair. Loves specs and practical tests. Always mentions who should NOT buy.",
      clothingStyle: "Plain dark tee or casual button-up, clean silhouette",
      background: "Minimal desk setup with soft key light and blurred shelf background",
      cameraStyle: "Tripod-static chest-up framing with occasional product close-up cutaways",
      speakingStyle:
        "Clear structured Thai-English mix, numbered points, practical comparisons, no fluff",
      doList: [
        "Lead with the practical use case",
        "Give one clear pro and one con",
        "Show real handling of the product",
        "Use numbers only when verifiable",
      ].join("\n"),
      dontList: [
        "No hype superlatives",
        "No fake benchmarks",
        "No celebrity comparisons",
        "No pressure CTAs",
      ].join("\n"),
      consistencyPrompt:
        "Same fictional Thai/Asian man across all videos: short neat black hair, light stubble, thin black-framed glasses, medium build. Identical face, glasses, and styling in every video.",
      visualDescription:
        "A fictional Thai/Asian man in his late 20s, short neat hair, thin black-framed glasses, calm smile, wearing a plain dark t-shirt. Credible tech-reviewer energy. Entirely fictional — not modeled on any real person.",
      brandSafeRules:
        "Fictional persona only. Specs must match the listing. Disclosure always present. No competitor bashing.",
    },
  });

  // -------------------------------------------------------------------------
  // Products
  // -------------------------------------------------------------------------
  console.log("Creating products…");

  interface SeedProduct {
    name: string;
    brand: string | null;
    category: string;
    description: string;
    price: number;
    commissionRate: number;
    platform: string;
    status: string;
    riskCategory: string;
    isNewLaunch?: boolean;
    isKnownBrand?: boolean;
    isRising?: boolean;
    isSeasonal?: boolean;
    isEvergreen?: boolean;
    seasonalWindow?: string;
    demandScore: number;
    trendScore: number;
    competitionScore: number;
    contentDifficultyScore: number;
    trustScore: number;
    launchDate?: Date;
    tags: string;
    notes?: string;
    signals: { signalType: string; strength: number; note: string }[];
  }

  const products: SeedProduct[] = [
    {
      name: "CeraVe Hydrating Cream-to-Foam Cleanser 236ml",
      brand: "CeraVe",
      category: "Skincare",
      description:
        "New cream-to-foam cleanser with ceramides and hyaluronic acid, launched for the Thai market this month.",
      price: 495,
      commissionRate: 12,
      platform: "BOTH",
      status: "TEST",
      riskCategory: "SKINCARE",
      isNewLaunch: true,
      isKnownBrand: true,
      isRising: true,
      launchDate: daysAgo(12),
      demandScore: 82,
      trendScore: 78,
      competitionScore: 35,
      contentDifficultyScore: 25,
      trustScore: 88,
      tags: "skincare,cleanser,new launch,ceramides,derm brand",
      notes:
        "Classic early-opportunity pattern: trusted derm brand + fresh launch + low video coverage. Routine-style content fits perfectly.",
      signals: [
        { signalType: "KNOWN_BRAND_LAUNCH", strength: 90, note: "CeraVe TH launch post 12 days ago" },
        { signalType: "RISING", strength: 76, note: "Search interest climbing week-over-week" },
        { signalType: "LOW_COMPETITION", strength: 70, note: "Only a handful of TH creator videos so far" },
      ],
    },
    {
      name: "Mini Portable Blender 380ml USB-C",
      brand: "JuiceGo",
      category: "Kitchen Appliances",
      description:
        "Cordless personal blender, USB-C charging, blends smoothies in 30 seconds. Viral on TikTok in neighboring markets.",
      price: 590,
      commissionRate: 18,
      platform: "TIKTOK_SHOP",
      status: "ACTIVE",
      riskCategory: "GENERAL",
      isRising: true,
      isEvergreen: true,
      demandScore: 75,
      trendScore: 84,
      competitionScore: 55,
      contentDifficultyScore: 20,
      trustScore: 62,
      tags: "kitchen,blender,portable,smoothie,viral",
      notes: "Demo-friendly, very visual. Rising fast — worth testing multiple hooks this week.",
      signals: [
        { signalType: "TRENDING", strength: 82, note: "Trending in VN/ID TikTok Shop; TH catching up" },
        { signalType: "HIGH_COMMISSION", strength: 72, note: "18% commission on ฿590" },
      ],
    },
    {
      name: "Anessa Perfect UV Sunscreen Skincare Milk SPF50+ (2026)",
      brand: "Anessa",
      category: "Skincare",
      description:
        "2026 reformulation of the best-selling sunscreen milk — lighter texture, same protection.",
      price: 890,
      commissionRate: 10,
      platform: "SHOPEE",
      status: "WATCHLIST",
      riskCategory: "SKINCARE",
      isNewLaunch: true,
      isKnownBrand: true,
      launchDate: daysAgo(25),
      demandScore: 85,
      trendScore: 70,
      competitionScore: 65,
      contentDifficultyScore: 30,
      trustScore: 90,
      tags: "sunscreen,skincare,known brand,reformulation,summer",
      isSeasonal: true,
      seasonalWindow: "Hot season (Mar–Jun)",
      signals: [
        { signalType: "KNOWN_BRAND_LAUNCH", strength: 85, note: "2026 reformulation announcement" },
        { signalType: "SEASONAL", strength: 75, note: "Sunscreen demand peaks into hot season" },
      ],
    },
    {
      name: "Ergonomic Laptop Stand Foldable Aluminum",
      brand: "DeskMate",
      category: "Gadgets & Accessories",
      description: "Foldable aluminum laptop stand, 6 height levels, folds flat to 2cm.",
      price: 359,
      commissionRate: 15,
      platform: "BOTH",
      status: "ACTIVE",
      riskCategory: "GENERAL",
      isEvergreen: true,
      demandScore: 65,
      trendScore: 55,
      competitionScore: 60,
      contentDifficultyScore: 25,
      trustScore: 60,
      tags: "wfh,desk setup,laptop,ergonomic,evergreen",
      notes: "Reliable evergreen. Good filler content between launch plays.",
      signals: [
        { signalType: "EVERGREEN", strength: 70, note: "Steady WFH demand" },
        { signalType: "HIGH_COMMISSION", strength: 60, note: "15% on ฿359" },
      ],
    },
    {
      name: "Collagen Dipeptide Plus Vitamin C (30 sachets)",
      brand: "VitaLab",
      category: "Supplements",
      description: "Collagen supplement powder, unflavored, dissolves in water.",
      price: 990,
      commissionRate: 20,
      platform: "SHOPEE",
      status: "WATCHLIST",
      riskCategory: "SUPPLEMENT",
      demandScore: 78,
      trendScore: 60,
      competitionScore: 80,
      contentDifficultyScore: 55,
      trustScore: 45,
      tags: "supplement,collagen,beauty,high commission",
      notes:
        "High commission but crowded space + strict claim rules. Only worth it with a very safe angle.",
      signals: [
        { signalType: "HIGH_COMMISSION", strength: 85, note: "20% ≈ ฿198/sale" },
      ],
    },
    {
      name: "Smart LED Sunset Projection Lamp",
      brand: "GlowNest",
      category: "Home & Living",
      description: "USB sunset-projection lamp with 16 colors, remote control, aesthetic room vibe.",
      price: 249,
      commissionRate: 22,
      platform: "TIKTOK_SHOP",
      status: "TEST",
      riskCategory: "GENERAL",
      isRising: true,
      demandScore: 68,
      trendScore: 80,
      competitionScore: 45,
      contentDifficultyScore: 15,
      trustScore: 55,
      tags: "room decor,aesthetic,led,viral,gift",
      notes: "Extremely visual product — showcase-only videos should perform.",
      signals: [
        { signalType: "TRENDING", strength: 78, note: "#roomdecor trend rising on TikTok TH" },
        { signalType: "HIGH_COMMISSION", strength: 80, note: "22% commission" },
      ],
    },
    {
      name: "Laneige Bouncy & Firm Sleeping Mask 60ml",
      brand: "Laneige",
      category: "Skincare",
      description: "New sleeping mask line extension launched this quarter.",
      price: 1190,
      commissionRate: 11,
      platform: "BOTH",
      status: "WATCHLIST",
      riskCategory: "SKINCARE",
      isNewLaunch: true,
      isKnownBrand: true,
      launchDate: daysAgo(40),
      demandScore: 72,
      trendScore: 62,
      competitionScore: 50,
      contentDifficultyScore: 35,
      trustScore: 82,
      tags: "skincare,sleeping mask,known brand,k-beauty",
      signals: [
        { signalType: "KNOWN_BRAND_LAUNCH", strength: 72, note: "Line extension from trusted K-beauty brand" },
      ],
    },
    {
      name: "Xiaomi Smart Air Fryer 4.5L (2026 model)",
      brand: "Xiaomi",
      category: "Kitchen Appliances",
      description: "New 4.5L smart air fryer with app control, launched last week.",
      price: 1990,
      commissionRate: 8,
      platform: "SHOPEE",
      status: "WATCHLIST",
      riskCategory: "GENERAL",
      isNewLaunch: true,
      isKnownBrand: true,
      isRising: true,
      launchDate: daysAgo(6),
      demandScore: 80,
      trendScore: 74,
      competitionScore: 40,
      contentDifficultyScore: 35,
      trustScore: 85,
      tags: "air fryer,kitchen,xiaomi,new launch,smart home",
      notes: "Launch-window play. Recipe-style content = repeatable series.",
      signals: [
        { signalType: "KNOWN_BRAND_LAUNCH", strength: 88, note: "Launched 6 days ago" },
        { signalType: "RISING", strength: 70, note: "Early listing sales velocity strong" },
      ],
    },
    {
      name: "Peptide Lip Treatment Balm",
      brand: "Glowry",
      category: "Beauty",
      description: "New-brand peptide lip balm in 4 shades — soft glossy finish.",
      price: 320,
      commissionRate: 25,
      platform: "TIKTOK_SHOP",
      status: "TEST",
      riskCategory: "BEAUTY",
      isNewLaunch: true,
      isRising: true,
      launchDate: daysAgo(9),
      demandScore: 66,
      trendScore: 77,
      competitionScore: 30,
      contentDifficultyScore: 28,
      trustScore: 40,
      tags: "lip balm,beauty,new brand,peptide,trending",
      notes:
        "New-brand drop with top-tier commission and low saturation. Trust is the gap — honest-review angle.",
      signals: [
        { signalType: "NEW_BRAND_DROP", strength: 80, note: "Brand launched this month on TikTok Shop" },
        { signalType: "HIGH_COMMISSION", strength: 90, note: "25% launch commission" },
        { signalType: "LOW_COMPETITION", strength: 75, note: "Almost no TH reviews yet" },
      ],
    },
    {
      name: "Cordless Fabric Shaver & Lint Remover",
      brand: "TidyPro",
      category: "Home & Living",
      description: "Rechargeable lint remover with 3 shave heights and dust box.",
      price: 199,
      commissionRate: 17,
      platform: "BOTH",
      status: "ACTIVE",
      riskCategory: "GENERAL",
      isEvergreen: true,
      demandScore: 60,
      trendScore: 50,
      competitionScore: 50,
      contentDifficultyScore: 12,
      trustScore: 58,
      tags: "home,clothes care,satisfying,evergreen,budget",
      notes: "Satisfying before/after texture content (safe — it's fabric, not skin).",
      signals: [{ signalType: "EVERGREEN", strength: 65, note: "Steady CleanTok-style demand" }],
    },
    {
      name: "Vitamin C Brightening Serum 30ml",
      brand: "DermaThai",
      category: "Skincare",
      description: "Local-brand 10% vitamin C serum with niacinamide.",
      price: 450,
      commissionRate: 30,
      platform: "SHOPEE",
      status: "REJECTED",
      riskCategory: "SKINCARE",
      demandScore: 70,
      trendScore: 45,
      competitionScore: 90,
      contentDifficultyScore: 60,
      trustScore: 35,
      tags: "serum,vitamin c,high commission,crowded",
      notes:
        "Rejected: 30% commission is bait — space is saturated, brand unproven, and claims pressure is high.",
      signals: [{ signalType: "HIGH_COMMISSION", strength: 95, note: "30% commission" }],
    },
    {
      name: "Foldable Silicone Travel Bottle Set (4pc)",
      brand: "TripKit",
      category: "Travel & Lifestyle",
      description: "Leak-proof silicone travel bottles, TSA-friendly sizes.",
      price: 279,
      commissionRate: 16,
      platform: "SHOPEE",
      status: "WATCHLIST",
      riskCategory: "GENERAL",
      isSeasonal: true,
      seasonalWindow: "Songkran & school holidays (Mar–May)",
      demandScore: 58,
      trendScore: 62,
      competitionScore: 35,
      contentDifficultyScore: 22,
      trustScore: 55,
      tags: "travel,songkran,packing,seasonal",
      notes: "Time the push 2-3 weeks before Songkran travel wave.",
      signals: [{ signalType: "SEASONAL", strength: 72, note: "Travel season approaching" }],
    },
    {
      name: "Posture-Correcting Desk Chair Cushion",
      brand: "SitWell",
      category: "Home & Living",
      description: "Memory-foam cushion with ergonomic tilt for office chairs.",
      price: 690,
      commissionRate: 14,
      platform: "BOTH",
      status: "TEST",
      riskCategory: "HEALTH",
      demandScore: 63,
      trendScore: 58,
      competitionScore: 42,
      contentDifficultyScore: 40,
      trustScore: 52,
      tags: "office,posture,wfh,comfort",
      notes:
        "HEALTH-adjacent: talk comfort, never pain treatment. Claim checker set to strict for this one.",
      signals: [{ signalType: "RISING", strength: 55, note: "Office-syndrome content trending" }],
    },
    {
      name: "Matte Long-wear Cushion Foundation SPF35",
      brand: "Fenty-style NewBrand KIRA",
      category: "Beauty",
      description: "New local brand cushion with 8 shades for Thai skin tones.",
      price: 559,
      commissionRate: 21,
      platform: "TIKTOK_SHOP",
      status: "WATCHLIST",
      riskCategory: "BEAUTY",
      isNewLaunch: true,
      launchDate: daysAgo(15),
      demandScore: 64,
      trendScore: 60,
      competitionScore: 58,
      contentDifficultyScore: 45,
      trustScore: 42,
      tags: "cushion,foundation,new brand,makeup",
      signals: [
        { signalType: "NEW_BRAND_DROP", strength: 68, note: "Launched 15 days ago" },
        { signalType: "HIGH_COMMISSION", strength: 75, note: "21% commission" },
      ],
    },
    {
      name: "Electrolyte Hydration Powder (Watermelon)",
      brand: "HydraFuel",
      category: "Supplements",
      description: "Sugar-free electrolyte powder for gym-goers and hot-season hydration.",
      price: 690,
      commissionRate: 19,
      platform: "TIKTOK_SHOP",
      status: "WATCHLIST",
      riskCategory: "SUPPLEMENT",
      isRising: true,
      isSeasonal: true,
      seasonalWindow: "Hot season (Mar–Jun)",
      demandScore: 61,
      trendScore: 72,
      competitionScore: 38,
      contentDifficultyScore: 42,
      trustScore: 48,
      tags: "electrolyte,gym,hydration,summer,fitness",
      signals: [
        { signalType: "RISING", strength: 66, note: "Fitness-hydration content growing" },
        { signalType: "SEASONAL", strength: 70, note: "Hot season demand spike expected" },
      ],
    },
    {
      name: "Magnetic Phone Grip & Kickstand MagSafe",
      brand: "SnapGrip",
      category: "Gadgets & Accessories",
      description: "Magnetic grip that doubles as kickstand and car-vent mount.",
      price: 329,
      commissionRate: 20,
      platform: "TIKTOK_SHOP",
      status: "WINNER",
      riskCategory: "GENERAL",
      isEvergreen: true,
      demandScore: 71,
      trendScore: 63,
      competitionScore: 52,
      contentDifficultyScore: 18,
      trustScore: 60,
      tags: "phone accessory,magsafe,evergreen,winner",
      notes: "Proven winner — 3 posted videos, best conversion so far. Keep a monthly refresh video.",
      signals: [
        { signalType: "EVERGREEN", strength: 75, note: "Consistent performer over 2 months" },
        { signalType: "HIGH_COMMISSION", strength: 78, note: "20% commission" },
      ],
    },
  ];

  const created: Record<string, string> = {};
  for (const p of products) {
    const { signals, ...data } = p;
    const breakdown = computeOpportunityScore(
      { ...data, isNewLaunch: !!data.isNewLaunch, isKnownBrand: !!data.isKnownBrand, isRising: !!data.isRising, isSeasonal: !!data.isSeasonal, isEvergreen: !!data.isEvergreen, launchDate: data.launchDate ?? null },
      DEFAULT_WEIGHTS
    );
    const angles = await ai.generateProductAngles({
      id: p.name,
      name: p.name,
      brand: p.brand,
      category: p.category,
      description: p.description,
      price: p.price,
      commissionRate: p.commissionRate,
      riskCategory: p.riskCategory,
      isNewLaunch: p.isNewLaunch,
      isKnownBrand: p.isKnownBrand,
      isRising: p.isRising,
      tags: p.tags,
    });

    const product = await db.product.create({
      data: {
        ...data,
        source: "MOCK",
        opportunityScore: breakdown.total,
        whyItMightSell: angles.whyItMightSell,
        buyerPersonasJson: JSON.stringify(angles.buyerPersonas),
        painPointsJson: JSON.stringify(angles.painPoints),
        lastSyncedAt: daysAgo(Math.floor(Math.random() * 3)),
        trendSignals: {
          create: signals.map((s) => ({
            ...s,
            source: "MOCK",
            detectedAt: daysAgo(Math.floor(Math.random() * 10)),
          })),
        },
        opportunityScores: {
          create: {
            total: breakdown.total,
            trendMomentum: breakdown.trendMomentum,
            brandStrength: breakdown.brandStrength,
            commission: breakdown.commission,
            viralityPotential: breakdown.viralityPotential,
            competitionGap: breakdown.competitionGap,
            complianceSafety: breakdown.complianceSafety,
            weightsJson: JSON.stringify(breakdown.weights),
            explanationJson: JSON.stringify(breakdown.explanations),
            isCurrent: true,
          },
        },
        affiliateLinks: {
          create:
            p.platform === "BOTH"
              ? [
                  { platform: "SHOPEE", url: `https://s.shopee.co.th/mock/${slug(p.name)}`, label: "Shopee link", clicks: rand(40, 400) },
                  { platform: "TIKTOK_SHOP", url: `https://vt.tiktok.com/mock/${slug(p.name)}`, label: "TikTok Shop link", clicks: rand(40, 400) },
                ]
              : [
                  {
                    platform: p.platform,
                    url:
                      p.platform === "SHOPEE"
                        ? `https://s.shopee.co.th/mock/${slug(p.name)}`
                        : `https://vt.tiktok.com/mock/${slug(p.name)}`,
                    label: "Primary link",
                    clicks: rand(20, 500),
                  },
                ],
        },
        platformData: {
          create: (p.platform === "BOTH" ? ["SHOPEE", "TIKTOK_SHOP"] : [p.platform]).map(
            (pl) => ({
              platform: pl,
              platformProductId: `${pl.slice(0, 2)}-${rand(100000, 999999)}`,
              price: p.price,
              commissionRate: p.commissionRate,
              salesCount: rand(50, 8000),
              rating: 4 + Math.random() * 0.9,
              reviewCount: rand(10, 1500),
              stockStatus: "IN_STOCK",
              sellerName: p.brand ? `${p.brand} Official Store` : "Marketplace Seller",
              syncedAt: daysAgo(rand(0, 3)),
            })
          ),
        },
      },
    });
    created[p.name] = product.id;
  }

  // -------------------------------------------------------------------------
  // Generated content for the flagship early-opportunity products
  // -------------------------------------------------------------------------
  console.log("Generating sample content (mock AI)…");

  const genTargets: { name: string; personaId: string; options: GenerationOptions }[] = [
    {
      name: "CeraVe Hydrating Cream-to-Foam Cleanser 236ml",
      personaId: nara.id,
      options: {
        platform: "TIKTOK",
        style: "TALKING_HEAD",
        language: "TH",
        tone: "FRIENDLY",
        durationSec: 30,
        includePersona: true,
        claimStrictness: "HEALTH_BEAUTY_SAFE",
        templateKey: "known-brand-launch",
      },
    },
    {
      name: "Mini Portable Blender 380ml USB-C",
      personaId: nara.id,
      options: {
        platform: "TIKTOK",
        style: "UGC",
        language: "MIX",
        tone: "PLAYFUL",
        durationSec: 15,
        includePersona: true,
        claimStrictness: "NORMAL",
        templateKey: "before-viral",
      },
    },
    {
      name: "Smart LED Sunset Projection Lamp",
      personaId: tan.id,
      options: {
        platform: "TIKTOK",
        style: "PRODUCT_SHOWCASE",
        language: "TH",
        tone: "FRIENDLY",
        durationSec: 15,
        includePersona: false,
        claimStrictness: "NORMAL",
        templateKey: "product-showcase",
      },
    },
    {
      name: "Peptide Lip Treatment Balm",
      personaId: nara.id,
      options: {
        platform: "TIKTOK",
        style: "UGC",
        language: "TH",
        tone: "SOFT_SELL",
        durationSec: 30,
        includePersona: true,
        claimStrictness: "HEALTH_BEAUTY_SAFE",
        templateKey: "new-brand-drop",
      },
    },
  ];

  const personaById: Record<string, typeof nara> = { [nara.id]: nara, [tan.id]: tan };
  const ideaIds: Record<string, string> = {};

  for (const target of genTargets) {
    const productId = created[target.name];
    const product = await db.product.findUniqueOrThrow({ where: { id: productId } });
    const persona = personaById[target.personaId];
    const pkg = await ai.generateContentPackage(
      product,
      {
        id: persona.id,
        name: persona.name,
        ageRange: persona.ageRange,
        style: persona.style,
        voiceTone: persona.voiceTone,
        personality: persona.personality,
        clothingStyle: persona.clothingStyle,
        background: persona.background,
        cameraStyle: persona.cameraStyle,
        consistencyPrompt: persona.consistencyPrompt,
        visualDescription: persona.visualDescription,
        speakingStyle: persona.speakingStyle,
        brandSafeRules: persona.brandSafeRules,
        doList: persona.doList,
        dontList: persona.dontList,
      },
      target.options
    );

    const idea = await db.contentIdea.create({
      data: {
        productId,
        personaId: target.options.includePersona ? persona.id : null,
        platform: target.options.platform,
        style: target.options.style === "UGC" ? "UGC_REVIEW" : target.options.style === "PRODUCT_SHOWCASE" ? "PRODUCT_SHOWCASE" : "TALKING_HEAD",
        title: pkg.concepts[0].title,
        angle: pkg.concepts[0].angle,
        hook: pkg.hooks[0].text,
        concept: pkg.concepts[0].description,
        language: target.options.language,
        tone: target.options.tone,
        durationSec: target.options.durationSec,
        templateKey: target.options.templateKey,
        status: "NEEDS_REVIEW",
        generatedBy: "MOCK",
      },
    });
    ideaIds[target.name] = idea.id;

    for (const [i, s] of pkg.scripts.entries()) {
      await db.script.create({
        data: {
          productId,
          contentIdeaId: idea.id,
          title: s.title,
          durationSec: s.durationSec,
          language: target.options.language,
          tone: target.options.tone,
          style: target.options.style,
          hookLine: s.hookLine,
          body: s.body,
          shotListJson: JSON.stringify(s.shotList),
          cta: s.cta,
          generatedBy: "MOCK",
        },
      });
      if (i === 0) {
        const check = runComplianceRules({
          text: `${s.body}\n${pkg.captions[0].text} ${pkg.captions[0].disclosure}`,
          riskCategory: product.riskCategory,
          isAiGenerated: target.options.includePersona,
        });
        await db.complianceCheck.create({
          data: {
            productId,
            contentIdeaId: idea.id,
            contentText: s.body.slice(0, 500),
            verdict: check.verdict,
            score: check.score,
            flagsJson: JSON.stringify(check.flags),
            hasDisclosure: check.hasDisclosure,
            checkedBy: "RULES",
          },
        });
      }
    }

    for (const c of pkg.captions) {
      await db.caption.create({
        data: {
          productId,
          contentIdeaId: idea.id,
          platform: target.options.platform,
          text: c.text,
          hashtags: c.hashtags.join(" "),
          disclosure: c.disclosure,
          language: target.options.language,
          generatedBy: "MOCK",
        },
      });
    }

    await db.videoPrompt.create({
      data: {
        productId,
        contentIdeaId: idea.id,
        personaId: null,
        promptType: "PRODUCT_SHOWCASE",
        targetModel: "VEO",
        title: pkg.showcasePrompt.title,
        structuredJson: JSON.stringify(pkg.showcasePrompt.sections),
        compiledPrompt: pkg.showcasePrompt.compiledPrompt,
        negativePrompt: pkg.showcasePrompt.negativePrompt,
        durationSec: target.options.durationSec,
        generatedBy: "MOCK",
      },
    });
    if (pkg.personaPrompt) {
      await db.videoPrompt.create({
        data: {
          productId,
          contentIdeaId: idea.id,
          personaId: persona.id,
          promptType: "PERSONA_TALKING_HEAD",
          targetModel: "VEO",
          title: pkg.personaPrompt.title,
          structuredJson: JSON.stringify(pkg.personaPrompt.sections),
          compiledPrompt: pkg.personaPrompt.compiledPrompt,
          negativePrompt: pkg.personaPrompt.negativePrompt,
          durationSec: target.options.durationSec,
          generatedBy: "MOCK",
        },
      });
    }
  }

  // -------------------------------------------------------------------------
  // Campaigns & results (Monitor data)
  // -------------------------------------------------------------------------
  console.log("Creating campaigns & results…");

  const campaignSeeds: {
    product: string;
    title: string;
    platform: string;
    status: string;
    videoStyle: string;
    personaId?: string;
    hookUsed?: string;
    scheduledDate?: Date;
    postedDate?: Date;
    notes?: string;
    results?: {
      periodLabel: string;
      views: number;
      likes: number;
      comments: number;
      shares: number;
      saves: number;
      clicks: number;
      orders: number;
      gmv: number;
      commission: number;
      daysAgo: number;
      notes?: string;
    }[];
  }[] = [
    {
      product: "Magnetic Phone Grip & Kickstand MagSafe",
      title: "SnapGrip 3-reasons video #3",
      platform: "TIKTOK",
      status: "WINNER",
      videoStyle: "THREE_SCENE_AD",
      personaId: tan.id,
      hookUsed: "3 reasons this phone grip earned a permanent spot on my phone",
      postedDate: daysAgo(21),
      notes: "Best performer to date. Hook #4 (list type) beat problem-hook by 2.1x CTR.",
      results: [
        { periodLabel: "Week 1", views: 148000, likes: 9200, comments: 210, shares: 640, saves: 1900, clicks: 3400, orders: 96, gmv: 31584, commission: 6317, daysAgo: 14 },
        { periodLabel: "Week 2", views: 96000, likes: 5100, comments: 120, shares: 300, saves: 800, clicks: 1900, orders: 51, gmv: 16779, commission: 3356, daysAgo: 7 },
      ],
    },
    {
      product: "Mini Portable Blender 380ml USB-C",
      title: "Blender morning-routine UGC",
      platform: "TIKTOK",
      status: "TESTING",
      videoStyle: "UGC_REVIEW",
      personaId: nara.id,
      hookUsed: "เจอก่อน viral! เครื่องปั่นพกพาตัวนี้ยังเงียบอยู่ แต่ไม่นานแน่",
      postedDate: daysAgo(5),
      notes: "CTR healthy, conversion TBD — check again at day 7.",
      results: [
        { periodLabel: "Day 1-5", views: 42000, likes: 2800, comments: 85, shares: 190, saves: 610, clicks: 980, orders: 14, gmv: 8260, commission: 1487, daysAgo: 1 },
      ],
    },
    {
      product: "Mini Portable Blender 380ml USB-C",
      title: "Blender Facebook Reels cross-post",
      platform: "FACEBOOK",
      status: "POSTED",
      videoStyle: "UGC_REVIEW",
      personaId: nara.id,
      hookUsed: "Same UGC cut, FB Reels audience test",
      postedDate: daysAgo(3),
      notes: "Facebook Reels test — older audience, watch completion rate lower but clicks decent.",
      results: [
        { periodLabel: "Day 1-3", views: 18500, likes: 720, comments: 40, shares: 260, saves: 95, clicks: 510, orders: 9, gmv: 5310, commission: 956, daysAgo: 0, notes: "Shares noticeably higher on FB" },
      ],
    },
    {
      product: "CeraVe Hydrating Cream-to-Foam Cleanser 236ml",
      title: "CeraVe launch-window routine video",
      platform: "TIKTOK",
      status: "APPROVED",
      videoStyle: "TALKING_HEAD",
      personaId: nara.id,
      hookUsed: "CeraVe ออกคลีนเซอร์ตัวใหม่แล้ว มีอะไรใหม่บ้าง มาดูกัน",
      scheduledDate: daysAhead(2),
      notes: "Scheduled for Tue 19:00 — peak skincare scroll time.",
    },
    {
      product: "Smart LED Sunset Projection Lamp",
      title: "Sunset lamp aesthetic showcase",
      platform: "TIKTOK",
      status: "NEEDS_REVIEW",
      videoStyle: "PRODUCT_SHOWCASE",
      hookUsed: "POV: โคมไฟที่เพื่อนต้องถามว่าซื้อที่ไหน",
      scheduledDate: daysAhead(4),
    },
    {
      product: "Peptide Lip Treatment Balm",
      title: "Glowry honest first-try",
      platform: "TIKTOK",
      status: "GENERATED",
      videoStyle: "UGC_REVIEW",
      personaId: nara.id,
      scheduledDate: daysAhead(6),
      notes: "Wait for compliance re-check before approving (new brand, beauty claims).",
    },
    {
      product: "Xiaomi Smart Air Fryer 4.5L (2026 model)",
      title: "Air fryer launch first-look",
      platform: "SHOPEE_VIDEO",
      status: "IDEA",
      videoStyle: "UNBOXING",
      scheduledDate: daysAhead(8),
    },
    {
      product: "Cordless Fabric Shaver & Lint Remover",
      title: "Satisfying lint-shave loop",
      platform: "FACEBOOK",
      status: "IDEA",
      videoStyle: "PRODUCT_SHOWCASE",
      scheduledDate: daysAhead(10),
      notes: "FB Reels loves satisfying loops — test as first FB-first content.",
    },
    {
      product: "Vitamin C Brightening Serum 30ml",
      title: "VitC serum test video",
      platform: "TIKTOK",
      status: "FAILED",
      videoStyle: "TALKING_HEAD",
      personaId: nara.id,
      postedDate: daysAgo(30),
      notes: "Failed: 8k views, 0 orders. Saturated space confirmed. Product rejected.",
      results: [
        { periodLabel: "Week 1", views: 8000, likes: 240, comments: 6, shares: 12, saves: 40, clicks: 95, orders: 0, gmv: 0, commission: 0, daysAgo: 23, notes: "CPM fine, CTR fine, zero conversion" },
      ],
    },
  ];

  for (const c of campaignSeeds) {
    const productId = created[c.product];
    const idea = ideaIds[c.product];
    await db.campaign.create({
      data: {
        productId,
        contentIdeaId: idea ?? null,
        personaId: c.personaId ?? null,
        platform: c.platform,
        title: c.title,
        videoStyle: c.videoStyle,
        hookUsed: c.hookUsed,
        status: c.status,
        scheduledDate: c.scheduledDate,
        postedDate: c.postedDate,
        postUrl: c.postedDate ? `https://www.tiktok.com/@mock/video/${rand(1e9, 9e9)}` : null,
        notes: c.notes,
        results: c.results
          ? {
              create: c.results.map((r) => ({
                periodLabel: r.periodLabel,
                views: r.views,
                likes: r.likes,
                comments: r.comments,
                shares: r.shares,
                saves: r.saves,
                clicks: r.clicks,
                orders: r.orders,
                gmv: r.gmv,
                commission: r.commission,
                recordedAt: daysAgo(r.daysAgo),
                source: "MANUAL",
                notes: r.notes,
              })),
            }
          : undefined,
      },
    });
  }

  // -------------------------------------------------------------------------
  // Integrations & settings
  // -------------------------------------------------------------------------
  console.log("Creating integration placeholders & settings…");
  const integrations = [
    { provider: "SHOPEE_AFFILIATE", name: "Shopee Affiliate API" },
    { provider: "TIKTOK_SHOP_AFFILIATE", name: "TikTok Shop Affiliate API" },
    { provider: "FACEBOOK", name: "Facebook / Meta API" },
    { provider: "OPENAI", name: "OpenAI API" },
    { provider: "GEMINI", name: "Google Gemini API" },
  ];
  for (const i of integrations) {
    await db.integrationCredential.create({
      data: { ...i, status: "NOT_CONFIGURED", isActive: false },
    });
  }

  await db.appSetting.create({
    data: { key: "scoringWeights", valueJson: JSON.stringify(DEFAULT_WEIGHTS) },
  });
  await db.appSetting.create({
    data: { key: "aiProvider", valueJson: JSON.stringify("mock") },
  });

  const counts = {
    products: await db.product.count(),
    personas: await db.persona.count(),
    signals: await db.trendSignal.count(),
    ideas: await db.contentIdea.count(),
    scripts: await db.script.count(),
    captions: await db.caption.count(),
    prompts: await db.videoPrompt.count(),
    campaigns: await db.campaign.count(),
    results: await db.campaignResult.count(),
    checks: await db.complianceCheck.count(),
  };
  console.log("Seed complete:", counts);
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
