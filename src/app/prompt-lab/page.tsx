import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { PromptLabClient } from "@/components/prompt-lab/prompt-lab-client";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Prompt Lab" };

export default async function PromptLabPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string }>;
}) {
  const { productId } = await searchParams;

  const [products, personas, recentIdeas] = await Promise.all([
    db.product.findMany({
      select: {
        id: true,
        name: true,
        brand: true,
        category: true,
        riskCategory: true,
        price: true,
        commissionRate: true,
        platform: true,
        opportunityScore: true,
      },
      orderBy: { opportunityScore: "desc" },
    }),
    db.persona.findMany({ orderBy: [{ isDefault: "desc" }, { name: "asc" }] }),
    db.contentIdea.findMany({
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Prompt Lab"
        description="Generate hooks, scripts, captions, and Veo video prompts for a product — everything stays a draft until you approve it."
      />
      <PromptLabClient
        products={products}
        personas={personas.map((p) => ({
          id: p.id,
          name: p.name,
          ageRange: p.ageRange,
          style: p.style,
          voiceTone: p.voiceTone,
          personality: p.personality,
          isDefault: p.isDefault,
        }))}
        queue={recentIdeas.map((i) => ({
          id: i.id,
          title: i.title,
          status: i.status,
          language: i.language,
          platform: i.platform,
          style: i.style,
          createdAt: formatDate(i.createdAt),
          productName: i.product.name,
        }))}
        initialProductId={productId ?? null}
      />
    </div>
  );
}
