import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlatformBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

export interface BreakdownRow {
  key: string; // raw value (e.g. "TIKTOK", "UGC_REVIEW", persona/category name)
  name: string; // display label
  count: number; // campaigns in this group
  views: number;
  orders: number;
  commission: number;
  cvr: number; // 0-1, pooled orders/clicks
}

/**
 * Single-hue horizontal bar breakdown (bar length = commission vs group max).
 * Values are always printed as text next to the bar, so the color is never the
 * only carrier of the number. Server component.
 */
export function BreakdownCard({
  title,
  description,
  icon: Icon,
  color,
  rows,
  nameAs = "text",
  emptyText = "No performance data for this breakdown yet.",
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** CSS color for the bars, e.g. "var(--chart-1)" — theme-aware token. */
  color: string;
  rows: BreakdownRow[];
  nameAs?: "text" | "platform-badge";
  emptyText?: string;
}) {
  const max = Math.max(0, ...rows.map((r) => r.commission));
  return (
    <Card className="gap-4 py-5">
      <CardHeader className="px-5">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
          <span className="truncate">{title}</span>
        </CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="px-5">
        {rows.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => {
              const pct = max > 0 ? (row.commission / max) * 100 : 0;
              return (
                <div key={row.key}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      {nameAs === "platform-badge" ? (
                        <PlatformBadge platform={row.key} />
                      ) : (
                        <span className="truncate text-sm font-medium">{row.name}</span>
                      )}
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {row.count} {row.count === 1 ? "video" : "videos"}
                      </span>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatCurrency(row.commission)}
                    </span>
                  </div>
                  <div
                    aria-hidden="true"
                    className="mt-1.5 h-2 overflow-hidden rounded-[4px]"
                    style={{
                      backgroundColor: `color-mix(in oklab, ${color} 15%, transparent)`,
                    }}
                  >
                    <div
                      className="h-full rounded-r-[4px]"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                    <span>
                      {formatNumber(row.views)} views · {row.orders}{" "}
                      {row.orders === 1 ? "order" : "orders"}
                    </span>
                    <span>{formatPercent(row.cvr * 100, 1)} CVR</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
