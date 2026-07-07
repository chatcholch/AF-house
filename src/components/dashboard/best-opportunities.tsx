import Link from "next/link";
import type { ReactNode } from "react";
import { Flame, Radar, Rocket, Sparkles, TrendingUp, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ScoreBadge } from "@/components/shared/score-badge";
import { PlatformBadge } from "@/components/shared/status-badge";
import { formatPercent } from "@/lib/utils";
import { SectionLink } from "./section-card";

export interface BestOpportunityProduct {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  platform: string;
  opportunityScore: number;
  commissionRate: number;
  isNewLaunch: boolean;
  isRising: boolean;
  isKnownBrand: boolean;
  whyItMightSell: string | null;
}

export function BestOpportunities({ products }: { products: BestOpportunityProduct[] }) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Flame className="size-4 text-muted-foreground" />
            Today&apos;s best opportunities
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Highest opportunity scores on your radar right now — jump straight into content.
          </p>
        </div>
        <SectionLink href="/radar">Open radar</SectionLink>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={Radar}
          title="No opportunities on the radar yet"
          description="Add products manually or import a CSV in Product Radar to start scoring opportunities."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/radar">Open Product Radar</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {products.map((product, index) => (
            <Card key={product.id} className="gap-0 py-0">
              <CardContent className="flex h-full flex-col gap-2.5 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                    #{index + 1}
                  </span>
                  <ScoreBadge score={product.opportunityScore} />
                </div>

                <div className="min-w-0">
                  <Link
                    href={`/radar/${product.id}`}
                    className="line-clamp-2 text-sm font-semibold leading-snug hover:underline"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {product.brand ? `${product.brand} · ` : ""}
                    {product.category}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  <PlatformBadge platform={product.platform} className="px-1.5 py-0 text-[10px]" />
                  {product.isNewLaunch && (
                    <FlagBadge className="border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400">
                      <Rocket />
                      New launch
                    </FlagBadge>
                  )}
                  {product.isRising && (
                    <FlagBadge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <TrendingUp />
                      Rising
                    </FlagBadge>
                  )}
                  {product.isKnownBrand && (
                    <FlagBadge className="border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      <BadgeCheck />
                      Known brand
                    </FlagBadge>
                  )}
                </div>

                {product.whyItMightSell && (
                  <p className="truncate text-xs text-muted-foreground" title={product.whyItMightSell}>
                    {product.whyItMightSell}
                  </p>
                )}

                <div className="mt-auto space-y-2 pt-1">
                  <p className="text-xs text-muted-foreground">
                    Commission{" "}
                    <span className="font-semibold tabular-nums text-foreground">
                      {formatPercent(product.commissionRate)}
                    </span>
                  </p>
                  <Button asChild size="sm" variant="secondary" className="w-full">
                    <Link href={`/prompt-lab?productId=${product.id}`}>
                      <Sparkles />
                      Generate content
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function FlagBadge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Badge variant="outline" className={`px-1.5 py-0 text-[10px] font-medium ${className ?? ""}`}>
      {children}
    </Badge>
  );
}
