// Compliance / Claim-Safety Checker
//
// Rule-based checker that scans generated content (scripts, captions, hooks)
// for affiliate-disclosure gaps, exaggerated or medical claims, misleading
// framing, and aggressive CTAs — in both English and Thai.
//
// Verdicts: SAFE | NEEDS_REVIEW | RISKY | REJECT

import type { ComplianceFlag, ComplianceVerdict, RiskCategory } from "./types";

export interface ComplianceInput {
  text: string;
  riskCategory?: RiskCategory | string;
  isAiGenerated?: boolean; // AI persona content must not claim real personal use
  hasBeforeAfter?: boolean;
}

export interface ComplianceResult {
  verdict: ComplianceVerdict;
  score: number; // 0-100, higher = safer
  hasDisclosure: boolean;
  flags: ComplianceFlag[];
}

interface Rule {
  ruleId: string;
  severity: "info" | "warning" | "critical";
  pattern: RegExp;
  message: string;
  suggestion: string;
  categories?: string[]; // only applies to these risk categories (default: all)
}

// Disclosure markers accepted in English and Thai.
const DISCLOSURE_PATTERNS: RegExp[] = [
  /#?\bad\b/i,
  /#(?:ad|sponsored|affiliate|commissionearned|tiktokshopaffiliate)/i,
  /affiliate (?:link|disclosure|partner)/i,
  /commission (?:may be )?earned/i,
  /paid partnership/i,
  /ได้รับค่าคอมมิชชั่น/, // "receives commission"
  /ลิงก์พันธมิตร/, // "affiliate link"
  /มีค่าคอมมิชชั่น/,
  /#รีวิวได้ค่าคอม/,
  /โฆษณา/, // "advertisement"
];

const AI_DISCLOSURE_PATTERNS: RegExp[] = [
  /ai[- ]generated/i,
  /created with ai/i,
  /ai presenter/i,
  /virtual (?:presenter|creator)/i,
  /สร้างด้วย\s*ai/i,
  /พรีเซนเตอร์เสมือน/,
];

const RULES: Rule[] = [
  // --- Exaggerated / absolute claims (critical) ---
  {
    ruleId: "claim.miracle",
    severity: "critical",
    pattern:
      /\b(?:miracle|magical(?:ly)?|instant(?:ly)? (?:cures?|heals?|fixes?)|cures? (?:everything|all)|100% (?:effective|works|guaranteed)|guaranteed (?:results?|to work))\b|มหัศจรรย์|หายขาด|รับประกันผล(?:ลัพธ์)?100/i,
    message: "Miracle/guaranteed-result claim detected.",
    suggestion:
      'Replace with soft wording, e.g. "worked well for many users" / "หลายคนบอกว่าใช้แล้วชอบ".',
  },
  {
    ruleId: "claim.absolute",
    severity: "warning",
    pattern:
      /\b(?:best (?:product )?(?:ever|in the world)|number one|#1 (?:product|choice)|no\.? ?1|nothing (?:else )?works? like|the only (?:product|thing) you(?:'ll)? (?:ever )?need)\b|ดีที่สุดในโลก|อันดับ ?1|ที่เดียวเท่านั้น/i,
    message: "Absolute superlative claim (best ever / #1 / the only one).",
    suggestion: 'Soften to "one of my favorites" / "ตัวท็อปในใจเรา".',
  },
  // --- Medical / health claims (critical for risk categories) ---
  {
    ruleId: "claim.medical",
    severity: "critical",
    pattern:
      /\b(?:cures?|treats?|heals?|prevents?|eliminates?)\b.{0,40}\b(?:acne|eczema|disease|infection|cancer|diabetes|arthritis|illness|pain)\b|รักษา(?:สิว|โรค|อาการ)|ป้องกันโรค|หายจากโรค/i,
    message: "Medical treatment/cure claim — not allowed for affiliate content.",
    suggestion:
      'Describe cosmetic/sensory benefits only, e.g. "helps skin feel smoother" / "ผิวรู้สึกเนียนนุ่มขึ้น".',
  },
  {
    ruleId: "claim.weightloss",
    severity: "critical",
    pattern:
      /\b(?:lose \d+ ?(?:kg|kilos|pounds|lbs)|burns? fat (?:fast|instantly)|melts? fat|weight loss guaranteed)\b|ลดน้ำหนัก\s*\d+|เผาผลาญไขมันทันที|ผอมใน\s*\d+\s*วัน/i,
    message: "Specific weight-loss result claim.",
    suggestion:
      "Remove numeric weight-loss promises. Talk about routine support only, with a consult-a-professional note.",
  },
  {
    ruleId: "claim.skincare_transform",
    severity: "warning",
    categories: ["SKINCARE", "BEAUTY", "SUPPLEMENT", "HEALTH"],
    pattern:
      /\b(?:removes? (?:all )?wrinkles|erases? (?:dark spots|scars)|whitens? (?:skin )?in \d+|anti[- ]aging miracle|younger in \d+ days?)\b|ขาวใน\s*\d+|ลบริ้วรอย(?:ทันที)?|หน้าเด็กใน/i,
    message: "Strong transformation claim for a skincare/beauty product.",
    suggestion:
      'Use conservative wording: "helps skin look brighter over time, results vary" / "ผิวดูกระจ่างใสขึ้น ผลลัพธ์ขึ้นอยู่กับแต่ละคน".',
  },
  {
    ruleId: "claim.timebound",
    severity: "warning",
    pattern:
      /\b(?:results? in \d+ (?:hours?|days?)|works? in (?:seconds|minutes)|see (?:the )?difference (?:overnight|immediately))\b|เห็นผลใน\s*\d+\s*(?:ชั่วโมง|วัน|นาที)|เห็นผลทันที/i,
    message: "Specific time-bound result promise.",
    suggestion: 'Add "results vary" / "ผลลัพธ์แตกต่างกันไปในแต่ละบุคคล" or remove the timeframe.',
  },
  // --- Misleading framing ---
  {
    ruleId: "misleading.fake_experience",
    severity: "critical",
    pattern:
      /\b(?:i(?:'ve| have) (?:been )?us(?:ed|ing) (?:this|it) for (?:\d+ )?(?:days?|weeks?|months?|years?)|changed my life|my (?:skin|hair|life) (?:was|is) never the same)\b|ใช้มา\s*\d+\s*(?:วัน|อาทิตย์|เดือน|ปี)(?:แล้ว)?|เปลี่ยนชีวิต/i,
    message:
      "First-person long-term usage claim — misleading if the presenter is AI-generated and no real testing happened.",
    suggestion:
      'Reframe as research/report style: "reviewers say…", "this is trending because…" / "รีวิวบอกว่า…", or disclose AI presenter.',
  },
  {
    ruleId: "misleading.fake_scarcity",
    severity: "warning",
    pattern:
      /\b(?:only \d+ left|selling out (?:now|fast|today)|last chance|stock (?:almost )?gone|ends? tonight)\b|เหลือ\s*\d+\s*ชิ้นสุดท้าย|ของจะหมดแล้ว|วันสุดท้าย/i,
    message: "Scarcity/urgency claim that may be untrue.",
    suggestion:
      'Only use scarcity you can verify. Otherwise use soft urgency: "worth checking out early" / "รีบดูก่อนของหมด" only if true.',
  },
  {
    ruleId: "misleading.price",
    severity: "warning",
    pattern:
      /\b(?:was \d+[,.]?\d* now|(?:\d+)% off today only|cheapest (?:ever|in history))\b|ลดเหลือ.{0,10}วันนี้เท่านั้น|ถูกที่สุดในประวัติศาสตร์/i,
    message: "Specific price/discount claim that can go stale or be inaccurate.",
    suggestion: 'Say "check the current price via the link" / "เช็กราคาล่าสุดที่ลิงก์".',
  },
  // --- Aggressive CTA ---
  {
    ruleId: "cta.aggressive",
    severity: "warning",
    pattern:
      /\b(?:buy (?:it )?(?:now|right now|immediately)[!]+|you (?:need|must) (?:to )?buy|don'?t think,? just buy|smash that (?:link|button))\b|ซื้อเลยตอนนี้!|ต้องซื้อ(?:เดี๋ยวนี้|ตอนนี้)|อย่าคิดมาก\s*ซื้อเลย/i,
    message: "CTA is pushy/hard-sell.",
    suggestion:
      'Soften: "link in bio if you want to try it" / "ใครสนใจ ลิงก์อยู่ที่ช่องคอมเมนต์/ไบโอ".',
  },
  // --- Before/after ---
  {
    ruleId: "beforeafter.unsafe",
    severity: "warning",
    pattern: /\b(?:before (?:and|&|\/) ?after)\b|บีฟอร์.{0,6}อาฟเตอร์|ก่อน.{0,8}หลังใช้/i,
    message: "Before/after framing — must not imply guaranteed results.",
    suggestion:
      'Use concept-level comparison only ("routine before vs routine after") and add "results vary".',
  },
];

export function hasAffiliateDisclosure(text: string): boolean {
  return DISCLOSURE_PATTERNS.some((p) => p.test(text));
}

export function hasAiDisclosure(text: string): boolean {
  return AI_DISCLOSURE_PATTERNS.some((p) => p.test(text));
}

export function runComplianceRules(input: ComplianceInput): ComplianceResult {
  const { text } = input;
  const riskCategory = (input.riskCategory ?? "GENERAL").toString();
  const flags: ComplianceFlag[] = [];

  const disclosure = hasAffiliateDisclosure(text);
  if (!disclosure) {
    flags.push({
      ruleId: "disclosure.missing",
      severity: "critical",
      message: "No affiliate disclosure found (e.g. #ad, #affiliate, ได้รับค่าคอมมิชชั่น).",
      suggestion:
        'Add a disclosure to the caption or on-screen text, e.g. "#ad ลิงก์นี้เราได้รับค่าคอมมิชชั่น".',
    });
  }

  for (const rule of RULES) {
    if (rule.categories && !rule.categories.includes(riskCategory)) continue;
    const match = text.match(rule.pattern);
    if (match) {
      flags.push({
        ruleId: rule.ruleId,
        severity: rule.severity,
        message: rule.message,
        excerpt: match[0].slice(0, 80),
        suggestion: rule.suggestion,
      });
    }
  }

  // AI content pretending to be real personal experience
  if (input.isAiGenerated && !hasAiDisclosure(text)) {
    const personalExperience =
      /\b(?:i (?:tried|tested|used|bought)|my honest review|my experience)\b|เรา(?:ลอง|ใช้|ซื้อ)(?:มา)?แล้ว|รีวิวจากใจ/i.test(
        text
      );
    if (personalExperience) {
      flags.push({
        ruleId: "ai.fake_experience",
        severity: "critical",
        message:
          "AI-generated content presents itself as a real personal user experience without AI disclosure.",
        suggestion:
          "Either reframe as informational ('here's why this is trending') or disclose the AI presenter.",
      });
    }
  }

  // Risky category with zero softening language
  const HIGH_RISK = ["SKINCARE", "BEAUTY", "SUPPLEMENT", "HEALTH"];
  if (HIGH_RISK.includes(riskCategory)) {
    const hasSoftener =
      /results? (?:may )?vary|individual results|ผลลัพธ์(?:แตกต่าง|ขึ้นอยู่กับ)|แล้วแต่(?:สภาพ)?ผิว|ควรปรึกษา/i.test(
        text
      );
    if (!hasSoftener) {
      flags.push({
        ruleId: "risk.no_softener",
        severity: "info",
        message: `${riskCategory.toLowerCase()} content has no "results vary" softener.`,
        suggestion: 'Add "results vary by individual" / "ผลลัพธ์ขึ้นอยู่กับแต่ละบุคคล".',
      });
    }
  }

  // --- Scoring ---
  let score = 100;
  for (const f of flags) {
    if (f.severity === "critical") score -= 30;
    else if (f.severity === "warning") score -= 12;
    else score -= 4;
  }
  score = Math.max(0, score);

  const criticals = flags.filter((f) => f.severity === "critical").length;
  const warnings = flags.filter((f) => f.severity === "warning").length;

  let verdict: ComplianceVerdict;
  if (criticals >= 2) verdict = "REJECT";
  else if (criticals === 1) verdict = "RISKY";
  else if (warnings >= 1) verdict = "NEEDS_REVIEW";
  else verdict = "SAFE";

  return { verdict, score, hasDisclosure: disclosure, flags };
}

// Standard disclosure lines the generator appends to every caption.
export const DISCLOSURE_TEXT: Record<string, string> = {
  TH: "#ad ลิงก์ในโพสต์นี้เป็นลิงก์พันธมิตร เราอาจได้รับค่าคอมมิชชั่นเมื่อมีการสั่งซื้อ",
  EN: "#ad This post contains affiliate links — I may earn a commission on purchases.",
  MIX: "#ad ลิงก์นี้เป็น affiliate link เราอาจได้รับค่าคอมมิชชั่นเมื่อมีการสั่งซื้อ",
};
