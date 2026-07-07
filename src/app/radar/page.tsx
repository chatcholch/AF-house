import { db } from "@/lib/db";
import { RadarClient } from "@/components/radar/radar-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "Product Radar — Affiliate Command Center" };

export default async function RadarPage() {
  const products = await db.product.findMany({
    include: {
      trendSignals: { orderBy: { detectedAt: "desc" } },
      affiliateLinks: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { opportunityScore: "desc" },
  });

  const serialized = products.map((p) => ({
    ...p,
    launchDate: p.launchDate?.toISOString() ?? null,
    lastSyncedAt: p.lastSyncedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    trendSignals: p.trendSignals.map((s) => ({
      ...s,
      detectedAt: s.detectedAt.toISOString(),
    })),
    affiliateLinks: p.affiliateLinks.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    })),
  }));

  return <RadarClient products={serialized} />;
}
