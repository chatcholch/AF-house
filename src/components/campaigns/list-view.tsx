"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PlatformBadge } from "@/components/shared/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CAMPAIGN_STATUSES, label } from "@/lib/types";
import { cn, formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { apiPatchCampaign, errorMessage, STATUS_DOT, type CampaignRow } from "./types";

export function ListView({
  campaigns,
  onOpenDetail,
}: {
  campaigns: CampaignRow[];
  onOpenDetail: (campaign: CampaignRow) => void;
}) {
  const router = useRouter();
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    const arr = [...campaigns];
    arr.sort((a, b) => {
      const av = a.scheduledDate ? new Date(a.scheduledDate).getTime() : null;
      const bv = b.scheduledDate ? new Date(b.scheduledDate).getTime() : null;
      if (av === null && bv === null) return 0;
      if (av === null) return 1; // undated last
      if (bv === null) return -1;
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return arr;
  }, [campaigns, sortDir]);

  async function changeStatus(campaign: CampaignRow, status: string) {
    try {
      await apiPatchCampaign(campaign.id, { status });
      toast.success(`Moved to ${label(status)}`);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update status"));
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-52">Title</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Style</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <button
                type="button"
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                Scheduled
                {sortDir === "asc" ? (
                  <ArrowUp className="size-3" />
                ) : (
                  <ArrowDown className="size-3" />
                )}
              </button>
            </TableHead>
            <TableHead>Posted</TableHead>
            <TableHead className="text-right">Views</TableHead>
            <TableHead className="text-right">Clicks</TableHead>
            <TableHead className="text-right">Orders</TableHead>
            <TableHead className="text-right">Commission</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((c) => {
            const latest = c.results[0];
            return (
              <TableRow key={c.id}>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => onOpenDetail(c)}
                    className="max-w-64 truncate text-left font-medium hover:underline"
                  >
                    {c.title}
                  </button>
                </TableCell>
                <TableCell className="max-w-44 truncate text-muted-foreground">
                  {c.product.name}
                </TableCell>
                <TableCell>
                  <PlatformBadge platform={c.platform} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {c.videoStyle ? label(c.videoStyle) : "—"}
                </TableCell>
                <TableCell>
                  <Select value={c.status} onValueChange={(v) => changeStatus(c, v)}>
                    <SelectTrigger size="sm" className="h-7 w-40 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMPAIGN_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          <span className={cn("size-2 rounded-full", STATUS_DOT[s])} />
                          {label(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground tabular-nums">
                  {c.scheduledDate ? formatDate(c.scheduledDate) : "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground tabular-nums">
                  {c.postedDate ? formatDate(c.postedDate) : "—"}
                </TableCell>
                <TableCell className="text-right text-xs tabular-nums">
                  {latest ? formatNumber(latest.views) : "—"}
                </TableCell>
                <TableCell className="text-right text-xs tabular-nums">
                  {latest ? formatNumber(latest.clicks) : "—"}
                </TableCell>
                <TableCell className="text-right text-xs tabular-nums">
                  {latest ? formatNumber(latest.orders) : "—"}
                </TableCell>
                <TableCell className="text-right text-xs tabular-nums">
                  {latest ? formatCurrency(latest.commission) : "—"}
                </TableCell>
                <TableCell>
                  {c.notes ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block max-w-40 truncate text-xs text-muted-foreground">
                          {c.notes}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-72 whitespace-pre-wrap">
                        {c.notes}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
