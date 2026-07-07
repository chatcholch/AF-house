import { db } from "@/lib/db";
import { MonitorView } from "@/components/monitor/monitor-view";
import type {
  CampaignRow,
  MonitorTotals,
} from "@/components/monitor/monitor-types";

export const dynamic = "force-dynamic";

const LIVE_STATUSES = ["POSTED", "TESTING", "WINNER", "FAILED"];

export default async function MonitorPage() {
  const [campaigns, aggregates] = await Promise.all([
    db.campaign.findMany({
      where: { status: { in: LIVE_STATUSES } },
      include: {
        product: { select: { name: true, category: true } },
        persona: { select: { name: true } },
        results: { orderBy: { recordedAt: "desc" } },
      },
      orderBy: [{ postedDate: "desc" }, { updatedAt: "desc" }],
    }),
    db.campaignResult.aggregate({
      _count: true,
      _sum: {
        views: true,
        clicks: true,
        orders: true,
        gmv: true,
        commission: true,
      },
    }),
  ]);

  const rows: CampaignRow[] = campaigns.map((c) => ({
    id: c.id,
    title: c.title,
    platform: c.platform,
    status: c.status,
    postedDate: c.postedDate?.toISOString() ?? null,
    productName: c.product.name,
    productCategory: c.product.category,
    personaName: c.persona?.name ?? null,
    results: c.results.map((r) => ({
      id: r.id,
      campaignId: r.campaignId,
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
      source: r.source,
      notes: r.notes,
    })),
  }));

  const totals: MonitorTotals = {
    resultCount: aggregates._count,
    views: aggregates._sum.views ?? 0,
    clicks: aggregates._sum.clicks ?? 0,
    orders: aggregates._sum.orders ?? 0,
    gmv: aggregates._sum.gmv ?? 0,
    commission: aggregates._sum.commission ?? 0,
  };

  return <MonitorView campaigns={rows} totals={totals} />;
}
