// Built-in mock AI provider.
//
// Generates product-specific, natural-sounding affiliate content without any
// external API. Content is assembled from category-aware phrase banks and is
// deterministic per product (same product → same output), which makes the app
// fully usable for planning before real AI keys are configured.

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
import type { ShotListItem, VideoPromptSections } from "../types";
import { DISCLOSURE_TEXT } from "../compliance";
import {
  BASE_NEGATIVE_PROMPT,
  compileVideoPrompt,
  PERSONA_FOCUS,
  SHOWCASE_FOCUS,
} from "./veo-prompt";
import { getTemplate } from "../templates";

// ---------------------------------------------------------------------------
// Deterministic pseudo-random helpers
// ---------------------------------------------------------------------------

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function pickN<T>(arr: T[], n: number, seed: number): T[] {
  const out: T[] = [];
  const used = new Set<number>();
  for (let i = 0; i < Math.min(n, arr.length); i++) {
    let idx = (seed + i * 7919) % arr.length;
    while (used.has(idx)) idx = (idx + 1) % arr.length;
    used.add(idx);
    out.push(arr[idx]);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Category phrase banks
// ---------------------------------------------------------------------------

interface CategoryBank {
  match: RegExp;
  benefitsEN: string[];
  benefitsTH: string[];
  painsEN: string[];
  painsTH: string[];
  contextEN: string[];
  contextTH: string[];
  hashtags: string[];
  buyers: { name: string; description: string }[];
}

const BANKS: CategoryBank[] = [
  {
    match: /skin|serum|moisturi|cleanser|sunscreen|ครีม|เซรั่ม|กันแดด|ผิว|facial|toner/i,
    benefitsEN: [
      "lightweight texture that absorbs quickly",
      "gentle formula suitable for sensitive skin",
      "helps skin feel hydrated through the day",
      "layers well under makeup and sunscreen",
      "fragrance-light and non-sticky finish",
    ],
    benefitsTH: [
      "เนื้อบางเบา ซึมไว ไม่เหนียวเหนอะหนะ",
      "สูตรอ่อนโยน ผิวแพ้ง่ายก็ใช้ได้",
      "ช่วยให้ผิวรู้สึกชุ่มชื้นระหว่างวัน",
      "ทาก่อนแต่งหน้าได้ ไม่วอกแวก",
      "กลิ่นอ่อน ๆ ใช้แล้วสบายผิว",
    ],
    painsEN: [
      "skin feeling tight and dry by mid-day",
      "products that pill under sunscreen",
      "heavy creams that clog and feel greasy",
      "confusing routines with too many steps",
    ],
    painsTH: [
      "ผิวแห้งตึงตอนบ่าย ๆ",
      "ครีมขี้เกลื้อนเวลาทาซ้อนกันแดด",
      "ครีมหนัก ๆ ทาแล้วหน้ามัน",
      "รูทีนยุ่งยากหลายขั้นตอนเกินไป",
    ],
    contextEN: ["morning routine before work", "night routine wind-down", "post-gym quick refresh"],
    contextTH: ["รูทีนตอนเช้าก่อนออกจากบ้าน", "สกินแคร์ก่อนนอน", "หลังออกกำลังกาย"],
    hashtags: ["#skincare", "#สกินแคร์", "#skincareroutine", "#ผิวแพ้ง่าย", "#skintok"],
    buyers: [
      { name: "Routine Builder", description: "20-30s office worker refining a simple AM/PM skincare routine" },
      { name: "Sensitive-Skin Searcher", description: "Reads every ingredient list, wants gentle proven brands" },
      { name: "Brand Follower", description: "Trusts known derm brands and buys new launches early" },
    ],
  },
  {
    match: /makeup|lip|mascara|foundation|blush|ลิป|แป้ง|รองพื้น|beauty|cushion/i,
    benefitsEN: [
      "buildable color that stays put for hours",
      "one-swipe application even for beginners",
      "compact size that fits any pouch",
      "flattering shades for warm undertones",
    ],
    benefitsTH: [
      "สีติดทน เกลี่ยง่าย มือใหม่ก็ทำได้",
      "ปาดเดียวอยู่ สีเนียนสม่ำเสมอ",
      "ขนาดพกพา ใส่กระเป๋าเล็กได้",
      "เฉดสีเหมาะกับผิวคนไทย",
    ],
    painsEN: [
      "makeup fading before lunch",
      "shades that never match your undertone",
      "products that crease and cake",
    ],
    painsTH: ["แต่งหน้าเช้า บ่ายหลุดหมด", "หาเฉดที่เข้ากับผิวตัวเองไม่เจอ", "แป้งเป็นคราบตอนบ่าย"],
    contextEN: ["get-ready-with-me morning", "quick touch-up between meetings", "weekend date look"],
    contextTH: ["แต่งหน้าไปทำงานตอนเช้า", "เติมหน้าระหว่างวัน", "ลุคเดทวันหยุด"],
    hashtags: ["#makeup", "#เมคอัพ", "#beautytok", "#makeuptutorial", "#ของมันต้องมี"],
    buyers: [
      { name: "Everyday Minimalist", description: "Wants a 5-minute face with 2-3 products" },
      { name: "Trend Tryer", description: "Buys viral beauty items to test and share" },
    ],
  },
  {
    match: /kitchen|blender|cook|pan|air ?fryer|ครัว|หม้อ|เครื่องปั่น|กระทะ|ทอด/i,
    benefitsEN: [
      "cuts prep time to a few minutes",
      "easy one-hand operation and simple cleanup",
      "compact footprint for small kitchens",
      "safe-touch build quality that feels solid",
    ],
    benefitsTH: [
      "ช่วยลดเวลาเตรียมอาหารเหลือไม่กี่นาที",
      "ใช้มือเดียวก็ทำได้ ล้างง่ายมาก",
      "ไซซ์กะทัดรัด ครัวเล็กก็วางได้",
      "งานประกอบแน่น ใช้แล้วรู้สึกทน",
    ],
    painsEN: [
      "meal prep eating your whole evening",
      "bulky appliances hogging counter space",
      "gadgets that are impossible to clean",
    ],
    painsTH: ["ทำกับข้าวทีเสียเวลาทั้งเย็น", "เครื่องครัวใหญ่เกะกะเคาน์เตอร์", "อุปกรณ์ล้างยากจนไม่อยากหยิบมาใช้"],
    contextEN: ["weeknight dinner rush", "meal-prep Sunday", "morning smoothie before work"],
    contextTH: ["มื้อเย็นวันธรรมดาแบบรีบ ๆ", "เตรียมอาหารล่วงหน้าวันอาทิตย์", "ปั่นสมูทตี้ตอนเช้า"],
    hashtags: ["#kitchengadgets", "#ของใช้ในครัว", "#cookingtok", "#มินิมอล", "#ทำอาหารง่ายๆ"],
    buyers: [
      { name: "Busy Cook", description: "Works late, wants dinner done in 15 minutes" },
      { name: "Condo Dweller", description: "Small kitchen, every cm of counter matters" },
    ],
  },
  {
    match: /phone|gadget|charger|earbud|speaker|stand|holder|tech|electronic|หูฟัง|ที่ชาร์จ|ลำโพง|มือถือ|usb|power ?bank/i,
    benefitsEN: [
      "solid build that doesn't feel cheap",
      "setup takes under a minute",
      "genuinely useful every single day",
      "small detail that fixes a daily annoyance",
    ],
    benefitsTH: [
      "งานประกอบดี ไม่ก๊องแก๊ง",
      "เซ็ตอัพไม่ถึงนาทีก็ใช้ได้เลย",
      "ได้ใช้จริงทุกวัน ไม่ใช่ของตั้งโชว์",
      "ดีเทลเล็ก ๆ ที่แก้ปัญหากวนใจได้ตรงจุด",
    ],
    painsEN: [
      "cables tangling everywhere",
      "battery anxiety when you're out all day",
      "flimsy accessories that break in a month",
    ],
    painsTH: ["สายชาร์จพันกันยุ่งไปหมด", "แบตหมดตอนอยู่นอกบ้านทั้งวัน", "อุปกรณ์ถูก ๆ ใช้เดือนเดียวพัง"],
    contextEN: ["desk setup for work-from-home", "commute and travel", "bedside charging station"],
    contextTH: ["โต๊ะทำงาน WFH", "เดินทาง ไปเที่ยว", "หัวเตียงก่อนนอน"],
    hashtags: ["#gadgets", "#ของมันต้องมี", "#techtok", "#ไอเทมเด็ด", "#desksetup"],
    buyers: [
      { name: "Desk Optimizer", description: "Upgrades their WFH setup piece by piece" },
      { name: "Commuter", description: "Everything must survive a backpack and a BTS ride" },
    ],
  },
  {
    match: /clean|vacuum|organizer|storage|home|ผ้า|ทำความสะอาด|จัดเก็บ|กล่อง|บ้าน|โซฟา|หมอน/i,
    benefitsEN: [
      "makes a chore noticeably faster",
      "satisfying instant visual result",
      "fits into small storage spaces",
      "one product replacing several",
    ],
    benefitsTH: [
      "ทำให้งานบ้านเสร็จไวขึ้นเห็น ๆ",
      "เห็นผลตรงหน้า ดูคลิปแล้วฟิน",
      "เก็บง่าย ไม่กินที่",
      "ชิ้นเดียวแทนของหลายอย่าง",
    ],
    painsEN: [
      "clutter that comes back every week",
      "cleaning tools that make more mess",
      "no storage space in a small room",
    ],
    painsTH: ["ของรกซ้ำ ๆ ทุกอาทิตย์", "อุปกรณ์ทำความสะอาดที่ยิ่งใช้ยิ่งเลอะ", "ห้องเล็ก ที่เก็บของไม่พอ"],
    contextEN: ["weekend deep-clean", "small condo organization", "quick reset before guests arrive"],
    contextTH: ["ทำความสะอาดใหญ่วันหยุด", "จัดห้องคอนโดเล็ก ๆ", "เก็บบ้านด่วนก่อนแขกมา"],
    hashtags: ["#cleantok", "#จัดบ้าน", "#homehacks", "#ของใช้ในบ้าน", "#มินิมอล"],
    buyers: [
      { name: "Condo Organizer", description: "Small space, wants everything to have a home" },
      { name: "CleanTok Fan", description: "Loves satisfying cleaning results videos" },
    ],
  },
  {
    match: /fitness|yoga|gym|run|exercise|ออกกำลัง|โยคะ|วิ่ง|ฟิตเนส|protein|เวย์/i,
    benefitsEN: [
      "easy to use even on low-motivation days",
      "supports a routine you can actually keep",
      "compact enough for home workouts",
      "comfortable fit that doesn't distract",
    ],
    benefitsTH: [
      "วันขี้เกียจก็ยังหยิบมาใช้ได้ง่าย ๆ",
      "ช่วยให้ทำรูทีนต่อเนื่องได้จริง",
      "เล็กพอสำหรับออกกำลังกายที่บ้าน",
      "ใส่สบาย ไม่รำคาญระหว่างเล่น",
    ],
    painsEN: [
      "gym memberships you never use",
      "home workouts that feel boring",
      "gear that hurts or digs in mid-workout",
    ],
    painsTH: ["สมัครฟิตเนสแล้วไม่ได้ไป", "ออกกำลังกายที่บ้านแล้วเบื่อ", "อุปกรณ์ใส่แล้วเจ็บ เล่นไม่สนุก"],
    contextEN: ["morning home workout", "post-work stress release", "small-space exercise corner"],
    contextTH: ["ออกกำลังกายตอนเช้าที่บ้าน", "คลายเครียดหลังเลิกงาน", "มุมออกกำลังกายเล็ก ๆ ในห้อง"],
    hashtags: ["#fittok", "#ออกกำลังกาย", "#homeworkout", "#สุขภาพดี", "#fitnessmotivation"],
    buyers: [
      { name: "Home Exerciser", description: "No gym, works out in the living room" },
      { name: "Restart Athlete", description: "Getting back into shape, needs low-friction gear" },
    ],
  },
];

const GENERIC_BANK: CategoryBank = {
  match: /.*/,
  benefitsEN: [
    "does one job well without gimmicks",
    "quality feels above its price point",
    "simple enough to use on day one",
    "small upgrade you notice every day",
  ],
  benefitsTH: [
    "ทำหน้าที่ของมันได้ดี ไม่ต้องมีลูกเล่นเยอะ",
    "คุณภาพเกินราคาที่จ่าย",
    "แกะกล่องแล้วใช้ได้เลย ไม่ต้องเรียนรู้เยอะ",
    "อัปเกรดเล็ก ๆ ที่รู้สึกได้ทุกวัน",
  ],
  painsEN: [
    "cheap versions that disappoint",
    "not knowing which option to trust",
    "wasting money on hyped products",
  ],
  painsTH: ["ของถูกที่ซื้อมาแล้วผิดหวัง", "ไม่รู้จะเชื่อรีวิวไหนดี", "เสียเงินกับของตามกระแสแล้วเฟล"],
  contextEN: ["daily routine at home", "at the office", "weekend errands"],
  contextTH: ["ชีวิตประจำวันที่บ้าน", "ที่ออฟฟิศ", "วันหยุดสุดสัปดาห์"],
  hashtags: ["#ของมันต้องมี", "#รีวิว", "#TikTokMadeMeBuyIt", "#ป้ายยา", "#shopee"],
  buyers: [
    { name: "Value Hunter", description: "Compares options carefully, buys once" },
    { name: "Curious Scroller", description: "Discovers products through short videos" },
  ],
};

function bankFor(product: ProductInput): CategoryBank {
  const haystack = `${product.name} ${product.category} ${product.tags ?? ""}`;
  return BANKS.find((b) => b.match.test(haystack)) ?? GENERIC_BANK;
}

const HIGH_RISK = ["SKINCARE", "BEAUTY", "SUPPLEMENT", "HEALTH"];

function softener(lang: string): string {
  return lang === "EN" ? " (results vary by person)" : " (ผลลัพธ์ขึ้นอยู่กับแต่ละคน)";
}

// ---------------------------------------------------------------------------
// Mock provider implementation
// ---------------------------------------------------------------------------

export class MockAiProvider implements AiProvider {
  readonly name = "mock";

  async generateProductAngles(product: ProductInput): Promise<ProductAngles> {
    const bank = bankFor(product);
    const seed = hashString(product.id + product.name);
    const brand = product.brand ?? product.name.split(" ")[0];
    const isRisky = HIGH_RISK.includes(product.riskCategory);

    const whyParts: string[] = [];
    if (product.isKnownBrand)
      whyParts.push(`${brand} already has buyer trust, so conversion friction is low`);
    if (product.isNewLaunch)
      whyParts.push("it is in its launch window — search interest is growing while video coverage is still thin");
    if (product.isRising) whyParts.push("trend signals show fast-rising interest");
    whyParts.push(
      `the category (${product.category}) demonstrates well on camera`,
      `commission of ${product.commissionRate}% ≈ ฿${Math.round((product.price * product.commissionRate) / 100)} per sale makes testing worthwhile`
    );

    return {
      whyItMightSell: whyParts.join("; ") + ".",
      buyerPersonas: bank.buyers,
      painPoints: pickN(bank.painsEN, 3, seed),
      contentAngles: [
        `Early discovery: "${pick(bank.painsEN, seed)}" → this as the practical fix`,
        `${product.isKnownBrand ? "Known-brand launch coverage" : "Hidden-gem find"} with honest first impressions`,
        `Routine/lifestyle integration: show it inside "${pick(bank.contextEN, seed + 1)}"`,
        `Value framing: what ฿${product.price} actually gets you`,
        `Showcase-only aesthetic edit for viewers who skip talking videos`,
      ],
      riskWarnings: isRisky
        ? [
            "High-scrutiny category: keep all benefit wording sensory and conservative",
            'Always add a "results vary" softener',
            "No treatment/cure language, no numeric timelines, no before/after promises",
          ]
        : ["Keep claims factual and verifiable", "Avoid fake scarcity or stale price claims"],
      productBenefits: pickN(bank.benefitsEN, 4, seed + 2),
    };
  }

  async generateHooks(
    product: ProductInput,
    _persona: PersonaInput | null,
    options: GenerationOptions,
    count = 10
  ): Promise<GeneratedHook[]> {
    const bank = bankFor(product);
    const seed = hashString(product.id + options.language + options.style);
    const brand = product.brand ?? "";
    const name = product.name;
    const cat = product.category.toLowerCase();
    const catTH = product.category;
    const painEN = pick(bank.painsEN, seed);
    const painTH = pick(bank.painsTH, seed);
    const benefitEN = pick(bank.benefitsEN, seed + 1);
    const benefitTH = pick(bank.benefitsTH, seed + 1);
    const price = `฿${product.price.toLocaleString()}`;

    const hooksEN: GeneratedHook[] = [
      { type: "discovery", text: `I found this before it goes viral — the ${name} is still under the radar.` },
      { type: "problem", text: `If ${painEN} is your daily struggle, this 30 seconds is for you.` },
      { type: "curiosity", text: `Nobody's talking about ${brand ? `${brand}'s new drop` : `this new ${cat}`} yet… and that's exactly why I am.` },
      { type: "list", text: `3 reasons the ${name} earned a spot in my ${pick(bank.contextEN, seed)} — number 2 surprised me.` },
      { type: "price", text: `${price} for this? Let me show you what you actually get.` },
      { type: "trend", text: `Calling it now: this ${cat} will be everywhere in a month.` },
      { type: "honest", text: `Honest take on the ${name} — including the one thing I'd want you to know first.` },
      { type: "question", text: `Still dealing with ${painEN}? There's a simpler option now.` },
      { type: "social-proof", text: `Reviews for the ${name} keep piling up — here's what they agree on.` },
      { type: "launch", text: `${brand || "This brand"} just launched the ${name} — first look before the hype.` },
    ];

    const hooksTH: GeneratedHook[] = [
      { type: "discovery", text: `เจอก่อนดัง! ${name} ตัวนี้ยังเงียบอยู่ แต่ไม่นานแน่` },
      { type: "problem", text: `ใครเจอปัญหา${painTH}บ่อย ๆ 30 วิของคลิปนี้คุ้มแน่นอน` },
      { type: "curiosity", text: `ยังไม่ค่อยมีใครพูดถึง${brand ? `ของใหม่จาก ${brand}` : `${catTH}ตัวนี้`}เลย… นั่นแหละคือเหตุผลที่เรามาเล่า` },
      { type: "list", text: `3 เหตุผลที่ ${name} ได้เข้ามาอยู่ใน${pick(bank.contextTH, seed)}ของเรา ข้อ 2 คือไม่คิดมาก่อน` },
      { type: "price", text: `${price} ได้อะไรบ้าง? เดี๋ยวโชว์ให้ดูชัด ๆ` },
      { type: "trend", text: `ขอทายไว้ตรงนี้ อีกเดือนเดียว${catTH}ตัวนี้จะเต็มฟีดแน่นอน` },
      { type: "honest", text: `รีวิว ${name} แบบตรง ๆ มีข้อที่ควรรู้ก่อนซื้อด้วย` },
      { type: "question", text: `ยังทน${painTH}อยู่หรือเปล่า? ตอนนี้มีตัวช่วยง่ายกว่านั้น` },
      { type: "social-proof", text: `รีวิว ${name} เริ่มเยอะขึ้นเรื่อย ๆ ส่วนใหญ่พูดตรงกันเรื่องนี้` },
      { type: "launch", text: `${brand || "แบรนด์นี้"} เพิ่งเปิดตัว ${name} — พาดูของจริงก่อนกระแสมา` },
    ];

    const hooksMIX: GeneratedHook[] = hooksTH.map((h, i) => {
      const en = hooksEN[i];
      if (i % 3 === 0) return { type: h.type, text: h.text.replace("เจอก่อนดัง!", "เจอก่อน viral!") };
      if (i % 3 === 1) return h;
      return { type: en.type, text: `${en.text.split("—")[0].trim()} — ${h.text.split(" ").slice(-6).join(" ")}` };
    });

    const pool =
      options.language === "EN" ? hooksEN : options.language === "TH" ? hooksTH : hooksMIX;

    // Template-flavored first hook if a template is selected
    if (options.templateKey) {
      const tpl = getTemplate(options.templateKey);
      if (tpl) {
        const frame = options.language === "EN" ? tpl.hookFrame.EN : tpl.hookFrame.TH;
        pool[0] = {
          type: `template:${tpl.key}`,
          text: frame
            .replace("{product}", name)
            .replace("{brand}", brand || name)
            .replace("{category}", options.language === "EN" ? cat : catTH)
            .replace("{price}", price)
            .replace("{painpoint}", options.language === "EN" ? painEN : painTH)
            .replace("{season}", options.language === "EN" ? "the season" : "หน้าเทศกาล"),
        };
      }
    }

    void benefitEN;
    void benefitTH;
    return pool.slice(0, count);
  }

  async generateConcepts(
    product: ProductInput,
    _persona: PersonaInput | null,
    options: GenerationOptions,
    count = 5
  ): Promise<GeneratedConcept[]> {
    const bank = bankFor(product);
    const seed = hashString(product.id + "concepts");
    const th = options.language !== "EN";
    const name = product.name;
    const concepts: GeneratedConcept[] = [
      {
        title: th ? `เปิดกล่อง ${name} ก่อนใคร` : `First unboxing of the ${name}`,
        angle: "Early-mover launch coverage",
        description: th
          ? `แกะกล่องจริง โชว์แพ็กเกจ ดีเทลตัวสินค้า และความรู้สึกแรก เน้นความสดใหม่ว่ายังไม่ค่อยมีใครรีวิว`
          : `Real unboxing: packaging, product details, and first impressions — leaning into the fact that few creators have covered it yet.`,
        suggestedStyle: "UNBOXING",
      },
      {
        title: th ? `${pick(bank.painsTH, seed)} จบได้ในคลิปเดียว` : `Fixing "${pick(bank.painsEN, seed)}" in one video`,
        angle: "Problem → solution",
        description: th
          ? `เปิดด้วยปัญหาที่คนดูเจอจริง แล้วโชว์ว่า ${name} ช่วยตรงไหน พูดแบบเพื่อนเล่า ไม่เว่อร์`
          : `Open on the exact pain point, then show honestly where the ${name} helps — friend-to-friend tone, no hype.`,
        suggestedStyle: "PROBLEM_SOLUTION",
      },
      {
        title: th ? `${name} ในรูทีนจริง 1 วัน` : `A real day with the ${name}`,
        angle: "Routine integration",
        description: th
          ? `ถ่ายการใช้งานจริงใน${pick(bank.contextTH, seed + 1)} ให้เห็นว่าเข้ากับชีวิตประจำวันยังไง`
          : `Show it inside "${pick(bank.contextEN, seed + 1)}" so viewers can picture it in their own routine.`,
        suggestedStyle: "PRODUCT_DEMO",
      },
      {
        title: th ? `โชว์ของล้วน ๆ ไม่ต้องพูด` : `Pure showcase — no talking`,
        angle: "Aesthetic product showcase",
        description: th
          ? `คลิปสวย ๆ โคลสอัพแพ็กเกจ เท็กซ์เจอร์ แสงพรีเมียม เหมาะกับคนดูที่เลื่อนผ่านคลิปพูด`
          : `Macro close-ups, texture, premium light. For viewers who skip talking-head videos.`,
        suggestedStyle: "PRODUCT_SHOWCASE",
      },
      {
        title: th ? `3 เหตุผลใน 15 วิ` : `3 reasons in 15 seconds`,
        angle: "Fast value list",
        description: th
          ? `ลิสต์ 3 ข้อแบบกระชับ ตัดไว ขึ้นข้อความบนจอทุกข้อ ปิดด้วย CTA สั้น ๆ`
          : `Tight 3-point list with on-screen text per point and a short CTA close.`,
        suggestedStyle: "THREE_SCENE_AD",
      },
    ];
    return concepts.slice(0, count);
  }

  async generateScript(
    product: ProductInput,
    persona: PersonaInput | null,
    options: GenerationOptions,
    variant = 0
  ): Promise<GeneratedScript> {
    const bank = bankFor(product);
    const seed = hashString(product.id + options.language + variant);
    const th = options.language !== "EN";
    const name = product.name;
    const strict =
      options.claimStrictness !== "NORMAL" || HIGH_RISK.includes(product.riskCategory);
    const soft = strict ? softener(th ? "TH" : "EN") : "";
    const dur = options.durationSec;
    const price = `฿${product.price.toLocaleString()}`;

    const hooks = await this.generateHooks(product, persona, options, 10);
    const hookLine = hooks[variant % hooks.length].text;

    const benefit1 = th ? pick(bank.benefitsTH, seed) : pick(bank.benefitsEN, seed);
    const benefit2 = th ? pick(bank.benefitsTH, seed + 3) : pick(bank.benefitsEN, seed + 3);
    const pain = th ? pick(bank.painsTH, seed) : pick(bank.painsEN, seed);
    const context = th ? pick(bank.contextTH, seed) : pick(bank.contextEN, seed);

    const cta = th
      ? "ใครสนใจ กดดูรายละเอียดที่ลิงก์ได้เลย เช็กราคาล่าสุดก่อนตัดสินใจนะ"
      : "If you're curious, the link has the details — check the current price before you decide.";

    // Scale beats to duration: 8s = 3 beats, 15s = 4, 30s = 5, 45s = 6.
    const beatCount = dur <= 8 ? 3 : dur <= 15 ? 4 : dur <= 30 ? 5 : 6;

    const beatsTH: string[] = [
      `[Hook] ${hookLine}`,
      `[ปัญหา] ปกติเราเจอเรื่อง${pain}บ่อยมาก`,
      `[แนะนำ] ตัวนี้คือ ${name}${product.brand ? ` จาก ${product.brand}` : ""} จุดที่ชอบคือ${benefit1}${soft}`,
      `[รายละเอียด] อีกอย่างคือ${benefit2} ลองใช้ตอน${context}แล้วเข้ากับชีวิตจริงมาก`,
      `[ราคา] ราคาอยู่ที่ประมาณ ${price} ถือว่าอยู่ในเกณฑ์ที่ตัดสินใจง่าย`,
      `[ปิด] ${cta}`,
    ];
    const beatsEN: string[] = [
      `[Hook] ${hookLine}`,
      `[Problem] Honestly, ${pain} used to be a weekly thing for me-­slash-everyone.`,
      `[Introduce] This is the ${name}${product.brand ? ` from ${product.brand}` : ""} — what stands out is ${benefit1}${soft}.`,
      `[Detail] Also: ${benefit2}. I'd slot it into ${context} and it just fits.`,
      `[Price] It sits around ${price}, which makes it an easy test.`,
      `[Close] ${cta}`,
    ];

    const chosen = (th ? beatsTH : beatsEN).slice(0, beatCount - 1);
    chosen.push(th ? beatsTH[beatsTH.length - 1] : beatsEN[beatsEN.length - 1]);

    const perBeat = Math.max(2, Math.round(dur / chosen.length));
    const shotList: ShotListItem[] = chosen.map((beat, i) => {
      const start = i * perBeat;
      const visualBank = [
        th ? "โคลสอัพสินค้าเต็มเฟรม เห็นชื่อรุ่นชัด" : "Macro close-up of the product, label readable",
        th ? "มุมสายตาคนใช้ กำลังหยิบสินค้าใช้จริง" : "POV shot of hands using the product naturally",
        th ? "พรีเซนเตอร์ถือสินค้าระดับอก พูดกับกล้อง" : "Presenter holds product at chest height, talking to camera",
        th ? "ฉากการใช้งานจริงในบริบทประจำวัน" : "Usage context scene in a real daily setting",
        th ? "ขึ้นการ์ดราคา + ข้อความ CTA" : "Price card + CTA text overlay",
        th ? "ช็อตปิด โลโก้สินค้า + ข้อความ disclosure" : "Closing shot with product + disclosure text",
      ];
      return {
        scene: i + 1,
        timecode: `${start}s–${Math.min(start + perBeat, dur)}s`,
        visual: visualBank[i % visualBank.length],
        voiceover: beat.replace(/^\[[^\]]+\]\s*/, ""),
        onScreenText:
          i === 0
            ? th
              ? "เจอก่อนดัง 👀"
              : "Found it early 👀"
            : i === chosen.length - 1
              ? th
                ? "#ad ลิงก์ในไบโอ"
                : "#ad link in bio"
              : undefined,
      };
    });

    return {
      title: th
        ? `สคริปต์ ${dur} วิ — ${name} (แบบที่ ${variant + 1})`
        : `${dur}s script — ${name} (variant ${variant + 1})`,
      durationSec: dur,
      hookLine,
      body: chosen.join("\n\n"),
      shotList,
      cta,
    };
  }

  async generateCaption(
    product: ProductInput,
    options: GenerationOptions,
    variant = 0
  ): Promise<GeneratedCaption> {
    const bank = bankFor(product);
    const seed = hashString(product.id + "caption" + variant);
    const th = options.language !== "EN";
    const name = product.name;
    const strict =
      options.claimStrictness !== "NORMAL" || HIGH_RISK.includes(product.riskCategory);
    const benefit = th ? pick(bank.benefitsTH, seed) : pick(bank.benefitsEN, seed);
    const pain = th ? pick(bank.painsTH, seed) : pick(bank.painsEN, seed);

    const bodiesTH = [
      `เจอ ${name} มาช่วยเรื่อง${pain} จุดที่ชอบคือ${benefit}${strict ? " ผลลัพธ์ขึ้นอยู่กับแต่ละคนนะ" : ""} ใครสนใจดูรายละเอียดที่ลิงก์ได้เลย`,
      `${name} ตัวนี้ยังไม่ค่อยมีคนพูดถึง แต่รีวิวเริ่มมาเรื่อย ๆ ${benefit} ราคา ฿${product.price.toLocaleString()} เช็กเพิ่มเติมที่ลิงก์`,
      `บันทึกไว้ก่อน ${name} — ${benefit} เผื่อใครกำลังหา${product.category}อยู่พอดี รายละเอียดที่ลิงก์เลย`,
    ];
    const bodiesEN = [
      `Found the ${name} while hunting for a fix for ${pain}. What stands out: ${benefit}.${strict ? " Results vary by person." : ""} Details at the link.`,
      `Not many people are covering the ${name} yet, but reviews are starting to stack up. ${benefit}. Around ฿${product.price.toLocaleString()} — link for the current price.`,
      `Bookmarking this one: ${name} — ${benefit}. If you've been shopping for a ${product.category.toLowerCase()}, the link has details.`,
    ];

    const hashtags = [
      ...pickN(bank.hashtags, 4, seed),
      product.brand ? `#${product.brand.replace(/\s+/g, "")}` : "#新",
      th ? "#ป้ายยา" : "#TikTokFinds",
    ].filter((h) => h !== "#新");

    const disclosure = DISCLOSURE_TEXT[options.language] ?? DISCLOSURE_TEXT.MIX;

    return {
      text: th ? bodiesTH[variant % bodiesTH.length] : bodiesEN[variant % bodiesEN.length],
      hashtags,
      disclosure,
    };
  }

  async generateVideoPrompt(
    product: ProductInput,
    persona: PersonaInput | null,
    options: GenerationOptions,
    promptType: string
  ): Promise<GeneratedVideoPrompt> {
    const bank = bankFor(product);
    const seed = hashString(product.id + promptType);
    const name = product.name;
    const brand = product.brand ?? "";
    const isPersona = promptType.startsWith("PERSONA") && persona;
    const strict = HIGH_RISK.includes(product.riskCategory);
    const buyer = pick(bank.buyers, seed);
    const th = options.language !== "EN";

    const showcaseScenes = [
      `Macro close-up: the ${name} packaging rotating slowly on a clean surface, product name in sharp focus and readable`,
      `Detail shot: texture/material of the product${strict ? " (no skin application close-up)" : ""}, soft highlight sweep`,
      `Hands (natural, unhurried) lift the product and present it toward camera`,
      `Usage context: the product placed in ${pick(bank.contextEN, seed)} setting, shallow depth of field`,
      `Final: product centered, price-tag style text card fades in with CTA and small disclosure line`,
    ];

    const personaScenes = persona
      ? [
          `Presenter (${persona.name}, fictional) on camera, ${persona.cameraStyle.toLowerCase() || "handheld selfie framing"} — delivers the hook in the first 2 seconds while holding the ${name} at chest height`,
          `Cut-in: close-up of the ${name}, label readable, while presenter's voiceover continues`,
          `Presenter demonstrates one concrete use in ${pick(bank.contextEN, seed)} context, natural pace`,
          `Presenter gives one honest consideration ("good to know before buying"), relaxed expression`,
          `Close: presenter smiles, product beside face level, on-screen CTA + affiliate disclosure text visible`,
        ]
      : showcaseScenes;

    const sections: VideoPromptSections = {
      objective: isPersona
        ? `Create a natural, trustworthy short-form affiliate video where a consistent fictional AI presenter introduces the ${name} without hard-selling`
        : `Create a premium product-showcase short video that makes the ${name} feel desirable through visuals alone`,
      product: `${name}${brand ? ` by ${brand}` : ""} — ${product.category}, priced around ฿${product.price.toLocaleString()}`,
      targetBuyer: `${buyer.name}: ${buyer.description}`,
      videoFormat: `${options.durationSec}s vertical 9:16 short-form video for ${options.platform === "FACEBOOK" ? "Facebook Reels" : options.platform === "SHOPEE_VIDEO" ? "Shopee Video" : "TikTok"}`,
      sceneSequence: isPersona ? personaScenes : showcaseScenes,
      cameraMovement: isPersona
        ? "Mostly static handheld feel with subtle micro-movement; one slow push-in on the product cut-in"
        : "Slow orbit and push-in moves; macro rack focus between label and texture; no whip pans",
      lighting: "Soft, premium key light with gentle highlights; clean white balance; no harsh shadows",
      background: isPersona
        ? persona?.background || "Tidy, softly lit room corner with warm neutral tones"
        : "Seamless neutral backdrop or minimal styled surface matching the product's color story",
      personaDescription: isPersona && persona ? `${persona.visualDescription} ${persona.consistencyPrompt}` : undefined,
      wardrobe: isPersona && persona ? persona.clothingStyle : undefined,
      productHandling: "Natural, unhurried hand movement; product label always readable; no covering the name with fingers",
      onScreenText: [
        th ? `"${name}" (ชื่อสินค้า ชัด อ่านง่าย)` : `"${name}" (product name, clean and readable)`,
        th ? "จุดเด่นสั้น ๆ 2-3 คำต่อฉาก" : "2-3 word benefit captions per scene",
        th ? "#ad / ได้รับค่าคอมมิชชั่น (ช่วงท้าย)" : "#ad / affiliate disclosure (final scene)",
      ],
      voiceover: isPersona
        ? `Natural conversational ${options.language === "EN" ? "English" : options.language === "TH" ? "Thai" : "Thai with light English mixing"}, ${persona?.voiceTone.toLowerCase() || "warm and friendly"}, like a friend explaining a find — never salesy${strict ? "; strictly no treatment claims, add a results-vary note" : ""}`
        : "None or minimal — let music and visuals carry; optional soft whisper-style captions",
      audioMusicDirection: isPersona
        ? "Quiet lo-fi or acoustic bed under voice, ducked -18dB; no copyrighted tracks"
        : "Modern minimal beat with soft percussion; satisfying foley on product touches; no copyrighted tracks",
      visualStyle: isPersona
        ? "Realistic UGC aesthetic, TikTok-native, warm color grade, slight film grain"
        : "Premium commercial aesthetic, crisp macro detail, cohesive color palette drawn from the packaging",
      mustInclude: isPersona ? [...PERSONA_FOCUS] : [...SHOWCASE_FOCUS],
      mustAvoid: [
        "any real person's likeness or celebrity reference",
        "exaggerated or medical claims" + (strict ? " (health/beauty strict mode)" : ""),
        "fake scarcity or fake discounts",
        "warped text, gibberish labels, distorted hands",
      ],
      brandSafetyNotes: [
        "Presenter is a FICTIONAL AI persona — must not resemble a specific real person",
        "Tone stays honest and helpful; no pressure tactics",
        strict
          ? "High-scrutiny category: sensory language only (feels, looks, applies) — no outcome promises"
          : "Keep all product claims verifiable from the product listing",
      ],
      disclosurePlacement: "On-screen text in the final scene AND in the caption (#ad + affiliate commission note)",
      finalCta: th
        ? "ใครสนใจ ลิงก์อยู่ที่ไบโอ/ตะกร้า เช็กราคาล่าสุดได้เลย"
        : "Link in bio/cart if you want to check the current price",
    };

    return {
      title: `${isPersona ? "Persona" : "Showcase"} Veo prompt — ${name}`,
      promptType,
      sections,
      compiledPrompt: compileVideoPrompt(sections),
      negativePrompt: BASE_NEGATIVE_PROMPT,
    };
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

    const showcasePrompt = await this.generateVideoPrompt(
      product,
      null,
      options,
      "PRODUCT_SHOWCASE"
    );
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
