// Shared enum-like unions. These mirror the String fields in prisma/schema.prisma
// (SQLite has no native enums). Keep both in sync.

export const PRODUCT_PLATFORMS = ["SHOPEE", "TIKTOK_SHOP", "BOTH"] as const;
export type ProductPlatform = (typeof PRODUCT_PLATFORMS)[number];

export const CONTENT_PLATFORMS = ["TIKTOK", "SHOPEE_VIDEO", "FACEBOOK", "MULTI"] as const;
export type ContentPlatform = (typeof CONTENT_PLATFORMS)[number];

export const PRODUCT_STATUSES = ["WATCHLIST", "TEST", "ACTIVE", "REJECTED", "WINNER"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_SOURCES = ["MOCK", "MANUAL", "CSV", "SHOPEE_API", "TIKTOK_API"] as const;
export type ProductSource = (typeof PRODUCT_SOURCES)[number];

export const RISK_CATEGORIES = [
  "GENERAL",
  "SKINCARE",
  "BEAUTY",
  "SUPPLEMENT",
  "HEALTH",
  "FINANCE",
  "KIDS",
] as const;
export type RiskCategory = (typeof RISK_CATEGORIES)[number];

export const SIGNAL_TYPES = [
  "TRENDING",
  "RISING",
  "NEW_BRAND_DROP",
  "KNOWN_BRAND_LAUNCH",
  "HIGH_COMMISSION",
  "LOW_COMPETITION",
  "SEASONAL",
  "EVERGREEN",
  "SOCIAL_BUZZ",
  "SEARCH_INTEREST",
] as const;
export type SignalType = (typeof SIGNAL_TYPES)[number];

export const VIDEO_STYLES = [
  "TALKING_HEAD",
  "PRODUCT_DEMO",
  "PRODUCT_SHOWCASE",
  "UGC_REVIEW",
  "PROBLEM_SOLUTION",
  "BEFORE_AFTER",
  "UNBOXING",
  "THREE_SCENE_AD",
] as const;
export type VideoStyle = (typeof VIDEO_STYLES)[number];

export const GENERATOR_STYLES = [
  "TALKING_HEAD",
  "PRODUCT_SHOWCASE",
  "UGC",
  "CINEMATIC",
  "CLEAN_AD",
  "FUNNY",
  "EDUCATIONAL",
] as const;
export type GeneratorStyle = (typeof GENERATOR_STYLES)[number];

export const LANGUAGES = ["TH", "EN", "MIX"] as const;
export type ContentLanguage = (typeof LANGUAGES)[number];

export const TONES = ["FRIENDLY", "PREMIUM", "PLAYFUL", "EXPERT", "SOFT_SELL"] as const;
export type ContentTone = (typeof TONES)[number];

export const DURATIONS = [8, 15, 30, 45] as const;
export type ContentDuration = (typeof DURATIONS)[number];

export const CLAIM_STRICTNESS = ["NORMAL", "STRICT", "HEALTH_BEAUTY_SAFE"] as const;
export type ClaimStrictness = (typeof CLAIM_STRICTNESS)[number];

export const CONTENT_STATUSES = ["DRAFT", "NEEDS_REVIEW", "APPROVED", "REJECTED", "USED"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CAMPAIGN_STATUSES = [
  "IDEA",
  "GENERATED",
  "NEEDS_REVIEW",
  "APPROVED",
  "POSTED",
  "TESTING",
  "WINNER",
  "FAILED",
  "ARCHIVED",
] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const COMPLIANCE_VERDICTS = ["SAFE", "NEEDS_REVIEW", "RISKY", "REJECT"] as const;
export type ComplianceVerdict = (typeof COMPLIANCE_VERDICTS)[number];

export const PROMPT_TYPES = [
  "PERSONA_TALKING_HEAD",
  "PERSONA_DEMO",
  "PRODUCT_SHOWCASE",
  "UGC",
  "CINEMATIC",
  "CLEAN_AD",
] as const;
export type PromptType = (typeof PROMPT_TYPES)[number];

export const INTEGRATION_PROVIDERS = [
  "SHOPEE_AFFILIATE",
  "TIKTOK_SHOP_AFFILIATE",
  "FACEBOOK",
  "OPENAI",
  "GEMINI",
] as const;
export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

export const AI_PROVIDERS = ["mock", "openai", "gemini"] as const;
export type AiProviderName = (typeof AI_PROVIDERS)[number];

// ---------------------------------------------------------------------------
// Display label helpers
// ---------------------------------------------------------------------------

export const LABELS: Record<string, string> = {
  SHOPEE: "Shopee",
  TIKTOK_SHOP: "TikTok Shop",
  BOTH: "Shopee + TikTok",
  TIKTOK: "TikTok",
  SHOPEE_VIDEO: "Shopee Video",
  FACEBOOK: "Facebook",
  MULTI: "Multi-platform",
  WATCHLIST: "Watchlist",
  TEST: "Test",
  ACTIVE: "Active",
  REJECTED: "Rejected",
  WINNER: "Winner",
  TRENDING: "Trending",
  RISING: "Fast rising",
  NEW_BRAND_DROP: "New brand drop",
  KNOWN_BRAND_LAUNCH: "Known-brand launch",
  HIGH_COMMISSION: "High commission",
  LOW_COMPETITION: "Low competition",
  SEASONAL: "Seasonal",
  EVERGREEN: "Evergreen",
  SOCIAL_BUZZ: "Social buzz",
  SEARCH_INTEREST: "Search interest",
  TALKING_HEAD: "AI persona talking-head",
  PRODUCT_DEMO: "AI persona product demo",
  PRODUCT_SHOWCASE: "Product showcase",
  UGC_REVIEW: "UGC-style review",
  UGC: "UGC style",
  PROBLEM_SOLUTION: "Problem → solution",
  BEFORE_AFTER: "Before/after concept",
  UNBOXING: "Unboxing",
  THREE_SCENE_AD: "3-scene product ad",
  CINEMATIC: "Cinematic",
  CLEAN_AD: "Clean ad",
  FUNNY: "Funny",
  EDUCATIONAL: "Educational",
  TH: "Thai",
  EN: "English",
  MIX: "Thai-English mix",
  FRIENDLY: "Friendly",
  PREMIUM: "Premium",
  PLAYFUL: "Playful",
  EXPERT: "Expert",
  SOFT_SELL: "Soft-sell",
  NORMAL: "Normal",
  STRICT: "Strict",
  HEALTH_BEAUTY_SAFE: "Health/beauty safe",
  DRAFT: "Draft",
  NEEDS_REVIEW: "Needs review",
  APPROVED: "Approved",
  USED: "Used",
  IDEA: "Idea",
  GENERATED: "Generated",
  POSTED: "Posted",
  TESTING: "Testing",
  FAILED: "Failed",
  ARCHIVED: "Archived",
  SAFE: "Safe",
  RISKY: "Risky",
  REJECT: "Reject",
  GENERAL: "General",
  SKINCARE: "Skincare",
  BEAUTY: "Beauty",
  SUPPLEMENT: "Supplement",
  HEALTH: "Health",
  FINANCE: "Finance",
  KIDS: "Kids",
  PERSONA_TALKING_HEAD: "Persona talking-head",
  PERSONA_DEMO: "Persona product demo",
  SHOPEE_AFFILIATE: "Shopee Affiliate",
  TIKTOK_SHOP_AFFILIATE: "TikTok Shop Affiliate",
  OPENAI: "OpenAI",
  GEMINI: "Gemini",
  MOCK: "Mock (built-in)",
  MANUAL: "Manual",
  CSV: "CSV import",
  SHOPEE_API: "Shopee API",
  TIKTOK_API: "TikTok API",
  VEO: "Veo",
};

export function label(value: string | null | undefined): string {
  if (!value) return "—";
  return LABELS[value] ?? value;
}

// ---------------------------------------------------------------------------
// Structured content types (stored as JSON strings in the DB)
// ---------------------------------------------------------------------------

export interface BuyerPersona {
  name: string;
  description: string;
}

export interface ShotListItem {
  scene: number;
  timecode: string;
  visual: string;
  voiceover: string;
  onScreenText?: string;
}

export interface ComplianceFlag {
  ruleId: string;
  severity: "info" | "warning" | "critical";
  message: string;
  excerpt?: string;
  suggestion?: string;
}

export interface VideoPromptSections {
  objective: string;
  product: string;
  targetBuyer: string;
  videoFormat: string;
  sceneSequence: string[];
  cameraMovement: string;
  lighting: string;
  background: string;
  personaDescription?: string;
  wardrobe?: string;
  productHandling: string;
  onScreenText: string[];
  voiceover: string;
  audioMusicDirection: string;
  visualStyle: string;
  mustInclude: string[];
  mustAvoid: string[];
  brandSafetyNotes: string[];
  disclosurePlacement: string;
  finalCta: string;
}

export interface ScoreExplanation {
  component: string;
  score: number;
  weight: number;
  reason: string;
}
