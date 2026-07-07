// Shared types + helpers for the Persona Studio (no JSX — safe to import
// from both server and client modules).

export interface PersonaCounts {
  contentIdeas: number;
  videoPrompts: number;
  campaigns: number;
}

/** Editable persona fields — mirrors the Prisma Persona model. */
export interface PersonaFormValues {
  name: string;
  ageRange: string;
  style: string;
  voiceTone: string;
  personality: string;
  clothingStyle: string;
  background: string;
  cameraStyle: string;
  speakingStyle: string;
  visualDescription: string;
  consistencyPrompt: string;
  doList: string;
  dontList: string;
  brandSafeRules: string;
  isDefault: boolean;
}

/** Serialized persona passed from the server page to client components. */
export interface PersonaWithCounts extends PersonaFormValues {
  id: string;
  isFictional: boolean;
  createdAt: string;
  updatedAt: string;
  counts: PersonaCounts;
}

export const EMPTY_PERSONA_FORM: PersonaFormValues = {
  name: "",
  ageRange: "",
  style: "",
  voiceTone: "",
  personality: "",
  clothingStyle: "",
  background: "",
  cameraStyle: "",
  speakingStyle: "",
  visualDescription: "",
  consistencyPrompt: "",
  doList: "",
  dontList: "",
  brandSafeRules: "",
  isDefault: false,
};

/** Split a newline-separated list field into clean display items. */
export function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}

/**
 * Assemble the paste-ready persona block for a Veo prompt:
 * visual identity + consistency lock + wardrobe/scene/camera + delivery
 * + brand-safety rules, with the mandatory fictional disclaimer.
 */
export function buildConsistencyBlock(p: {
  name: string;
  ageRange?: string;
  visualDescription: string;
  consistencyPrompt: string;
  clothingStyle?: string;
  background?: string;
  cameraStyle?: string;
  voiceTone?: string;
  speakingStyle?: string;
  brandSafeRules?: string;
}): string {
  const lines: string[] = [];
  const name = p.name.trim() || "Unnamed persona";
  const age = p.ageRange?.trim();
  lines.push(`PERSONA — ${name} (fictional AI presenter${age ? `, ${age}` : ""})`);

  const push = (label: string, value?: string) => {
    const v = value?.trim();
    if (v) lines.push(`${label}: ${v}`);
  };

  push("Appearance", p.visualDescription);
  push("Consistency lock", p.consistencyPrompt);
  push("Wardrobe", p.clothingStyle);
  push("Setting", p.background);
  push("Camera", p.cameraStyle);

  const delivery = [p.voiceTone?.trim(), p.speakingStyle?.trim()]
    .filter(Boolean)
    .join(" — ");
  if (delivery) lines.push(`Voice & delivery: ${delivery}`);

  push("Brand-safety rules", p.brandSafeRules);
  lines.push(
    "This presenter is entirely fictional and AI-generated. Do not resemble any real person, public figure, or celebrity."
  );
  return lines.join("\n");
}

// Deterministic avatar styling — same name always gets the same color pair,
// tuned to read well in both light and dark themes.
const AVATAR_COLORS = [
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300",
] as const;

export function personaAvatarClass(name: string): string {
  let hash = 0;
  for (const ch of name.trim().toLowerCase()) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function personaInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
