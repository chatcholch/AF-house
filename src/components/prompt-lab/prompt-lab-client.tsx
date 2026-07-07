"use client";

// Prompt Lab — main client shell.
// Left: sticky generator config rail. Right: generated results. Bottom: queue.

import { useState } from "react";
import type { ContentPackage } from "@/lib/ai/provider";
import type {
  ClaimStrictness,
  ComplianceFlag,
  ContentLanguage,
  ContentPlatform,
  ContentTone,
  GeneratorStyle,
} from "@/lib/types";
import { GeneratorPanel } from "./generator-panel";
import { ResultsPanel } from "./results-panel";
import { GenerationQueue } from "./generation-queue";

// ---------------------------------------------------------------------------
// Shared client-side types
// ---------------------------------------------------------------------------

export interface ProductOption {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  riskCategory: string;
  price: number;
  commissionRate: number;
  platform: string;
  opportunityScore: number;
}

export interface PersonaOption {
  id: string;
  name: string;
  ageRange: string;
  style: string;
  voiceTone: string;
  personality: string;
  isDefault: boolean;
}

export interface QueueIdea {
  id: string;
  title: string;
  status: string;
  language: string;
  platform: string;
  style: string;
  createdAt: string;
  productName: string;
}

export interface GenerationOptionsState {
  platform: ContentPlatform;
  style: GeneratorStyle;
  language: ContentLanguage;
  tone: ContentTone;
  durationSec: number;
  includePersona: boolean;
  claimStrictness: ClaimStrictness;
  templateKey?: string;
}

export interface ComplianceEntry {
  target: string; // "script-1" | "caption-2" | ...
  verdict: string;
  score: number;
  flags: ComplianceFlag[];
}

export interface GenerateResult {
  package: ContentPackage;
  contentIdeaId: string | null;
  compliance: ComplianceEntry[];
  provider: string;
}

export interface GenerationContext {
  product: ProductOption;
  personaId: string | null;
  options: GenerationOptionsState;
}

/** Generator style → stored video style (mirrors the API mapping). */
export function mapGeneratorStyle(style: string): string {
  if (style === "UGC") return "UGC_REVIEW";
  if (style === "PRODUCT_SHOWCASE") return "PRODUCT_SHOWCASE";
  return "TALKING_HEAD";
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

export function PromptLabClient({
  products,
  personas,
  queue,
  initialProductId,
}: {
  products: ProductOption[];
  personas: PersonaOption[];
  queue: QueueIdea[];
  initialProductId: string | null;
}) {
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [context, setContext] = useState<GenerationContext | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="w-full shrink-0 xl:sticky xl:top-6 xl:w-[380px]">
          <GeneratorPanel
            products={products}
            personas={personas}
            initialProductId={initialProductId}
            onGenerated={(r, ctx) => {
              setResult(r);
              setContext(ctx);
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <ResultsPanel
            key={result?.contentIdeaId ?? "empty"}
            result={result}
            context={context}
          />
        </div>
      </div>
      <GenerationQueue ideas={queue} />
    </div>
  );
}
