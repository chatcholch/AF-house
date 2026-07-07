import type { AffiliateLink, PlatformProductData } from "@prisma/client";
import { ExternalLink, Link2, Star } from "lucide-react";
import { CopyButton } from "@/components/shared/copy-button";
import { PlatformBadge } from "@/components/shared/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { label } from "@/lib/types";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/lib/utils";

export function AffiliateDataCard({
  platformData,
  affiliateLinks,
}: {
  platformData: PlatformProductData[];
  affiliateLinks: AffiliateLink[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Affiliate data</CardTitle>
        <CardDescription>Per-platform listing data and tracked links</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {platformData.length === 0 && affiliateLinks.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No platform data synced yet — connect an affiliate API or import a CSV from Settings.
          </p>
        )}

        {platformData.map((row) => (
          <div key={row.id} className="rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <PlatformBadge platform={row.platform} />
              <span className="text-xs text-muted-foreground">
                Synced {formatDate(row.syncedAt)}
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {row.price != null && (
                <div>
                  <dt className="text-xs text-muted-foreground">Price</dt>
                  <dd className="font-medium tabular-nums">{formatCurrency(row.price)}</dd>
                </div>
              )}
              {row.commissionRate != null && (
                <div>
                  <dt className="text-xs text-muted-foreground">Commission</dt>
                  <dd className="font-medium tabular-nums">{formatPercent(row.commissionRate)}</dd>
                </div>
              )}
              {row.salesCount != null && (
                <div>
                  <dt className="text-xs text-muted-foreground">Sales</dt>
                  <dd className="font-medium tabular-nums">{formatNumber(row.salesCount)}</dd>
                </div>
              )}
              {row.rating != null && (
                <div>
                  <dt className="text-xs text-muted-foreground">Rating</dt>
                  <dd className="flex items-center gap-1 font-medium tabular-nums">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    {row.rating.toFixed(1)}
                    {row.reviewCount != null && (
                      <span className="font-normal text-muted-foreground">
                        ({formatNumber(row.reviewCount)})
                      </span>
                    )}
                  </dd>
                </div>
              )}
              {row.sellerName && (
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">Seller</dt>
                  <dd className="truncate font-medium">{row.sellerName}</dd>
                </div>
              )}
            </dl>
          </div>
        ))}

        {affiliateLinks.length > 0 && (
          <>
            {platformData.length > 0 && <Separator />}
            <div className="space-y-2">
              <h4 className="flex items-center gap-1.5 text-sm font-medium">
                <Link2 className="size-4 text-muted-foreground" />
                Affiliate links
              </h4>
              <ul className="space-y-2">
                {affiliateLinks.map((link) => (
                  <li key={link.id} className="rounded-lg border p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {link.label ?? label(link.platform)}
                      </span>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <CopyButton text={link.url} size="icon" className="size-7" />
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                          aria-label="Open affiliate link"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      </div>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {link.shortUrl ?? link.url}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                      {formatNumber(link.clicks)} clicks tracked
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
