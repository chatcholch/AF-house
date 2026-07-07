"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ExternalLink,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScoreBadge } from "@/components/shared/score-badge";
import { PlatformBadge, StatusBadge } from "@/components/shared/status-badge";
import { label, PRODUCT_STATUSES } from "@/lib/types";
import { cn, formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import type { RadarProduct } from "./radar-client";

export type SortKey = "opportunity" | "price" | "commission" | "trend" | "updated";
export type SortDir = "asc" | "desc";

function SortableHead({
  title,
  sortKey,
  activeKey,
  dir,
  onSort,
  className,
}: {
  title: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
          active && "text-foreground"
        )}
      >
        {title}
        {active ? (
          dir === "desc" ? (
            <ArrowDown className="size-3" />
          ) : (
            <ArrowUp className="size-3" />
          )
        ) : (
          <ArrowUpDown className="size-3 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}

function StatusCell({ product }: { product: RadarProduct }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function updateStatus(status: string) {
    if (status === product.status) return;
    setPending(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to update status");
      }
      toast.success(`${product.name} moved to ${label(status)}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setPending(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={pending}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          aria-label={`Change status of ${product.name}`}
        >
          <StatusBadge status={product.status} />
          <ChevronDown className="size-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        {PRODUCT_STATUSES.map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={(e) => {
              e.stopPropagation();
              void updateStatus(s);
            }}
            className={cn(s === product.status && "bg-accent/60")}
          >
            {label(s)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProductTable({
  products,
  sortKey,
  sortDir,
  onSort,
}: {
  products: RadarProduct[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const router = useRouter();

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="min-w-[220px]">Product</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Category</TableHead>
            <SortableHead
              title="Price"
              sortKey="price"
              activeKey={sortKey}
              dir={sortDir}
              onSort={onSort}
              className="text-right"
            />
            <SortableHead
              title="Commission"
              sortKey="commission"
              activeKey={sortKey}
              dir={sortDir}
              onSort={onSort}
              className="text-right"
            />
            <TableHead className="text-right">Demand</TableHead>
            <SortableHead
              title="Trend"
              sortKey="trend"
              activeKey={sortKey}
              dir={sortDir}
              onSort={onSort}
              className="text-right"
            />
            <TableHead className="text-right">Comp.</TableHead>
            <TableHead className="text-right">Diff.</TableHead>
            <TableHead className="text-right">Trust</TableHead>
            <SortableHead
              title="Opportunity"
              sortKey="opportunity"
              activeKey={sortKey}
              dir={sortDir}
              onSort={onSort}
            />
            <TableHead>Signals</TableHead>
            <TableHead>Status</TableHead>
            <SortableHead
              title="Updated"
              sortKey="updated"
              activeKey={sortKey}
              dir={sortDir}
              onSort={onSort}
            />
            <TableHead aria-label="Link" />
            <TableHead aria-label="Notes" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => {
            const payout = (p.price * p.commissionRate) / 100;
            const signalTypes = Array.from(
              new Set(p.trendSignals.map((s) => s.signalType))
            );
            const shownSignals = signalTypes.slice(0, 2);
            const firstLink = p.affiliateLinks[0];
            return (
              <TableRow
                key={p.id}
                onClick={() => router.push(`/radar/${p.id}`)}
                className="cursor-pointer"
              >
                <TableCell>
                  <div className="max-w-[280px]">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.brand ?? "No brand"}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <PlatformBadge platform={p.platform} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {p.category}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right tabular-nums">
                  {formatCurrency(p.price)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right">
                  <span className="tabular-nums">{formatPercent(p.commissionRate)}</span>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    ≈{formatCurrency(payout)}/sale
                  </p>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                  {p.demandScore}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                  {p.trendScore}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                  {p.competitionScore}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                  {p.contentDifficultyScore}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                  {p.trustScore}
                </TableCell>
                <TableCell>
                  <ScoreBadge score={p.opportunityScore} />
                </TableCell>
                <TableCell>
                  <div className="flex max-w-[180px] flex-wrap items-center gap-1">
                    {shownSignals.length === 0 && (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                    {shownSignals.map((s) => (
                      <Badge
                        key={s}
                        variant="outline"
                        className="px-1.5 py-0 text-[10px] text-muted-foreground"
                      >
                        {label(s)}
                      </Badge>
                    ))}
                    {signalTypes.length > 2 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{signalTypes.length - 2}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <StatusCell product={p} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatDate(p.updatedAt)}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()} className="w-8">
                  {firstLink ? (
                    <a
                      href={firstLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={`Open affiliate link for ${p.name}`}
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground/40">—</span>
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()} className="w-8">
                  {p.notes ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex cursor-default text-muted-foreground">
                          <StickyNote className="size-4" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        {p.notes}
                      </TooltipContent>
                    </Tooltip>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
