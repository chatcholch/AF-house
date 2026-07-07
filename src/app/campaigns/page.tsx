import { CampaignBoardClient } from "@/components/campaigns/campaign-board-client";
import type { CampaignRow } from "@/components/campaigns/types";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const [campaigns, products, personas] = await Promise.all([
    db.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { id: true, name: true } },
        persona: { select: { id: true, name: true } },
        results: { orderBy: { recordedAt: "desc" }, take: 1 },
      },
    }),
    db.product.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.persona.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const rows: CampaignRow[] = campaigns.map((c) => ({
    id: c.id,
    productId: c.productId,
    contentIdeaId: c.contentIdeaId,
    videoPromptId: c.videoPromptId,
    personaId: c.personaId,
    platform: c.platform,
    title: c.title,
    videoStyle: c.videoStyle,
    hookUsed: c.hookUsed,
    scriptText: c.scriptText,
    captionText: c.captionText,
    promptText: c.promptText,
    status: c.status,
    scheduledDate: c.scheduledDate?.toISOString() ?? null,
    postedDate: c.postedDate?.toISOString() ?? null,
    postUrl: c.postUrl,
    notes: c.notes,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    product: c.product,
    persona: c.persona,
    results: c.results.map((r) => ({
      id: r.id,
      recordedAt: r.recordedAt.toISOString(),
      periodLabel: r.periodLabel,
      views: r.views,
      likes: r.likes,
      comments: r.comments,
      shares: r.shares,
      saves: r.saves,
      clicks: r.clicks,
      orders: r.orders,
      gmv: r.gmv,
      commission: r.commission,
    })),
  }));

  return <CampaignBoardClient campaigns={rows} products={products} personas={personas} />;
}
