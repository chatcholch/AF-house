import {
  CalendarClock,
  ClipboardCheck,
  Coins,
  Gauge,
  MousePointerClick,
  Package,
  Percent,
  Rocket,
  TrendingUp,
} from "lucide-react";
import { db } from "@/lib/db";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ApprovalQueue } from "@/components/dashboard/approval-queue";
import { BestOpportunities } from "@/components/dashboard/best-opportunities";
import { CampaignCalendar } from "@/components/dashboard/campaign-calendar";
import { GenerationQueue } from "@/components/dashboard/generation-queue";
import { OpportunityListCard } from "@/components/dashboard/opportunity-list";
import { PerformanceNotes } from "@/components/dashboard/performance-notes";

export const dynamic = "force-dynamic";

const DAY_MS = 86_400_000;

function launchMetric(launchDate: Date | null): string {
  if (!launchDate) return "Launch date unknown";
  const days = Math.round(
    (new Date().setHours(0, 0, 0, 0) - new Date(launchDate).setHours(0, 0, 0, 0)) / DAY_MS
  );
  if (days < 0) return `Launches in ${-days}d`;
  if (days === 0) return "Launched today";
  if (days === 1) return "Launched yesterday";
  return `Launched ${days}d ago`;
}

export default async function DashboardPage() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const in7Days = new Date(startOfToday.getTime() + 7 * DAY_MS);
  const in14Days = new Date(startOfToday.getTime() + 14 * DAY_MS);

  const [
    productCount,
    avgOpportunity,
    ideasNeedingReview,
    campaignsNeedingReview,
    scheduledNext7,
    resultTotals,
    bestProducts,
    risingProducts,
    newLaunchProducts,
    highCommissionProducts,
    reviewIdeas,
    reviewCampaigns,
    calendarCampaigns,
    recentNoteResults,
    latestIdeas,
  ] = await Promise.all([
    db.product.count(),
    db.product.aggregate({ _avg: { opportunityScore: true } }),
    db.contentIdea.count({ where: { status: "NEEDS_REVIEW" } }),
    db.campaign.count({ where: { status: "NEEDS_REVIEW" } }),
    db.campaign.count({ where: { scheduledDate: { gte: startOfToday, lt: in7Days } } }),
    db.campaignResult.aggregate({ _sum: { commission: true, clicks: true } }),
    db.product.findMany({
      where: { status: { not: "REJECTED" } },
      orderBy: { opportunityScore: "desc" },
      take: 5,
    }),
    db.product.findMany({
      where: { isRising: true },
      orderBy: { trendScore: "desc" },
      take: 5,
    }),
    db.product.findMany({
      where: { isNewLaunch: true },
      orderBy: { launchDate: { sort: "desc", nulls: "last" } },
      take: 5,
    }),
    db.product.findMany({ orderBy: { commissionRate: "desc" }, take: 5 }),
    db.contentIdea.findMany({
      where: { status: "NEEDS_REVIEW" },
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.campaign.findMany({
      where: { status: "NEEDS_REVIEW" },
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.campaign.findMany({
      where: { scheduledDate: { gte: startOfToday, lt: in14Days } },
      orderBy: { scheduledDate: "asc" },
    }),
    db.campaignResult.findMany({
      where: { OR: [{ notes: { not: null } }, { campaign: { notes: { not: null } } }] },
      include: { campaign: { select: { title: true, notes: true } } },
      orderBy: { recordedAt: "desc" },
      take: 5,
    }),
    db.contentIdea.findMany({
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const draftsAwaitingReview = ideasNeedingReview + campaignsNeedingReview;
  const commissionEarned = resultTotals._sum.commission ?? 0;
  const totalClicks = resultTotals._sum.clicks ?? 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your daily control room — spot opportunities early, approve drafts, ship content."
      />

      <div className="space-y-6">
        {/* Stat row */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Products tracked" value={productCount} hint="on your radar" icon={Package} />
          <StatCard
            label="Avg opportunity score"
            value={Math.round(avgOpportunity._avg.opportunityScore ?? 0)}
            hint="across all products"
            icon={Gauge}
          />
          <StatCard
            label="Drafts awaiting review"
            value={draftsAwaitingReview}
            hint={`${ideasNeedingReview} ideas · ${campaignsNeedingReview} campaigns`}
            icon={ClipboardCheck}
          />
          <StatCard
            label="Scheduled next 7 days"
            value={scheduledNext7}
            hint="campaigns with a date"
            icon={CalendarClock}
          />
          <StatCard
            label="Commission earned"
            value={formatCurrency(commissionEarned)}
            hint="all recorded results"
            icon={Coins}
          />
          <StatCard
            label="Total clicks"
            value={formatNumber(totalClicks)}
            hint="across all campaigns"
            icon={MousePointerClick}
          />
        </div>

        {/* Today's best opportunities */}
        <BestOpportunities products={bestProducts} />

        {/* Opportunity lists */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <OpportunityListCard
            title="Rising products"
            icon={TrendingUp}
            hint="Trend momentum picking up"
            rows={risingProducts.map((p) => ({
              id: p.id,
              name: p.name,
              score: p.opportunityScore,
              metric: `Trend score ${p.trendScore} · ${formatPercent(p.commissionRate)} commission`,
            }))}
            emptyTitle="No rising products"
            emptyDescription="Mark products as rising in Product Radar when you spot trend momentum."
          />
          <OpportunityListCard
            title="New brand drops & launches"
            icon={Rocket}
            hint="Be first to make content"
            rows={newLaunchProducts.map((p) => ({
              id: p.id,
              name: p.name,
              score: p.opportunityScore,
              metric: launchMetric(p.launchDate),
            }))}
            emptyTitle="No new launches tracked"
            emptyDescription="Flag products as new launches in Product Radar to catch drops early."
          />
          <OpportunityListCard
            title="High commission"
            icon={Percent}
            hint="Best payout per conversion"
            rows={highCommissionProducts.map((p) => ({
              id: p.id,
              name: p.name,
              score: p.opportunityScore,
              metric: `${formatPercent(p.commissionRate)} commission · ${formatCurrency(p.price)}`,
            }))}
            emptyTitle="No products yet"
            emptyDescription="Add products in Product Radar to compare commission rates."
          />
        </div>

        {/* Approval + calendar */}
        <div className="grid gap-4 xl:grid-cols-2">
          <ApprovalQueue
            ideas={reviewIdeas.map((idea) => ({
              id: idea.id,
              title: idea.title,
              productName: idea.product.name,
              style: idea.style,
              language: idea.language,
              createdAt: idea.createdAt,
            }))}
            campaigns={reviewCampaigns.map((campaign) => ({
              id: campaign.id,
              title: campaign.title,
              productName: campaign.product.name,
              platform: campaign.platform,
              createdAt: campaign.createdAt,
            }))}
            totalIdeas={ideasNeedingReview}
            totalCampaigns={campaignsNeedingReview}
          />
          <CampaignCalendar
            campaigns={calendarCampaigns.flatMap((campaign) =>
              campaign.scheduledDate
                ? [
                    {
                      id: campaign.id,
                      title: campaign.title,
                      platform: campaign.platform,
                      status: campaign.status,
                      scheduledDate: campaign.scheduledDate,
                    },
                  ]
                : []
            )}
          />
        </div>

        {/* Notes + AI queue */}
        <div className="grid gap-4 xl:grid-cols-2">
          <PerformanceNotes
            notes={recentNoteResults.flatMap((result) => {
              const note = result.notes ?? result.campaign.notes;
              return note
                ? [
                    {
                      id: result.id,
                      campaignTitle: result.campaign.title,
                      recordedAt: result.recordedAt,
                      views: result.views,
                      clicks: result.clicks,
                      orders: result.orders,
                      note,
                    },
                  ]
                : [];
            })}
          />
          <GenerationQueue
            ideas={latestIdeas.map((idea) => ({
              id: idea.id,
              title: idea.title,
              productName: idea.product.name,
              status: idea.status,
              generatedBy: idea.generatedBy,
              createdAt: idea.createdAt,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
