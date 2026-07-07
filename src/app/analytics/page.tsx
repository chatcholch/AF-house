import {
  Banknote,
  Coins,
  Crown,
  LayoutGrid,
  MonitorPlay,
  PauseCircle,
  Quote,
  Rocket,
  Share2,
  ShoppingCart,
  Tags,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { BreakdownCard, type BreakdownRow } from "@/components/analytics/breakdown-card";
import { CampaignsTable, type CampaignPerfRow } from "@/components/analytics/campaigns-table";
import { HookLeaderboard, type HookRow } from "@/components/analytics/hook-leaderboard";
import {
  RecommendationCard,
  type RecommendationItem,
} from "@/components/analytics/recommendation-card";
import { db } from "@/lib/db";
import { label } from "@/lib/types";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Server-side aggregation (plain serializable objects only)
// ---------------------------------------------------------------------------

interface CampaignPerf {
  id: string;
  title: string;
  platform: string;
  videoStyle: string | null;
  hookUsed: string | null;
  status: string;
  posted: boolean;
  personaName: string | null;
  productId: string;
  productName: string;
  productCategory: string;
  productStatus: string;
  views: number;
  engagement: number;
  clicks: number;
  orders: number;
  gmv: number;
  commission: number;
  cvr: number; // orders / clicks
  engagementRate: number; // engagement / views
  ctr: number; // clicks / views (CTR proxy)
}

const CONCLUDED_OR_POSTED = ["POSTED", "TESTING", "WINNER", "FAILED", "ARCHIVED"];

function groupPerf(
  rows: CampaignPerf[],
  keyOf: (p: CampaignPerf) => string | null,
): BreakdownRow[] {
  const map = new Map<
    string,
    { key: string; count: number; views: number; clicks: number; orders: number; commission: number }
  >();
  for (const p of rows) {
    const key = keyOf(p);
    if (!key) continue;
    const g =
      map.get(key) ?? { key, count: 0, views: 0, clicks: 0, orders: 0, commission: 0 };
    g.count += 1;
    g.views += p.views;
    g.clicks += p.clicks;
    g.orders += p.orders;
    g.commission += p.commission;
    map.set(key, g);
  }
  return [...map.values()]
    .map((g) => ({
      key: g.key,
      name: label(g.key),
      count: g.count,
      views: g.views,
      orders: g.orders,
      commission: g.commission,
      cvr: g.clicks > 0 ? g.orders / g.clicks : 0,
    }))
    .sort((a, b) => b.commission - a.commission);
}

export default async function AnalyticsPage() {
  const campaigns = await db.campaign.findMany({
    where: {
      OR: [{ results: { some: {} } }, { status: { in: ["WINNER", "FAILED"] } }],
    },
    include: {
      product: { select: { id: true, name: true, category: true, status: true } },
      persona: { select: { name: true } },
      results: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const perf: CampaignPerf[] = campaigns.map((c) => {
    let views = 0;
    let engagement = 0;
    let clicks = 0;
    let orders = 0;
    let gmv = 0;
    let commission = 0;
    for (const r of c.results) {
      views += r.views;
      engagement += r.likes + r.comments + r.shares + r.saves;
      clicks += r.clicks;
      orders += r.orders;
      gmv += r.gmv;
      commission += r.commission;
    }
    return {
      id: c.id,
      title: c.title,
      platform: c.platform,
      videoStyle: c.videoStyle,
      hookUsed: c.hookUsed,
      status: c.status,
      posted: Boolean(c.postedDate) || CONCLUDED_OR_POSTED.includes(c.status),
      personaName: c.persona?.name ?? null,
      productId: c.product.id,
      productName: c.product.name,
      productCategory: c.product.category,
      productStatus: c.product.status,
      views,
      engagement,
      clicks,
      orders,
      gmv,
      commission,
      cvr: clicks > 0 ? orders / clicks : 0,
      engagementRate: views > 0 ? engagement / views : 0,
      ctr: views > 0 ? clicks / views : 0,
    };
  });

  // --- Top stats -----------------------------------------------------------
  const totals = perf.reduce(
    (t, p) => ({
      views: t.views + p.views,
      clicks: t.clicks + p.clicks,
      orders: t.orders + p.orders,
      gmv: t.gmv + p.gmv,
      commission: t.commission + p.commission,
    }),
    { views: 0, clicks: 0, orders: 0, gmv: 0, commission: 0 },
  );
  const overallCvr = totals.clicks > 0 ? totals.orders / totals.clicks : 0;
  const winnerCount = perf.filter((p) => p.status === "WINNER").length;

  // --- Best hooks ----------------------------------------------------------
  const hookRows: HookRow[] = perf
    .filter((p) => p.hookUsed && p.hookUsed.trim().length > 0)
    .sort((a, b) => b.orders - a.orders || b.cvr - a.cvr)
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      hook: p.hookUsed!.trim(),
      campaignTitle: p.title,
      productName: p.productName,
      orders: p.orders,
      cvr: p.cvr,
      views: p.views,
    }));

  // --- Breakdowns ----------------------------------------------------------
  const byStyle = groupPerf(perf, (p) => p.videoStyle);
  const byPlatform = groupPerf(perf, (p) => p.platform);
  const byPersona = groupPerf(perf, (p) => p.personaName);
  const byCategory = groupPerf(perf, (p) => p.productCategory);
  const bestPlatform = byPlatform[0] ?? null;

  // --- Double down / stop testing (per product) ----------------------------
  const productMap = new Map<
    string,
    {
      id: string;
      name: string;
      status: string;
      campaigns: number;
      postedCampaigns: number;
      views: number;
      clicks: number;
      orders: number;
      hasWinner: boolean;
      hasFailed: boolean;
      commission: number;
    }
  >();
  for (const p of perf) {
    const g =
      productMap.get(p.productId) ??
      {
        id: p.productId,
        name: p.productName,
        status: p.productStatus,
        campaigns: 0,
        postedCampaigns: 0,
        views: 0,
        clicks: 0,
        orders: 0,
        hasWinner: false,
        hasFailed: false,
        commission: 0,
      };
    g.campaigns += 1;
    if (p.posted) g.postedCampaigns += 1;
    g.views += p.views;
    g.clicks += p.clicks;
    g.orders += p.orders;
    g.commission += p.commission;
    g.hasWinner = g.hasWinner || p.status === "WINNER";
    g.hasFailed = g.hasFailed || p.status === "FAILED";
    productMap.set(p.productId, g);
  }
  const products = [...productMap.values()];

  const doubleDown: RecommendationItem[] = products
    .filter((g) => {
      const cvr = g.clicks > 0 ? g.orders / g.clicks : 0;
      return (g.orders >= 1 && cvr >= 0.02) || g.hasWinner;
    })
    .sort((a, b) => b.commission - a.commission)
    .map((g) => {
      const cvr = g.clicks > 0 ? g.orders / g.clicks : 0;
      return {
        productId: g.id,
        productName: g.name,
        reason:
          g.orders > 0
            ? `${g.orders} ${g.orders === 1 ? "order" : "orders"} at ${formatPercent(cvr * 100, 1)} CVR from ${g.campaigns} ${g.campaigns === 1 ? "video" : "videos"}`
            : `Marked winner from ${g.campaigns} ${g.campaigns === 1 ? "video" : "videos"}`,
        recommendation: g.hasWinner
          ? "Scale — brief 2-3 new hooks on the winning angle and re-post."
          : "Keep testing — CVR is above the 2% bar, add volume.",
        badgeStatus: g.hasWinner ? "WINNER" : g.status,
      };
    });
  const doubleDownIds = new Set(doubleDown.map((d) => d.productId));

  const stopTesting: RecommendationItem[] = products
    .filter((g) => {
      if (doubleDownIds.has(g.id) || g.postedCampaigns === 0) return false;
      const exposure = g.clicks + g.views / 100; // clicks-equivalent exposure
      const concluded = g.hasWinner || g.hasFailed;
      return (exposure >= 300 || concluded) && (g.orders === 0 || g.hasFailed);
    })
    .sort((a, b) => b.clicks - a.clicks)
    .map((g) => ({
      productId: g.id,
      productName: g.name,
      reason:
        g.orders === 0
          ? `0 orders after ${formatNumber(g.clicks)} clicks (${formatNumber(g.views)} views)`
          : `Only ${g.orders} ${g.orders === 1 ? "order" : "orders"} and a concluded failed test`,
      recommendation: "Pause — move budget and content slots to better performers.",
      badgeStatus: g.hasFailed ? "FAILED" : g.status,
    }));

  // --- Table rows ----------------------------------------------------------
  const tableRows: CampaignPerfRow[] = perf
    .map((p) => ({
      id: p.id,
      title: p.title,
      productName: p.productName,
      platform: p.platform,
      videoStyle: p.videoStyle,
      personaName: p.personaName,
      status: p.status,
      views: p.views,
      engagementRate: p.engagementRate,
      clicks: p.clicks,
      orders: p.orders,
      cvr: p.cvr,
      gmv: p.gmv,
      commission: p.commission,
    }))
    .sort((a, b) => b.commission - a.commission);

  const monitorLink = (
    <Button asChild variant="outline" size="sm">
      <Link href="/monitor">
        <MonitorPlay className="size-4" />
        Record results in Monitor
      </Link>
    </Button>
  );

  if (perf.length === 0) {
    return (
      <div>
        <PageHeader
          title="Winner Tracker"
          description="Learn which hooks, products, personas, and formats actually convert — then double down."
        />
        <EmptyState
          icon={Trophy}
          title="No performance data yet"
          description="Post campaigns and record their views, clicks, and orders in the Monitor. Once results come in, this page shows what converts."
          action={monitorLink}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Winner Tracker"
        description="Learn which hooks, products, personas, and formats actually convert — then double down."
      />

      {/* 1. Top stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total commission"
          value={formatCurrency(totals.commission)}
          hint={`across ${perf.length} tracked ${perf.length === 1 ? "campaign" : "campaigns"}`}
          icon={Coins}
        />
        <StatCard label="Total GMV" value={formatCurrency(totals.gmv)} icon={Banknote} />
        <StatCard
          label="Total orders"
          value={totals.orders.toLocaleString("en-US")}
          icon={ShoppingCart}
        />
        <StatCard
          label="Overall CVR"
          value={formatPercent(overallCvr * 100, 2)}
          hint={`${formatNumber(totals.orders)} orders / ${formatNumber(totals.clicks)} clicks`}
          icon={Target}
        />
        <StatCard
          label="Best platform"
          value={bestPlatform ? bestPlatform.name : "—"}
          hint={bestPlatform ? `${formatCurrency(bestPlatform.commission)} commission` : undefined}
          icon={Crown}
        />
        <StatCard
          label="Winning campaigns"
          value={winnerCount}
          hint={winnerCount === 0 ? "no winners declared yet" : "status: Winner"}
          icon={Trophy}
        />
      </div>

      {/* 2. Best hooks */}
      <Card className="gap-4 py-5">
        <CardHeader className="px-5">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Quote className="size-4 shrink-0 text-muted-foreground" />
            Best hooks
          </CardTitle>
          <CardDescription className="text-xs">
            Ranked by orders, then conversion rate. Copy a proven hook and re-use it on the next
            product.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5">
          {hookRows.length === 0 ? (
            <EmptyState
              icon={Quote}
              title="No hooks tracked yet"
              description="Save the hook you used on each campaign, then record results in the Monitor to see which openers convert."
              action={monitorLink}
            />
          ) : (
            <HookLeaderboard rows={hookRows} />
          )}
        </CardContent>
      </Card>

      {/* 3. Breakdowns */}
      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownCard
          title="By video style"
          description="Commission earned per format — bar length compares commission."
          icon={LayoutGrid}
          color="var(--chart-1)"
          rows={byStyle}
        />
        <BreakdownCard
          title="By platform"
          description="Where the orders actually come from."
          icon={Share2}
          color="var(--chart-2)"
          rows={byPlatform}
          nameAs="platform-badge"
        />
        <BreakdownCard
          title="By persona"
          description="Which AI presenter converts best."
          icon={Users}
          color="var(--chart-4)"
          rows={byPersona}
          emptyText="No campaigns with a persona have results yet."
        />
        <BreakdownCard
          title="By category"
          description="Product categories ranked by commission."
          icon={Tags}
          color="var(--chart-5)"
          rows={byCategory}
        />
      </div>

      {/* 4. Recommendations */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RecommendationCard
          title="Double down"
          description="≥1 order at ≥2% CVR, or a declared winner — worth more videos."
          icon={Rocket}
          tone="scale"
          items={doubleDown}
          emptyText="Nothing has cleared the bar yet — keep testing and record results."
        />
        <RecommendationCard
          title="Stop testing"
          description="Real exposure, no conversion — free up the content slots."
          icon={PauseCircle}
          tone="pause"
          items={stopTesting}
          emptyText="No products are burning budget without converting. Good sign."
        />
      </div>

      {/* 5. Full table */}
      <CampaignsTable rows={tableRows} />
    </div>
  );
}
