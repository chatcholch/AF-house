// PATCH /api/content-ideas/[id] — update status (approve / reject / etc.)
// DELETE /api/content-ideas/[id] — remove an idea (cascades scripts/captions/prompts links)

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CONTENT_STATUSES } from "@/lib/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { status?: string };
  try {
    body = (await req.json()) as { status?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const status = body?.status;
  if (typeof status !== "string" || !(CONTENT_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${CONTENT_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const contentIdea = await db.contentIdea.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json({ contentIdea });
  } catch {
    return NextResponse.json({ error: "Content idea not found" }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await db.contentIdea.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Content idea not found" }, { status: 404 });
  }
}
