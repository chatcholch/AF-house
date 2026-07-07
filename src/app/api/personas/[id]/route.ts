import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const personaUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
    ageRange: z.string().trim().max(300),
    style: z.string().trim().max(600),
    voiceTone: z.string().trim().max(600),
    personality: z.string().trim().max(2000),
    clothingStyle: z.string().trim().max(1000),
    background: z.string().trim().max(1000),
    cameraStyle: z.string().trim().max(1000),
    speakingStyle: z.string().trim().max(2000),
    visualDescription: z.string().trim().max(4000),
    consistencyPrompt: z.string().trim().max(4000),
    doList: z.string().max(4000),
    dontList: z.string().max(4000),
    brandSafeRules: z.string().trim().max(4000),
    isDefault: z.boolean(),
  })
  .partial();

const PERSONA_COUNTS = {
  _count: { select: { contentIdeas: true, videoPrompts: true, campaigns: true } },
} as const;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const persona = await db.persona.findUnique({
    where: { id },
    include: PERSONA_COUNTS,
  });
  if (!persona) {
    return NextResponse.json({ error: "Persona not found" }, { status: 404 });
  }
  return NextResponse.json({ persona });
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = personaUpdateSchema.safeParse(body);
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

  const existing = await db.persona.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Persona not found" }, { status: 404 });
  }

  const persona = await db.$transaction(async (tx) => {
    if (parsed.data.isDefault === true) {
      await tx.persona.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }
    return tx.persona.update({
      where: { id },
      data: {
        ...parsed.data,
        // Personas can never be flipped to non-fictional.
        isFictional: true,
      },
      include: PERSONA_COUNTS,
    });
  });

  return NextResponse.json({ persona });
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const existing = await db.persona.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Persona not found" }, { status: 404 });
  }

  const total = await db.persona.count();
  if (total <= 1) {
    return NextResponse.json(
      { error: "Cannot delete the only persona. Create another persona first." },
      { status: 400 }
    );
  }

  // Relations (contentIdeas, videoPrompts, campaigns) are SetNull — linked
  // content is kept, only the persona reference is cleared.
  await db.$transaction(async (tx) => {
    await tx.persona.delete({ where: { id } });
    if (existing.isDefault) {
      // Keep the "always one default" invariant: promote the oldest remaining.
      const next = await tx.persona.findFirst({ orderBy: { createdAt: "asc" } });
      if (next) {
        await tx.persona.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
