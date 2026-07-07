// AI provider abstraction.
//
// All generation flows go through the AiProvider interface so the app can
// switch between the built-in mock provider, OpenAI, or Gemini by changing
// AI_PROVIDER in .env (or from the Settings page).

import type {
  BuyerPersona,
  ClaimStrictness,
  ContentLanguage,
  ContentPlatform,
  ContentTone,
  GeneratorStyle,
  ShotListItem,
  VideoPromptSections,
} from "../types";

// Plain shapes (subset of Prisma models) so the AI layer stays decoupled from the DB.
export interface ProductInput {
  id: string;
  name: string;
  brand?: string | null;
  category: string;
  description?: string | null;
  price: number;
  currency?: string;
  commissionRate: number;
  riskCategory: string;
  isNewLaunch?: boolean;
  isKnownBrand?: boolean;
  isRising?: boolean;
  tags?: string | null;
  painPointsJson?: string | null;
  buyerPersonasJson?: string | null;
}

export interface PersonaInput {
  id: string;
  name: string;
  ageRange: string;
  style: string;
  voiceTone: string;
  personality: string;
  clothingStyle: string;
  background: string;
  cameraStyle: string;
  consistencyPrompt: string;
  visualDescription: string;
  speakingStyle: string;
  brandSafeRules: string;
  doList: string;
  dontList: string;
}

export interface GenerationOptions {
  platform: ContentPlatform;
  style: GeneratorStyle;
  language: ContentLanguage;
  tone: ContentTone;
  durationSec: number;
  includePersona: boolean;
  claimStrictness: ClaimStrictness;
  templateKey?: string;
}

export interface ProductAngles {
  whyItMightSell: string;
  buyerPersonas: BuyerPersona[];
  painPoints: string[];
  contentAngles: string[];
  riskWarnings: string[];
  productBenefits: string[];
}

export interface GeneratedHook {
  text: string;
  type: string; // e.g. "curiosity", "problem", "price", "trend", "social-proof"
}

export interface GeneratedConcept {
  title: string;
  angle: string;
  description: string;
  suggestedStyle: string;
}

export interface GeneratedScript {
  title: string;
  durationSec: number;
  hookLine: string;
  body: string;
  shotList: ShotListItem[];
  cta: string;
}

export interface GeneratedCaption {
  text: string;
  hashtags: string[];
  disclosure: string;
}

export interface GeneratedVideoPrompt {
  title: string;
  promptType: string;
  sections: VideoPromptSections;
  compiledPrompt: string;
  negativePrompt: string;
}

export interface ContentPackage {
  hooks: GeneratedHook[];
  concepts: GeneratedConcept[];
  scripts: GeneratedScript[];
  captions: GeneratedCaption[];
  hashtags: string[];
  disclosure: string;
  angles: ProductAngles;
  showcasePrompt: GeneratedVideoPrompt;
  personaPrompt: GeneratedVideoPrompt | null;
  storyboard: ShotListItem[];
  avoidList: string[];
}

export interface AiProvider {
  readonly name: string;

  generateProductAngles(product: ProductInput): Promise<ProductAngles>;

  generateHooks(
    product: ProductInput,
    persona: PersonaInput | null,
    options: GenerationOptions,
    count?: number
  ): Promise<GeneratedHook[]>;

  generateConcepts(
    product: ProductInput,
    persona: PersonaInput | null,
    options: GenerationOptions,
    count?: number
  ): Promise<GeneratedConcept[]>;

  generateScript(
    product: ProductInput,
    persona: PersonaInput | null,
    options: GenerationOptions,
    variant?: number
  ): Promise<GeneratedScript>;

  generateCaption(
    product: ProductInput,
    options: GenerationOptions,
    variant?: number
  ): Promise<GeneratedCaption>;

  generateVideoPrompt(
    product: ProductInput,
    persona: PersonaInput | null,
    options: GenerationOptions,
    promptType: string
  ): Promise<GeneratedVideoPrompt>;

  generateContentPackage(
    product: ProductInput,
    persona: PersonaInput | null,
    options: GenerationOptions
  ): Promise<ContentPackage>;
}
