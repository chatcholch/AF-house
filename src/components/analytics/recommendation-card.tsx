import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";

export interface RecommendationItem {
  productId: string;
  productName: string;
  /** e.g. "147 orders at 2.8% CVR from 2 videos" */
  reason: string;
  /** e.g. "Scale — brief new hooks on the winning angle." */
  recommendation: string;
  /** Product or campaign status for the StatusBadge. */
  badgeStatus: string;
}

/** "Double down" / "Stop testing" product list with an accent left border. Server component. */
export function RecommendationCard({
  title,
  description,
  icon: Icon,
  tone,
  items,
  emptyText,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  tone: "scale" | "pause";
  items: RecommendationItem[];
  emptyText: string;
}) {
  const scale = tone === "scale";
  return (
    <Card
      className={cn(
        "gap-4 border-l-4 py-5",
        scale ? "border-l-emerald-500/70" : "border-l-red-500/70",
      )}
    >
      <CardHeader className="px-5">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          {Icon && (
            <Icon
              className={cn(
                "size-4 shrink-0",
                scale ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
              )}
            />
          )}
          <span className="truncate">{title}</span>
        </CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="px-5">
        {items.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <div className="divide-y">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <Link
                    href={`/radar/${item.productId}`}
                    className="text-sm font-medium underline-offset-4 hover:underline"
                  >
                    {item.productName}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{item.reason}</p>
                  <p
                    className={cn(
                      "mt-0.5 text-xs font-medium",
                      scale
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400",
                    )}
                  >
                    {item.recommendation}
                  </p>
                </div>
                <StatusBadge status={item.badgeStatus} className="shrink-0" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
