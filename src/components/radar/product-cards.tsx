"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreBadge } from "@/components/shared/score-badge";
import { PlatformBadge, StatusBadge } from "@/components/shared/status-badge";
import { label } from "@/lib/types";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import type { RadarProduct } from "./radar-client";

export function ProductCards({ products }: { products: RadarProduct[] }) {
  const router = useRouter();

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => {
        const payout = (p.price * p.commissionRate) / 100;
        const signalTypes = Array.from(
          new Set(p.trendSignals.map((s) => s.signalType))
        ).slice(0, 2);
        return (
          <Card
            key={p.id}
            role="link"
            tabIndex={0}
            onClick={() => router.push(`/radar/${p.id}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter") router.push(`/radar/${p.id}`);
            }}
            className="cursor-pointer gap-0 py-0 transition-colors hover:border-primary/50"
          >
            <CardContent className="flex h-full flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium" title={p.name}>
                    {p.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.brand ?? "No brand"}
                  </p>
                </div>
                <ScoreBadge score={p.opportunityScore} className="px-2.5 py-1 text-sm" />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <PlatformBadge platform={p.platform} />
                <Badge variant="outline" className="text-muted-foreground">
                  {p.category}
                </Badge>
                {signalTypes.map((s) => (
                  <Badge
                    key={s}
                    variant="outline"
                    className="px-1.5 py-0 text-[10px] text-muted-foreground"
                  >
                    {label(s)}
                  </Badge>
                ))}
              </div>

              <div className="mt-auto space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="tabular-nums">{formatCurrency(p.price)}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatPercent(p.commissionRate)} ≈ {formatCurrency(payout)}/sale
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <StatusBadge status={p.status} />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(p.updatedAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
