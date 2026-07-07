"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Pencil,
  Plus,
  StickyNote,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PlatformBadge, StatusBadge } from "@/components/shared/status-badge";
import { cn, formatCurrency, formatDate, formatNumber, formatPercent } from "@/lib/utils";
import type { CampaignRow, ResultRow } from "./monitor-types";

const MAIN_COL_COUNT = 13;

function TrendHint({ current, previous }: { current: number; previous: number }) {
  const delta = current - previous;
  if (delta === 0) return null;
  const up = delta > 0;
  return (
    <span
      className={cn(
        "ml-1 inline-flex items-center gap-px align-middle text-[10px] font-medium tabular-nums",
        up
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400"
      )}
    >
      {up ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {formatNumber(Math.abs(delta))}
    </span>
  );
}

function cvr(result: ResultRow | undefined): string {
  if (!result || result.clicks <= 0) return "—";
  return formatPercent((result.orders / result.clicks) * 100);
}

export function CampaignsTable({
  campaigns,
  onAddResult,
  onEditResult,
}: {
  campaigns: CampaignRow[];
  onAddResult: (campaignId: string) => void;
  onEditResult: (result: ResultRow) => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this result snapshot? This cannot be undone.")) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/results/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Request failed");
      toast.success("Result deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete result");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live campaigns</CardTitle>
        <CardDescription>
          Latest snapshot per campaign — expand a row for its full results
          history.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead className="min-w-[220px]">Campaign</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Likes</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">GMV</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">CVR</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => {
                const latest = campaign.results[0];
                const previous = campaign.results[1];
                const isOpen = expanded.has(campaign.id);

                return (
                  <Fragment key={campaign.id}>
                    <TableRow>
                      <TableCell className="pr-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() => toggle(campaign.id)}
                          aria-label={
                            isOpen ? "Collapse history" : "Expand history"
                          }
                          aria-expanded={isOpen}
                        >
                          <ChevronRight
                            className={cn(
                              "size-4 transition-transform",
                              isOpen && "rotate-90"
                            )}
                          />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {campaign.title}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {campaign.productName}
                            {campaign.personaName
                              ? ` · ${campaign.personaName}`
                              : ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <PlatformBadge platform={campaign.platform} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={campaign.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {campaign.postedDate
                          ? formatDate(campaign.postedDate)
                          : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums">
                        {latest ? formatNumber(latest.views) : "—"}
                        {latest && previous && (
                          <TrendHint
                            current={latest.views}
                            previous={previous.views}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {latest ? formatNumber(latest.likes) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {latest ? formatNumber(latest.clicks) : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums">
                        {latest ? formatNumber(latest.orders) : "—"}
                        {latest && previous && (
                          <TrendHint
                            current={latest.orders}
                            previous={previous.orders}
                          />
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums">
                        {latest ? formatCurrency(latest.gmv) : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums">
                        {latest ? formatCurrency(latest.commission) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {cvr(latest)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {latest?.notes && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                                  aria-label="Latest note"
                                >
                                  <StickyNote className="size-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-72">
                                {latest.notes}
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 whitespace-nowrap px-2 text-xs"
                            onClick={() => onAddResult(campaign.id)}
                          >
                            <Plus className="size-3.5" />
                            Add result
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {isOpen && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={MAIN_COL_COUNT}
                          className="bg-muted/30 p-0"
                        >
                          {campaign.results.length === 0 ? (
                            <p className="px-10 py-4 text-sm text-muted-foreground">
                              No results logged yet for this campaign. Use
                              &ldquo;Add result&rdquo; to record the first
                              snapshot.
                            </p>
                          ) : (
                            <div className="overflow-x-auto px-4 py-3">
                              <Table>
                                <TableHeader>
                                  <TableRow className="hover:bg-transparent">
                                    <TableHead className="h-8 text-xs">
                                      Period
                                    </TableHead>
                                    <TableHead className="h-8 text-xs">
                                      Recorded
                                    </TableHead>
                                    <TableHead className="h-8 text-right text-xs">
                                      Views
                                    </TableHead>
                                    <TableHead className="h-8 text-right text-xs">
                                      Likes
                                    </TableHead>
                                    <TableHead className="h-8 text-right text-xs">
                                      Comments
                                    </TableHead>
                                    <TableHead className="h-8 text-right text-xs">
                                      Shares
                                    </TableHead>
                                    <TableHead className="h-8 text-right text-xs">
                                      Saves
                                    </TableHead>
                                    <TableHead className="h-8 text-right text-xs">
                                      Clicks
                                    </TableHead>
                                    <TableHead className="h-8 text-right text-xs">
                                      Orders
                                    </TableHead>
                                    <TableHead className="h-8 text-right text-xs">
                                      GMV
                                    </TableHead>
                                    <TableHead className="h-8 text-right text-xs">
                                      Commission
                                    </TableHead>
                                    <TableHead className="h-8 text-xs">
                                      Notes
                                    </TableHead>
                                    <TableHead className="h-8 text-right text-xs">
                                      Actions
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {campaign.results.map((r) => (
                                    <TableRow key={r.id}>
                                      <TableCell className="whitespace-nowrap text-xs">
                                        {r.periodLabel ?? "—"}
                                      </TableCell>
                                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                        {formatDate(r.recordedAt)}
                                      </TableCell>
                                      <TableCell className="text-right text-xs tabular-nums">
                                        {formatNumber(r.views)}
                                      </TableCell>
                                      <TableCell className="text-right text-xs tabular-nums">
                                        {formatNumber(r.likes)}
                                      </TableCell>
                                      <TableCell className="text-right text-xs tabular-nums">
                                        {formatNumber(r.comments)}
                                      </TableCell>
                                      <TableCell className="text-right text-xs tabular-nums">
                                        {formatNumber(r.shares)}
                                      </TableCell>
                                      <TableCell className="text-right text-xs tabular-nums">
                                        {formatNumber(r.saves)}
                                      </TableCell>
                                      <TableCell className="text-right text-xs tabular-nums">
                                        {formatNumber(r.clicks)}
                                      </TableCell>
                                      <TableCell className="text-right text-xs tabular-nums">
                                        {formatNumber(r.orders)}
                                      </TableCell>
                                      <TableCell className="whitespace-nowrap text-right text-xs tabular-nums">
                                        {formatCurrency(r.gmv)}
                                      </TableCell>
                                      <TableCell className="whitespace-nowrap text-right text-xs tabular-nums">
                                        {formatCurrency(r.commission)}
                                      </TableCell>
                                      <TableCell className="max-w-[180px] text-xs text-muted-foreground">
                                        {r.notes ? (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <span className="block cursor-default truncate">
                                                {r.notes}
                                              </span>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-72">
                                              {r.notes}
                                            </TooltipContent>
                                          </Tooltip>
                                        ) : (
                                          "—"
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-0.5">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-6"
                                            onClick={() => onEditResult(r)}
                                            aria-label="Edit result"
                                          >
                                            <Pencil className="size-3.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-6 text-muted-foreground hover:text-red-500"
                                            disabled={deletingId === r.id}
                                            onClick={() => handleDelete(r.id)}
                                            aria-label="Delete result"
                                          >
                                            <Trash2 className="size-3.5" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
