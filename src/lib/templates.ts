// Prompt Template Library
//
// Reusable content templates. EDIT TEMPLATES HERE — each template shapes the
// angle, hook framing, and structure the generator uses. The `hookFrame` and
// `structure` fields are consumed by the mock provider and are also included
// in prompts sent to OpenAI/Gemini providers.

export interface ContentTemplate {
  key: string;
  name: string;
  description: string;
  bestFor: string;
  hookFrame: { EN: string; TH: string }; // {product}, {brand}, {category} placeholders
  structure: string[]; // beat-by-beat outline
  exampleAngle: string;
}

export const CONTENT_TEMPLATES: ContentTemplate[] = [
  {
    key: "new-brand-drop",
    name: "New brand drop alert",
    description: "Announce a brand-new product from an emerging brand before anyone covers it.",
    bestFor: "New launches from small/unknown brands with low content saturation",
    hookFrame: {
      EN: "This new {category} just dropped and almost nobody is talking about it yet",
      TH: "{category}ตัวใหม่เพิ่งเปิดตัว แทบยังไม่มีใครพูดถึงเลย",
    },
    structure: [
      "Hook: new drop, early discovery framing",
      "Show product + packaging quickly",
      "2-3 concrete things that make it interesting",
      "Who it fits / who should skip it",
      "Soft CTA + disclosure",
    ],
    exampleAngle: "Early-mover discovery — 'found it before it trends'",
  },
  {
    key: "before-viral",
    name: "“I found this before it goes viral”",
    description: "Position the product as about to blow up; viewer gets in early.",
    bestFor: "Rising products with strong trend signals but low video count",
    hookFrame: {
      EN: "I'm calling it now — this {category} is about to be everywhere",
      TH: "ขอทายไว้เลย อีกไม่นาน{category}ตัวนี้จะดังแน่นอน",
    },
    structure: [
      "Hook: bold early prediction",
      "Evidence: why it's rising (reviews, sales, uniqueness)",
      "Quick demo of the standout feature",
      "Price/value moment",
      "CTA: check it before it trends + disclosure",
    ],
    exampleAngle: "Trend prediction with concrete reasons",
  },
  {
    key: "problem-solution",
    name: "Problem → solution",
    description: "Open with a relatable pain point, present the product as one practical fix.",
    bestFor: "Products with a clear, visual pain point",
    hookFrame: {
      EN: "If {painpoint} annoys you every day, watch this",
      TH: "ใครมีปัญหา{painpoint}บ่อย ๆ ดูคลิปนี้ก่อน",
    },
    structure: [
      "Hook: name the pain point exactly",
      "Agitate briefly (relatable moment)",
      "Introduce product as one solution — not a miracle",
      "Show it working",
      "Honest limitation + soft CTA + disclosure",
    ],
    exampleAngle: "Practical fix framing with honest limits",
  },
  {
    key: "three-reasons",
    name: "3 reasons why",
    description: "Fast list format: three concrete reasons this product is worth a look.",
    bestFor: "Almost any product; strong for short 15s cuts",
    hookFrame: {
      EN: "3 reasons this {category} is worth a look",
      TH: "3 เหตุผลที่{category}ตัวนี้น่าโดน",
    },
    structure: [
      "Hook: '3 reasons' promise",
      "Reason 1: strongest feature, shown visually",
      "Reason 2: price/value or commission-side value",
      "Reason 3: fits daily routine / easy to use",
      "Recap + CTA + disclosure",
    ],
    exampleAngle: "Fast, scannable value list",
  },
  {
    key: "product-showcase",
    name: "Product showcase",
    description: "No presenter — pure product beauty shots, close-ups, texture, and usage context.",
    bestFor: "Visually attractive products; works without a persona",
    hookFrame: {
      EN: "POV: the {category} everyone will ask you about",
      TH: "POV: {category}ที่เพื่อนต้องถามว่าซื้อที่ไหน",
    },
    structure: [
      "Macro close-up hook shot",
      "Packaging + unbox beat",
      "Texture / material detail",
      "Usage context scene",
      "Price card + CTA + disclosure",
    ],
    exampleAngle: "Aesthetic-first, product-as-hero",
  },
  {
    key: "soft-review",
    name: "Soft review",
    description: "Calm, balanced review tone — pros, one con, who it's for.",
    bestFor: "Building trust; skincare/beauty where hype feels risky",
    hookFrame: {
      EN: "Honest take on the {brand} {category} everyone keeps asking about",
      TH: "รีวิวตรง ๆ {category}จาก {brand} ที่หลายคนถามถึง",
    },
    structure: [
      "Hook: honest-take framing",
      "What it is, in one line",
      "2 things it does well (conservative wording)",
      "1 thing to know before buying",
      "Who it fits + results-vary note + CTA + disclosure",
    ],
    exampleAngle: "Trust-first balanced review",
  },
  {
    key: "unboxing",
    name: "Unboxing",
    description: "First-open experience: packaging, first impressions, what's in the box.",
    bestFor: "New launches, products with nice packaging",
    hookFrame: {
      EN: "Unboxing the new {brand} {category} — first look",
      TH: "แกะกล่อง {category}ตัวใหม่จาก {brand} — ดูของจริงกัน",
    },
    structure: [
      "Hook: box in hand, 'just arrived'",
      "Open + reveal beat",
      "What's inside, piece by piece",
      "First impression (texture/build/smell as appropriate)",
      "Verdict-so-far + CTA + disclosure",
    ],
    exampleAngle: "First-look excitement without overclaiming",
  },
  {
    key: "price-value",
    name: "Price/value comparison",
    description: "Frame the product's price against what you get; compare with typical alternatives.",
    bestFor: "High-value items, budget finds, high-commission products",
    hookFrame: {
      EN: "This {category} costs {price} — here's what you actually get",
      TH: "{category}ราคา {price} ได้อะไรบ้าง มาดูกัน",
    },
    structure: [
      "Hook: name the price up front",
      "What you get, feature by feature",
      "Compare with typical price range of the category (no named-brand bashing)",
      "Who should / shouldn't buy",
      "CTA: check current price + disclosure",
    ],
    exampleAngle: "Transparent value math",
  },
  {
    key: "routine-integration",
    name: "Routine integration",
    description: "Show the product inside a daily routine — morning, night, work, gym.",
    bestFor: "Skincare, supplements (with safe wording), home & lifestyle products",
    hookFrame: {
      EN: "Adding the new {brand} {category} to my routine — here's where it fits",
      TH: "เอา{category}ตัวใหม่ของ {brand} มาลองใส่ในรูทีน ดูว่าเข้ากันไหม",
    },
    structure: [
      "Hook: routine framing",
      "Step where the product slots in",
      "How to use it (simple, visual)",
      "Sensory description — conservative wording, results vary",
      "CTA + disclosure",
    ],
    exampleAngle: "Lifestyle-fit demonstration",
  },
  {
    key: "seasonal",
    name: "Seasonal campaign",
    description: "Tie the product to an upcoming season, festival, or shopping event.",
    bestFor: "Seasonal products, 11.11/12.12 events, songkran/summer/rainy season",
    hookFrame: {
      EN: "Before {season} hits, you might want this {category} ready",
      TH: "ก่อน{season}จะมา เตรียม{category}ไว้ก่อนดีกว่า",
    },
    structure: [
      "Hook: seasonal deadline framing",
      "Why the season creates the need",
      "Product as preparation",
      "Quick demo",
      "CTA: get it before the season + disclosure",
    ],
    exampleAngle: "Timely preparation urgency (honest, no fake scarcity)",
  },
  {
    key: "known-brand-launch",
    name: "Known-brand new launch",
    description:
      "A trusted brand released something new — cover it early while search interest grows.",
    bestFor: "New products from famous brands (e.g. a new CeraVe launch)",
    hookFrame: {
      EN: "{brand} just launched a new {category} — here's what's different",
      TH: "{brand} ออก{category}ตัวใหม่แล้ว มีอะไรใหม่บ้าง มาดูกัน",
    },
    structure: [
      "Hook: brand name + 'new launch' (brand carries trust)",
      "What's new vs the classic line",
      "Who it's aimed at",
      "Conservative benefit description + results vary",
      "CTA: link to check it + disclosure",
    ],
    exampleAngle: "Ride brand trust + launch-window search demand",
  },
];

export function getTemplate(key: string): ContentTemplate | undefined {
  return CONTENT_TEMPLATES.find((t) => t.key === key);
}
