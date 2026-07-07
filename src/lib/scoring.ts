// Opportunity Scoring Engine
//
// Produces a 0-100 opportunity score from six weighted components.
// ADJUST WEIGHTS HERE: edit DEFAULT_WEIGHTS below (they must sum to 1.0).
// Weights can also be overridden at runtime via the AppSetting key
// "scoringWeights" (managed from the Settings page).

import type { ScoreExplanation } from "./types";

export interface ScoringWeights {
  trendMomentum: number; // rising interest, social buzz, recency of launch
  brandStrength: number; // known brand, trust score
  commission: number; // commission attractiveness (rate x price)
  viralityPotential: number; // how easy this is to make engaging short video
  competitionGap: number; // low content saturation = higher score
  complianceSafety: number; // low claim/compliance risk = higher score
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  trendMomentum: 0.25,
  brandStrength: 0.15,
  commission: 0.15,
  viralityPotential: 0.2,
  competitionGap: 0.15,
  complianceSafety: 0.1,
};

// Minimal shape the scorer needs — matches the Prisma Product model.
export interface ScorableProduct {
  price: number;
  commissionRate: number;
  demandScore: number;
  trendScore: number;
  competitionScore: number; // higher = more competition
  contentDifficultyScore: number; // higher = harder content
  trustScore: number;
  isNewLaunch: boolean;
  isKnownBrand: boolean;
  isRising: boolean;
  isSeasonal: boolean;
  isEvergreen: boolean;
  riskCategory: string;
  launchDate?: Date | string | null;
}

export interface ScoreBreakdown {
  total: number;
  trendMomentum: number;
  brandStrength: number;
  commission: number;
  viralityPotential: number;
  competitionGap: number;
  complianceSafety: number;
  weights: ScoringWeights;
  explanations: ScoreExplanation[];
}

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

// Risk categories carry an inherent compliance penalty (they need careful
// wording, so all else equal they are a slightly weaker opportunity).
const RISK_PENALTY: Record<string, number> = {
  GENERAL: 0,
  SKINCARE: 20,
  BEAUTY: 20,
  SUPPLEMENT: 35,
  HEALTH: 35,
  FINANCE: 30,
  KIDS: 15,
};

export function computeTrendMomentum(p: ScorableProduct): number {
  let score = p.trendScore * 0.6 + p.demandScore * 0.25;
  if (p.isRising) score += 12;
  if (p.isNewLaunch) score += 10;
  if (p.launchDate) {
    const days = (Date.now() - new Date(p.launchDate).getTime()) / 86_400_000;
    if (days >= 0 && days <= 30) score += 8; // launched within the last month
    else if (days <= 90) score += 4;
  }
  return clamp(Math.round(score));
}

export function computeBrandStrength(p: ScorableProduct): number {
  let score = p.trustScore * 0.7;
  if (p.isKnownBrand) score += 30;
  return clamp(Math.round(score));
}

export function computeCommission(p: ScorableProduct): number {
  // Rate matters most; absolute payout per sale matters too.
  const rateScore = clamp((p.commissionRate / 20) * 100); // 20%+ = max
  const payout = (p.price * p.commissionRate) / 100;
  const payoutScore = clamp((payout / 300) * 100); // ฿300+ per sale = max
  return clamp(Math.round(rateScore * 0.65 + payoutScore * 0.35));
}

export function computeViralityPotential(p: ScorableProduct): number {
  // Easy-to-show products (low content difficulty) with real demand go viral.
  let score = (100 - p.contentDifficultyScore) * 0.65 + p.demandScore * 0.3;
  if (p.isSeasonal) score += 5; // timely content gets algorithmic lift
  return clamp(Math.round(score));
}

export function computeCompetitionGap(p: ScorableProduct): number {
  // Less competition = bigger gap = better score.
  let score = 100 - p.competitionScore;
  if (p.isNewLaunch) score += 10; // new launches start with low saturation
  return clamp(Math.round(score));
}

export function computeComplianceSafety(p: ScorableProduct): number {
  const penalty = RISK_PENALTY[p.riskCategory] ?? 0;
  const score = p.trustScore * 0.5 + 50 - penalty;
  return clamp(Math.round(score));
}

export function computeOpportunityScore(
  p: ScorableProduct,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): ScoreBreakdown {
  const trendMomentum = computeTrendMomentum(p);
  const brandStrength = computeBrandStrength(p);
  const commission = computeCommission(p);
  const viralityPotential = computeViralityPotential(p);
  const competitionGap = computeCompetitionGap(p);
  const complianceSafety = computeComplianceSafety(p);

  const total = Math.round(
    trendMomentum * weights.trendMomentum +
      brandStrength * weights.brandStrength +
      commission * weights.commission +
      viralityPotential * weights.viralityPotential +
      competitionGap * weights.competitionGap +
      complianceSafety * weights.complianceSafety
  );

  const explanations: ScoreExplanation[] = [
    {
      component: "Trend momentum",
      score: trendMomentum,
      weight: weights.trendMomentum,
      reason: p.isRising
        ? "Interest is rising fast — early-mover window is open."
        : p.isNewLaunch
          ? "Recently launched — low awareness, growing search interest."
          : "Based on current trend and demand inputs.",
    },
    {
      component: "Brand strength",
      score: brandStrength,
      weight: weights.brandStrength,
      reason: p.isKnownBrand
        ? "Known, trusted brand — buyers need less convincing."
        : "Lesser-known brand — content must build trust itself.",
    },
    {
      component: "Commission",
      score: commission,
      weight: weights.commission,
      reason: `${p.commissionRate}% rate ≈ ฿${Math.round((p.price * p.commissionRate) / 100)} per sale.`,
    },
    {
      component: "Virality potential",
      score: viralityPotential,
      weight: weights.viralityPotential,
      reason:
        p.contentDifficultyScore <= 40
          ? "Easy to demonstrate visually in a short video."
          : "Harder to show on camera — needs a stronger angle.",
    },
    {
      component: "Competition gap",
      score: competitionGap,
      weight: weights.competitionGap,
      reason:
        p.competitionScore <= 40
          ? "Few creators are covering this yet."
          : "Content space is getting crowded.",
    },
    {
      component: "Compliance safety",
      score: complianceSafety,
      weight: weights.complianceSafety,
      reason:
        (RISK_PENALTY[p.riskCategory] ?? 0) > 0
          ? `${p.riskCategory.toLowerCase()} category — claims must stay conservative.`
          : "Low-risk category for claims.",
    },
  ];

  return {
    total: clamp(total),
    trendMomentum,
    brandStrength,
    commission,
    viralityPotential,
    competitionGap,
    complianceSafety,
    weights,
    explanations,
  };
}

export function validateWeights(w: ScoringWeights): string | null {
  const sum =
    w.trendMomentum +
    w.brandStrength +
    w.commission +
    w.viralityPotential +
    w.competitionGap +
    w.complianceSafety;
  if (Math.abs(sum - 1) > 0.001) {
    return `Weights must sum to 1.0 (currently ${sum.toFixed(3)})`;
  }
  return null;
}
