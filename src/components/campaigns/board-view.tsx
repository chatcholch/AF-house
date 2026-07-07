"use client";

import { useMemo } from "react";
import { CAMPAIGN_STATUSES, label } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CampaignCard } from "./campaign-card";
import { STATUS_DOT, type CampaignRow } from "./types";

function sortKey(c: CampaignRow): number {
  const d = c.scheduledDate ?? c.postedDate;
  return d ? new Date(d).getTime() : Number.MAX_SAFE_INTEGER;
}

export function BoardView({
  campaigns,
  onOpenDetail,
  onEdit,
}: {
  campaigns: CampaignRow[];
  onOpenDetail: (campaign: CampaignRow) => void;
  onEdit: (campaign: CampaignRow) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, CampaignRow[]>();
    for (const status of CAMPAIGN_STATUSES) map.set(status, []);
    for (const c of campaigns) map.get(c.status)?.push(c);
    for (const items of map.values()) items.sort((a, b) => sortKey(a) - sortKey(b));
    return map;
  }, [campaigns]);

  return (
    <div className="flex items-start gap-3 overflow-x-auto pb-4">
      {CAMPAIGN_STATUSES.map((status) => {
        const items = grouped.get(status) ?? [];
        return (
          <div
            key={status}
            className="flex w-72 shrink-0 flex-col rounded-xl border bg-muted/30 p-2"
          >
            <div className="mb-2 flex items-center gap-2 px-1.5 pt-1">
              <span className={cn("size-2 shrink-0 rounded-full", STATUS_DOT[status])} />
              <span className="truncate text-sm font-medium">{label(status)}</span>
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
                {items.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/70 px-3 py-8 text-center text-xs text-muted-foreground/60">
                  No campaigns
                </div>
              ) : (
                items.map((c) => (
                  <CampaignCard
                    key={c.id}
                    campaign={c}
                    onOpenDetail={onOpenDetail}
                    onEdit={onEdit}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
