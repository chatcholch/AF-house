"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlatformBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { CampaignRow } from "./monitor-types";

const PLATFORM_ORDER = ["TIKTOK", "SHOPEE_VIDEO", "FACEBOOK", "MULTI"];

interface PlatformGroup {
  platform: string;
  clicks: number;
  orders: number;
  commission: number;
  bestCampaign: string | null;
}

function groupByPlatform(campaigns: CampaignRow[]): PlatformGroup[] {
  const groups = new Map<
    string,
    PlatformGroup & { bestCommission: number }
  >();

  for (const campaign of campaigns) {
    let clicks = 0;
    let orders = 0;
    let commission = 0;
    for (const r of campaign.results) {
      clicks += r.clicks;
      orders += r.orders;
      commission += r.commission;
    }

    const g = groups.get(campaign.platform) ?? {
      platform: campaign.platform,
      clicks: 0,
      orders: 0,
      commission: 0,
      bestCampaign: null,
      bestCommission: -1,
    };
    g.clicks += clicks;
    g.orders += orders;
    g.commission += commission;
    if (commission > g.bestCommission) {
      g.bestCommission = commission;
      g.bestCampaign = campaign.title;
    }
    groups.set(campaign.platform, g);
  }

  return [...groups.values()].sort(
    (a, b) =>
      PLATFORM_ORDER.indexOf(a.platform) - PLATFORM_ORDER.indexOf(b.platform)
  );
}

export function PlatformBreakdown({ campaigns }: { campaigns: CampaignRow[] }) {
  const groups = groupByPlatform(campaigns);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform breakdown</CardTitle>
        <CardDescription>
          Clicks, orders, and commission per platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No campaign data for this filter yet.
          </p>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => (
              <div key={g.platform} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <PlatformBadge platform={g.platform} />
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(g.commission)}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>
                    Clicks{" "}
                    <span className="font-medium tabular-nums text-foreground">
                      {formatNumber(g.clicks)}
                    </span>
                  </span>
                  <span>
                    Orders{" "}
                    <span className="font-medium tabular-nums text-foreground">
                      {formatNumber(g.orders)}
                    </span>
                  </span>
                </div>
                <p className="mt-2 truncate text-xs text-muted-foreground">
                  Best:{" "}
                  <span className="text-foreground">
                    {g.bestCampaign ?? "—"}
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
