// POST /api/generate — generate a full content package for a product.
//
// Body: {
//   productId: string,
//   personaId?: string | null,
//   options: GenerationOptions,
//   save?: boolean (default true — persists ContentIdea + Scripts + Captions +
//                   VideoPrompts + ComplianceChecks in one transaction)
// }

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAiProvider } from "@/lib/ai";
import type { GenerationOptions, PersonaInput, ProductInput } from "@/lib/ai/provider";
import { runComplianceRules } from "@/lib/compliance";
import {
  CLAIM_STRICTNESS,
  CONTENT_PLATFORMS,
  DURATIONS,
  GENERATOR_STYLES,
  LANGUAGES,
  TONES,
  type ComplianceFlag,
} from "@/lib/types";

interface GenerateBody {
  productId?: string;
  personaId?: string | null;
  options?: Partial<GenerationOptions>;
  save?: boolean;
}

interface ComplianceEntry {
  target: string; // "script-1" | "caption-2" | ...
  verdict: string;
  score: number;
  flags: ComplianceFlag[];
}

/** Map generator style → ContentIdea/Script video style. */
function toVideoStyle(style: string): string {
  if (style === "UGC") return "UGC_REVIEW";
  if (style === "PRODUCT_SHOWCASE") return "PRODUCT_SHOWCASE";
  return "TALKING_HEAD";
}

function isValidOptions(options: Partial<GenerationOptions> | undefined): options is GenerationOptions {
  if (!options) return false;
  return (
    (CONTENT_PLATFORMS as readonly string[]).includes(options.platform ?? "") &&
    (GENERATOR_STYLES as readonly string[]).includes(options.style ?? "") &&
    (LANGUAGES as readonly string[]).includes(options.language ?? "") &&
    (TONES as readonly string[]).includes(options.tone ?? "") &&
    (DURATIONS as readonly number[]).includes(options.durationSec ?? -1) &&
    typeof options.includePersona === "boolean" &&
    (CLAIM_STRICTNESS as readonly string[]).includes(options.claimStrictness ?? "")
  );
}

export async function POST(req: NextRequest) {
  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { productId, personaId, options, save = true } = body ?? {};
  if (!productId || typeof productId !== "string") {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }
  if (!isValidOptions(options)) {
    return NextResponse.json({ error: "Invalid generation options" }, { status: 400 });
  }

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Resolve persona (fall back to the default persona when requested but unspecified).
  let persona = null;
  if (options.includePersona) {
    if (personaId) {
      persona = await db.persona.findUnique({ where: { id: personaId } });
    }
    if (!persona) {
      persona = await db.persona.findFirst({ where: { isDefault: true } });
    }
  }

  const productInput: ProductInput = {
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
    price: product.price,
    currency: product.currency,
    commissionRate: product.commissionRate,
    riskCategory: product.riskCategory,
    isNewLaunch: product.isNewLaunch,
    isKnownBrand: product.isKnownBrand,
    isRising: product.isRising,
    tags: product.tags,
    painPointsJson: product.painPointsJson,
    buyerPersonasJson: product.buyerPersonasJson,
  };

  const personaInput: PersonaInput | null = persona
    ? {
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
      }
    : null;

  const generationOptions: GenerationOptions = {
    platform: options.platform,
    style: options.style,
    language: options.language,
    tone: options.tone,
    durationSec: options.durationSec,
    includePersona: options.includePersona,
    claimStrictness: options.claimStrictness,
    templateKey: options.templateKey || undefined,
  };

  const provider = await getAiProvider();
  const pkg = await provider.generateContentPackage(productInput, personaInput, generationOptions);

  // ---------------------------------------------------------------------
  // Compliance checks — every script and caption gets a rule-based scan.
  // ---------------------------------------------------------------------
  const compliance: ComplianceEntry[] = [];
  const firstCaption = pkg.captions[0];
  const scriptChecks = pkg.scripts.map((script, i) => {
    const text = `${script.body}\n${firstCaption ? `${firstCaption.text} ${firstCaption.disclosure}` : ""}`;
    const result = runComplianceRules({
      text,
      riskCategory: product.riskCategory,
      isAiGenerated: generationOptions.includePersona,
    });
    compliance.push({
      target: `script-${i + 1}`,
      verdict: result.verdict,
      score: result.score,
      flags: result.flags,
    });
    return { text, result };
  });
  pkg.captions.forEach((caption, i) => {
    const text = `${caption.text} ${caption.hashtags.join(" ")} ${caption.disclosure}`;
    const result = runComplianceRules({ text, riskCategory: product.riskCategory });
    compliance.push({
      target: `caption-${i + 1}`,
      verdict: result.verdict,
      score: result.score,
      flags: result.flags,
    });
  });

  // ---------------------------------------------------------------------
  // Persist everything in one transaction (drafts only, NEEDS_REVIEW).
  // ---------------------------------------------------------------------
  const generatedBy = provider.name.toUpperCase();
  let contentIdeaId: string | null = null;

  if (save) {
    const concept = pkg.concepts[0];
    const firstHook = pkg.hooks[0];
    const videoStyle = toVideoStyle(generationOptions.style);

    contentIdeaId = await db.$transaction(async (tx) => {
      const idea = await tx.contentIdea.create({
        data: {
          productId: product.id,
          personaId: persona?.id ?? null,
          platform: generationOptions.platform,
          style: videoStyle,
          title: concept?.title ?? `${product.name} content package`,
          angle: concept?.angle ?? "General",
          concept: concept?.description ?? null,
          hook: firstHook?.text ?? null,
          language: generationOptions.language,
          tone: generationOptions.tone,
          durationSec: generationOptions.durationSec,
          templateKey: generationOptions.templateKey ?? null,
          status: "NEEDS_REVIEW",
          generatedBy,
        },
      });

      for (let i = 0; i < pkg.scripts.length; i++) {
        const s = pkg.scripts[i];
        const script = await tx.script.create({
          data: {
            productId: product.id,
            contentIdeaId: idea.id,
            title: s.title,
            durationSec: s.durationSec,
            language: generationOptions.language,
            tone: generationOptions.tone,
            style: videoStyle,
            hookLine: s.hookLine,
            body: s.body,
            shotListJson: JSON.stringify(s.shotList),
            cta: s.cta,
            generatedBy,
          },
        });
        const check = scriptChecks[i];
        if (check) {
          await tx.complianceCheck.create({
            data: {
              productId: product.id,
              contentIdeaId: idea.id,
              scriptId: script.id,
              contentText: check.text,
              verdict: check.result.verdict,
              score: check.result.score,
              flagsJson: JSON.stringify(check.result.flags),
              hasDisclosure: check.result.hasDisclosure,
              checkedBy: "RULES",
            },
          });
        }
      }

      for (const c of pkg.captions) {
        await tx.caption.create({
          data: {
            productId: product.id,
            contentIdeaId: idea.id,
            platform: generationOptions.platform,
            text: c.text,
            hashtags: c.hashtags.join(" "),
            disclosure: c.disclosure,
            language: generationOptions.language,
            generatedBy,
          },
        });
      }

      const videoPrompts = [pkg.showcasePrompt, pkg.personaPrompt].filter(
        (p): p is NonNullable<typeof p> => p != null
      );
      for (const p of videoPrompts) {
        await tx.videoPrompt.create({
          data: {
            productId: product.id,
            contentIdeaId: idea.id,
            personaId: p.promptType.startsWith("PERSONA") ? (persona?.id ?? null) : null,
            promptType: p.promptType,
            targetModel: "VEO",
            title: p.title,
            structuredJson: JSON.stringify(p.sections),
            compiledPrompt: p.compiledPrompt,
            negativePrompt: p.negativePrompt || null,
            durationSec: generationOptions.durationSec,
            aspectRatio: "9:16",
            generatedBy,
          },
        });
      }

      return idea.id;
    });
  }

  return NextResponse.json({
    package: pkg,
    contentIdeaId,
    compliance,
    provider: provider.name,
  });
}
