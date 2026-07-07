// Base class for real LLM providers (OpenAI, Gemini).
//
// Subclasses only implement `complete()`. All generation methods share the
// same prompts + JSON contracts, and every call falls back to the mock
// provider on any failure so the app keeps working without valid keys.

import type {
  AiProvider,
  ContentPackage,
  GeneratedCaption,
  GeneratedConcept,
  GeneratedHook,
  GeneratedScript,
  GeneratedVideoPrompt,
  GenerationOptions,
  PersonaInput,
  ProductAngles,
  ProductInput,
} from "./provider";
import type { VideoPromptSections } from "../types";
import { MockAiProvider } from "./mock";
import { optionsContext, parseJson, productContext, SYSTEM_PROMPT } from "./llm-shared";
import { BASE_NEGATIVE_PROMPT, compileVideoPrompt } from "./veo-prompt";
import { DISCLOSURE_TEXT } from "../compliance";

const mock = new MockAiProvider();

export abstract class LlmProvider implements AiProvider {
  abstract readonly name: string;

  /** Send a system+user prompt to the model, return raw text. */
  protected abstract complete(system: string, user: string): Promise<string>;

  private async completeJson<T>(user: string): Promise<T> {
    const raw = await this.complete(SYSTEM_PROMPT, user);
    return parseJson<T>(raw);
  }

  async generateProductAngles(product: ProductInput): Promise<ProductAngles> {
    try {
      return await this.completeJson<ProductAngles>(
        `${productContext(product)}

Analyze this product for affiliate content strategy. Return JSON:
{
  "whyItMightSell": "2-3 sentence strategic reason this can sell soon",
  "buyerPersonas": [{"name": "...", "description": "..."}] (3 items),
  "painPoints": ["..."] (3-4 real, specific pain points),
  "contentAngles": ["..."] (5 concrete video angles),
  "riskWarnings": ["..."] (compliance warnings for this product's risk category),
  "productBenefits": ["..."] (4 specific, conservative, verifiable benefits)
}`
      );
    } catch {
      return mock.generateProductAngles(product);
    }
  }

  async generateHooks(
    product: ProductInput,
    persona: PersonaInput | null,
    options: GenerationOptions,
    count = 10
  ): Promise<GeneratedHook[]> {
    try {
      const res = await this.completeJson<{ hooks: GeneratedHook[] }>(
        `${productContext(product)}

${optionsContext(options, persona)}

Write ${count} scroll-stopping opening hooks (first 1-2 seconds of the video). Vary the type: curiosity, problem, discovery ("found it before it trends"), price/value, honest review, question, social proof, list, launch alert. Keep each under 120 characters, natural spoken language.
Return JSON: {"hooks": [{"text": "...", "type": "..."}]}`
      );
      if (!Array.isArray(res.hooks) || res.hooks.length === 0) throw new Error("bad shape");
      return res.hooks.slice(0, count);
    } catch {
      return mock.generateHooks(product, persona, options, count);
    }
  }

  async generateConcepts(
    product: ProductInput,
    persona: PersonaInput | null,
    options: GenerationOptions,
    count = 5
  ): Promise<GeneratedConcept[]> {
    try {
      const res = await this.completeJson<{ concepts: GeneratedConcept[] }>(
        `${productContext(product)}

${optionsContext(options, persona)}

Create ${count} distinct short-video concepts for this product. suggestedStyle must be one of: TALKING_HEAD, PRODUCT_DEMO, PRODUCT_SHOWCASE, UGC_REVIEW, PROBLEM_SOLUTION, BEFORE_AFTER, UNBOXING, THREE_SCENE_AD.
Return JSON: {"concepts": [{"title": "...", "angle": "...", "description": "2-3 sentences", "suggestedStyle": "..."}]}`
      );
      if (!Array.isArray(res.concepts) || res.concepts.length === 0) throw new Error("bad shape");
      return res.concepts.slice(0, count);
    } catch {
      return mock.generateConcepts(product, persona, options, count);
    }
  }

  async generateScript(
    product: ProductInput,
    persona: PersonaInput | null,
    options: GenerationOptions,
    variant = 0
  ): Promise<GeneratedScript> {
    try {
      const res = await this.completeJson<GeneratedScript>(
        `${productContext(product)}

${optionsContext(options, persona)}

Write short-form video script variant #${variant + 1} (make different variants genuinely different). Target ${options.durationSec} seconds of speech. Structure: hook → context/problem → product intro → 1-2 concrete details → honest note → soft CTA. Include a shot list.
Return JSON:
{
  "title": "...",
  "durationSec": ${options.durationSec},
  "hookLine": "...",
  "body": "full script text with [beat] markers, natural spoken language",
  "shotList": [{"scene": 1, "timecode": "0s-3s", "visual": "...", "voiceover": "...", "onScreenText": "optional"}],
  "cta": "soft, non-pushy CTA line"
}`
      );
      if (!res.body || !Array.isArray(res.shotList)) throw new Error("bad shape");
      return res;
    } catch {
      return mock.generateScript(product, persona, options, variant);
    }
  }

  async generateCaption(
    product: ProductInput,
    options: GenerationOptions,
    variant = 0
  ): Promise<GeneratedCaption> {
    try {
      const res = await this.completeJson<GeneratedCaption>(
        `${productContext(product)}

${optionsContext(options, null)}

Write caption variant #${variant + 1} for this product's video post. 1-3 sentences, natural, not salesy. Include 5-7 relevant hashtags (mix Thai/English as fits the language setting).
Return JSON: {"text": "...", "hashtags": ["#..."], "disclosure": ${JSON.stringify(
          DISCLOSURE_TEXT[options.language] ?? DISCLOSURE_TEXT.MIX
        )}}`
      );
      if (!res.text) throw new Error("bad shape");
      res.disclosure ||= DISCLOSURE_TEXT[options.language] ?? DISCLOSURE_TEXT.MIX;
      return res;
    } catch {
      return mock.generateCaption(product, options, variant);
    }
  }

  async generateVideoPrompt(
    product: ProductInput,
    persona: PersonaInput | null,
    options: GenerationOptions,
    promptType: string
  ): Promise<GeneratedVideoPrompt> {
    try {
      const isPersona = promptType.startsWith("PERSONA") && persona;
      const sections = await this.completeJson<VideoPromptSections>(
        `${productContext(product)}

${optionsContext(options, persona)}

Prompt type: ${promptType}${isPersona ? " (fictional AI persona presenter on camera)" : " (product-only showcase, no presenter)"}

Fill every field of this Gemini/Veo video-prompt structure for a ${options.durationSec}s 9:16 vertical video. Scene sequence should have 4-6 concrete, filmable scenes. ${
          isPersona
            ? "personaDescription must describe the fictional persona consistently; include wardrobe."
            : "Omit personaDescription and wardrobe (set to null)."
        }
Return JSON:
{
  "objective": "...", "product": "...", "targetBuyer": "...", "videoFormat": "...",
  "sceneSequence": ["..."], "cameraMovement": "...", "lighting": "...", "background": "...",
  "personaDescription": "... or null", "wardrobe": "... or null",
  "productHandling": "...", "onScreenText": ["..."], "voiceover": "...",
  "audioMusicDirection": "...", "visualStyle": "...",
  "mustInclude": ["..."], "mustAvoid": ["..."], "brandSafetyNotes": ["..."],
  "disclosurePlacement": "...", "finalCta": "..."
}`
      );
      if (!sections.objective || !Array.isArray(sections.sceneSequence)) throw new Error("bad shape");
      return {
        title: `${isPersona ? "Persona" : "Showcase"} Veo prompt — ${product.name}`,
        promptType,
        sections,
        compiledPrompt: compileVideoPrompt(sections),
        negativePrompt: BASE_NEGATIVE_PROMPT,
      };
    } catch {
      return mock.generateVideoPrompt(product, persona, options, promptType);
    }
  }

  async generateContentPackage(
    product: ProductInput,
    persona: PersonaInput | null,
    options: GenerationOptions
  ): Promise<ContentPackage> {
    const [hooks, concepts, angles] = await Promise.all([
      this.generateHooks(product, persona, options, 10),
      this.generateConcepts(product, persona, options, 5),
      this.generateProductAngles(product),
    ]);
    const scripts = await Promise.all([
      this.generateScript(product, persona, options, 0),
      this.generateScript(product, persona, options, 1),
      this.generateScript(product, persona, options, 2),
    ]);
    const captions = await Promise.all([
      this.generateCaption(product, options, 0),
      this.generateCaption(product, options, 1),
      this.generateCaption(product, options, 2),
    ]);
    const showcasePrompt = await this.generateVideoPrompt(product, null, options, "PRODUCT_SHOWCASE");
    const personaPrompt =
      options.includePersona && persona
        ? await this.generateVideoPrompt(product, persona, options, "PERSONA_TALKING_HEAD")
        : null;

    const allTags = new Set<string>();
    captions.forEach((c) => c.hashtags.forEach((h) => allTags.add(h)));

    return {
      hooks,
      concepts,
      scripts,
      captions,
      hashtags: [...allTags],
      disclosure: DISCLOSURE_TEXT[options.language] ?? DISCLOSURE_TEXT.MIX,
      angles,
      showcasePrompt,
      personaPrompt,
      storyboard: scripts[0].shotList,
      avoidList: BASE_NEGATIVE_PROMPT.split("; "),
    };
  }
}
