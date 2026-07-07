"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  Coins,
  Eye,
  Heart,
  MonitorPlay,
  MousePointerClick,
  Percent,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { CampaignsTable } from "./campaigns-table";
import { ResultDialog } from "./result-dialog";
import { RecentNotesCard } from "./recent-notes-card";
import { PlatformBreakdown } from "./platform-breakdown";
import type { CampaignRow, MonitorTotals, ResultRow } from "./monitor-types";

const PLATFORM_TABS = [
  { value: "ALL", label: "All" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "SHOPEE_VIDEO", label: "Shopee Video" },
  { value: "FACEBOOK", label: "Facebook" },
] as const;

type PlatformFilter = (typeof PLATFORM_TABS)[number]["value"];

export function MonitorView({
  campaigns,
  totals,
}: {
  campaigns: CampaignRow[];
  totals: MonitorTotals;
}) {
  const [platform, setPlatform] = useState<PlatformFilter>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogCampaignId, setDialogCampaignId] = useState<string | undefined>(
    undefined
  );
  const [editingResult, setEditingResult] = useState<ResultRow | null>(null);

  const openCreateDialog = (campaignId?: string) => {
    setEditingResult(null);
    setDialogCampaignId(campaignId);
    setDialogOpen(true);
  };

  const openEditDialog = (result: ResultRow) => {
    setEditingResult(result);
    setDialogCampaignId(result.campaignId);
    setDialogOpen(true);
  };

  const filtered = useMemo(
    () =>
      platform === "ALL"
        ? campaigns
        : campaigns.filter((c) => c.platform === platform),
    [campaigns, platform]
  );

  const summary = useMemo(() => {
    const s = {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      clicks: 0,
      orders: 0,
      gmv: 0,
      commission: 0,
      resultCount: 0,
    };
    for (const campaign of filtered) {
      for (const r of campaign.results) {
        s.views += r.views;
        s.likes += r.likes;
        s.comments += r.comments;
        s.shares += r.shares;
        s.saves += r.saves;
        s.clicks += r.clicks;
        s.orders += r.orders;
        s.gmv += r.gmv;
        s.commission += r.commission;
        s.resultCount += 1;
      }
    }
    return s;
  }, [filtered]);

  const conversionRate =
    summary.clicks > 0 ? (summary.orders / summary.clicks) * 100 : null;
  const engagementRate =
    summary.views > 0
      ? ((summary.likes + summary.comments + summary.shares + summary.saves) /
          summary.views) *
        100
      : null;

  const recentNotes = useMemo(
    () =>
      filtered
        .flatMap((c) =>
          c.results
            .filter((r) => r.notes && r.notes.trim().length > 0)
            .map((r) => ({
              id: r.id,
              campaignTitle: c.title,
              recordedAt: r.recordedAt,
              note: r.notes as string,
            }))
        )
        .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
        .slice(0, 6),
    [filtered]
  );

  const description =
    "Track results, sales, and clicks for every posted video — manually or via API later.";

  if (campaigns.length === 0) {
    return (
      <div>
        <PageHeader title="Monitor" description={description} />
        <EmptyState
          icon={MonitorPlay}
          title="No live campaigns to monitor"
          description="Post your first campaign from the Campaign Board, then log results here."
          action={
            <Button asChild>
              <Link href="/campaigns">Open Campaign Board</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const isFiltered = platform !== "ALL";
  const platformLabel = PLATFORM_TABS.find((t) => t.value === platform)?.label;

  return (
    <div>
      <PageHeader
        title="Monitor"
        description={description}
        actions={
          <Button onClick={() => openCreateDialog()}>
            <Plus className="size-4" />
            Log result
          </Button>
        }
      />

      <Tabs
        value={platform}
        onValueChange={(v) => setPlatform(v as PlatformFilter)}
        className="mb-4"
      >
        <TabsList>
          {PLATFORM_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7">
        <StatCard
          label="Views"
          value={formatNumber(summary.views)}
          hint={
            isFiltered
              ? `All platforms: ${formatNumber(totals.views)}`
              : `${totals.resultCount} snapshots logged`
          }
          icon={Eye}
        />
        <StatCard
          label="Clicks"
          value={formatNumber(summary.clicks)}
          hint={
            isFiltered
              ? `All platforms: ${formatNumber(totals.clicks)}`
              : "Affiliate link clicks"
          }
          icon={MousePointerClick}
        />
        <StatCard
          label="Orders"
          value={formatNumber(summary.orders)}
          hint={
            isFiltered
              ? `All platforms: ${formatNumber(totals.orders)}`
              : "Attributed orders"
          }
          icon={ShoppingCart}
        />
        <StatCard
          label="GMV"
          value={formatCurrency(summary.gmv)}
          hint={
            isFiltered
              ? `All platforms: ${formatCurrency(totals.gmv)}`
              : "Gross merchandise value"
          }
          icon={Banknote}
        />
        <StatCard
          label="Commission"
          value={formatCurrency(summary.commission)}
          hint={
            isFiltered
              ? `All platforms: ${formatCurrency(totals.commission)}`
              : "Your estimated earnings"
          }
          icon={Coins}
        />
        <StatCard
          label="Conversion rate"
          value={conversionRate === null ? "—" : formatPercent(conversionRate)}
          hint="Orders ÷ clicks"
          icon={Percent}
        />
        <StatCard
          label="Engagement rate"
          value={engagementRate === null ? "—" : formatPercent(engagementRate)}
          hint="Reactions ÷ views"
          icon={Heart}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={MonitorPlay}
              title={`No live ${platformLabel} campaigns`}
              description="Post a campaign on this platform from the Campaign Board, then log results here."
              action={
                <Button asChild variant="outline">
                  <Link href="/campaigns">Open Campaign Board</Link>
                </Button>
              }
            />
          ) : (
            <CampaignsTable
              campaigns={filtered}
              onAddResult={(campaignId) => openCreateDialog(campaignId)}
              onEditResult={openEditDialog}
            />
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <PlatformBreakdown campaigns={filtered} />
          <RecentNotesCard notes={recentNotes} />
        </div>
      </div>

      <ResultDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        campaigns={campaigns.map((c) => ({
          id: c.id,
          title: c.title,
          platform: c.platform,
        }))}
        fixedCampaignId={dialogCampaignId}
        editing={editingResult}
      />
    </div>
  );
}
