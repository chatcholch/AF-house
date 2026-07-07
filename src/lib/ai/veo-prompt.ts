// Gemini/Veo prompt compiler.
//
// Takes structured VideoPromptSections and compiles them into a single
// copy-paste-ready text prompt for Veo / Gemini video generation.
// EDIT PROMPT STRUCTURE HERE if you want different section ordering/wording.

import type { VideoPromptSections } from "../types";

export function compileVideoPrompt(sections: VideoPromptSections): string {
  const lines: string[] = [];

  lines.push(`OBJECTIVE: ${sections.objective}`);
  lines.push(`PRODUCT: ${sections.product}`);
  lines.push(`TARGET BUYER: ${sections.targetBuyer}`);
  lines.push(`VIDEO FORMAT: ${sections.videoFormat}`);
  lines.push("");
  lines.push("SCENE SEQUENCE:");
  sections.sceneSequence.forEach((scene, i) => {
    lines.push(`  ${i + 1}. ${scene}`);
  });
  lines.push("");
  lines.push(`CAMERA MOVEMENT: ${sections.cameraMovement}`);
  lines.push(`LIGHTING: ${sections.lighting}`);
  lines.push(`BACKGROUND: ${sections.background}`);
  if (sections.personaDescription) {
    lines.push("");
    lines.push(`PRESENTER (FICTIONAL AI PERSONA): ${sections.personaDescription}`);
    if (sections.wardrobe) lines.push(`WARDROBE: ${sections.wardrobe}`);
  }
  lines.push(`PRODUCT HANDLING: ${sections.productHandling}`);
  lines.push("");
  if (sections.onScreenText.length > 0) {
    lines.push("ON-SCREEN TEXT:");
    sections.onScreenText.forEach((t) => lines.push(`  - ${t}`));
  }
  lines.push(`VOICEOVER: ${sections.voiceover}`);
  lines.push(`AUDIO / MUSIC: ${sections.audioMusicDirection}`);
  lines.push(`VISUAL STYLE: ${sections.visualStyle}`);
  lines.push("");
  if (sections.mustInclude.length > 0) {
    lines.push("MUST INCLUDE:");
    sections.mustInclude.forEach((t) => lines.push(`  - ${t}`));
  }
  if (sections.mustAvoid.length > 0) {
    lines.push("MUST AVOID:");
    sections.mustAvoid.forEach((t) => lines.push(`  - ${t}`));
  }
  if (sections.brandSafetyNotes.length > 0) {
    lines.push("BRAND SAFETY:");
    sections.brandSafetyNotes.forEach((t) => lines.push(`  - ${t}`));
  }
  lines.push("");
  lines.push(`AFFILIATE DISCLOSURE PLACEMENT: ${sections.disclosurePlacement}`);
  lines.push(`FINAL CTA: ${sections.finalCta}`);

  return lines.join("\n");
}

// Baseline avoid-list appended to every generated video prompt.
export const BASE_NEGATIVE_PROMPT = [
  "no real person likeness, no celebrity face or voice",
  "no brand logos other than the featured product's own packaging",
  "no medical claims, no before/after skin transformations",
  "no distorted hands or fingers, no warped text, no gibberish text",
  "no flashing strobe effects",
  "no watermark, no stock-footage look",
  "no exaggerated facial expressions or infomercial acting",
].join("; ");

export const SHOWCASE_FOCUS = [
  "slow macro close-ups of the product and packaging texture",
  "readable product name on the label",
  "natural hand movement presenting the product",
  "clean, uncluttered premium background",
  "usage context shot (the product where it would really be used)",
  "soft premium lighting with gentle highlights",
  "short clear CTA at the end",
];

export const PERSONA_FOCUS = [
  "consistent fictional presenter identical across videos (same face, hair, style)",
  "natural conversational speech with small realistic pauses",
  "honest, calm product explanation — no hype, no shouting",
  "product held clearly in frame at chest height",
  "casual TikTok-friendly pacing with a hook in the first 2 seconds",
  "affiliate disclosure visible as on-screen text or in caption",
];
