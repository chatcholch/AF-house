import type { Product } from "@prisma/client";
import { ArrowLeft, ExternalLink, Sparkles } from "lucide-react";
import Link from "next/link";
import { RefreshAnglesButton } from "@/components/product-detail/refresh-angles-button";
import { PlatformBadge, StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent } from "@/lib/utils";

const FLAG_STYLE = "bg-muted text-muted-foreground border-transparent";

export function ProductHeader({ product }: { product: Product }) {
  const payoutPerSale = (product.price * product.commissionRate) / 100;

  const flags: string[] = [];
  if (product.isNewLaunch) flags.push("New launch");
  if (product.isKnownBrand) flags.push("Known brand");
  if (product.isRising) flags.push("Rising");
  if (product.isSeasonal)
    flags.push(product.seasonalWindow ? `Seasonal · ${product.seasonalWindow}` : "Seasonal");
  if (product.isEvergreen) flags.push("Evergreen");

  return (
    <div className="space-y-3">
      <Link
        href="/radar"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Product Radar
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
            {product.productUrl && (
              <Button asChild variant="ghost" size="icon" className="size-7 text-muted-foreground">
                <a
                  href={product.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open product listing"
                >
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {product.brand ? `${product.brand} · ` : ""}
            {product.category}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <PlatformBadge platform={product.platform} />
            <StatusBadge status={product.status} />
            {flags.map((flag) => (
              <Badge key={flag} variant="outline" className={FLAG_STYLE}>
                {flag}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 pt-1">
            <span className="text-xl font-semibold tabular-nums">
              {formatCurrency(product.price, product.currency)}
            </span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {formatPercent(product.commissionRate)} commission · ≈
              {formatCurrency(payoutPerSale, product.currency)}/sale
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button asChild size="sm">
            <Link href={`/prompt-lab?productId=${product.id}`}>
              <Sparkles className="size-4" />
              Generate content
            </Link>
          </Button>
          <RefreshAnglesButton productId={product.id} />
        </div>
      </div>
    </div>
  );
}
