import { db } from "@/lib/db";
import { PersonaStudio } from "@/components/personas/persona-studio";
import type { PersonaWithCounts } from "@/components/personas/persona-shared";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Persona Studio — Affiliate Command Center",
};

export default async function PersonasPage() {
  const personas = await db.persona.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    include: {
      _count: { select: { contentIdeas: true, videoPrompts: true, campaigns: true } },
    },
  });

  const serialized: PersonaWithCounts[] = personas.map(
    ({ _count, createdAt, updatedAt, ...persona }) => ({
      ...persona,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      counts: _count,
    })
  );

  return <PersonaStudio personas={serialized} />;
}
