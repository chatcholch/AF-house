import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const personaCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
  ageRange: z.string().trim().max(300).default(""),
  style: z.string().trim().max(600).default(""),
  voiceTone: z.string().trim().max(600).default(""),
  personality: z.string().trim().max(2000).default(""),
  clothingStyle: z.string().trim().max(1000).default(""),
  background: z.string().trim().max(1000).default(""),
  cameraStyle: z.string().trim().max(1000).default(""),
  speakingStyle: z.string().trim().max(2000).default(""),
  visualDescription: z.string().trim().max(4000).default(""),
  consistencyPrompt: z.string().trim().max(4000).default(""),
  doList: z.string().max(4000).default(""),
  dontList: z.string().max(4000).default(""),
  brandSafeRules: z.string().trim().max(4000).default(""),
  isDefault: z.boolean().default(false),
});

const PERSONA_COUNTS = {
  _count: { select: { contentIdeas: true, videoPrompts: true, campaigns: true } },
} as const;

export async function GET() {
  const personas = await db.persona.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    include: PERSONA_COUNTS,
  });
  return NextResponse.json({ personas });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = personaCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Validation failed",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const existingCount = await db.persona.count();
  // The very first persona is always the default.
  const makeDefault = data.isDefault || existingCount === 0;

  const persona = await db.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.persona.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    return tx.persona.create({
      data: {
        ...data,
        isDefault: makeDefault,
        // Personas are always fictional — enforced server-side.
        isFictional: true,
      },
      include: PERSONA_COUNTS,
    });
  });

  return NextResponse.json({ persona }, { status: 201 });
}
