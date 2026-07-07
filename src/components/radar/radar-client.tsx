"use client";

import { useMemo, useState } from "react";
import { PackagePlus, Radar as RadarIcon, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { AddProductDialog } from "./add-product-dialog";
import { EMPTY_FILTERS, FilterBar, type RadarFilters } from "./filter-bar";
import { ProductCards } from "./product-cards";
import { ProductTable, type SortDir, type SortKey } from "./product-table";

// ---------------------------------------------------------------------------
// Serialized shapes passed from the server page (dates as ISO strings)
// ---------------------------------------------------------------------------

export interface RadarSignal {
  id: string;
  productId: string;
  signalType: string;
  source: string;
  strength: number;
  note: string | null;
  detectedAt: string;
}

export interface RadarLink {
  id: string;
  productId: string;
  platform: string;
  url: string;
  shortUrl: string | null;
  label: string | null;
  isActive: boolean;
  clicks: number;
  createdAt: string;
}

export interface RadarProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  brand: string | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  productUrl: string | null;
  platform: string;
  commissionRate: number;
  source: string;
  status: string;
  isNewLaunch: boolean;
  isKnownBrand: boolean;
  isRising: boolean;
  isSeasonal: boolean;
  isEvergreen: boolean;
  seasonalWindow: string | null;
  demandScore: number;
  trendScore: number;
  competitionScore: number;
  contentDifficultyScore: number;
  trustScore: number;
  opportunityScore: number;
  riskCategory: string;
  whyItMightSell: string | null;
  tags: string | null;
  notes: string | null;
  launchDate: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
  trendSignals: RadarSignal[];
  affiliateLinks: RadarLink[];
}

// ---------------------------------------------------------------------------

export function RadarClient({ products }: { products: RadarProduct[] }) {
  const [filters, setFilters] = useState<RadarFilters>(EMPTY_FILTERS);
  const [view, setView] = useState<"table" | "cards">("table");
  const [sortKey, setSortKey] = useState<SortKey>("opportunity");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [addOpen, setAddOpen] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort((a, b) => a.localeCompare(b)),
    [products]
  );

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return products.filter((p) => {
      if (q) {
        const haystack = `${p.name} ${p.brand ?? ""} ${p.category}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filters.platform !== "ALL") {
        if (filters.platform === "BOTH") {
          if (p.platform !== "BOTH") return false;
        } else if (p.platform !== filters.platform && p.platform !== "BOTH") {
          // A product on BOTH platforms also matches the single-platform filter.
          return false;
        }
      }
      if (filters.category !== "ALL" && p.category !== filters.category) return false;
      if (filters.status !== "ALL" && p.status !== filters.status) return false;
      if (p.opportunityScore < filters.minScore) return false;
      if (p.commissionRate < filters.minCommission) return false;
      for (const flag of filters.flags) {
        if (!p[flag]) return false;
      }
      return true;
    });
  }, [products, filters]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "price":
          return (a.price - b.price) * dir;
        case "commission":
          return (a.commissionRate - b.commissionRate) * dir;
        case "trend":
          return (a.trendScore - b.trendScore) * dir;
        case "updated":
          return (
            (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * dir
          );
        case "opportunity":
        default:
          return (a.opportunityScore - b.opportunityScore) * dir;
      }
    });
  }, [filtered, sortKey, sortDir]);

  const activeFilterCount =
    (filters.search.trim() ? 1 : 0) +
    (filters.platform !== "ALL" ? 1 : 0) +
    (filters.category !== "ALL" ? 1 : 0) +
    (filters.status !== "ALL" ? 1 : 0) +
    (filters.minScore > 0 ? 1 : 0) +
    (filters.minCommission > 0 ? 1 : 0) +
    filters.flags.length;

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <>
      <PageHeader
        title="Product Radar"
        description="Scan, score and shortlist affiliate products worth making content for."
        actions={
          <>
            <span className="text-sm text-muted-foreground tabular-nums">
              {products.length} {products.length === 1 ? "product" : "products"}
            </span>
            <Button onClick={() => setAddOpen(true)}>
              <PackagePlus className="size-4" />
              Add product
            </Button>
          </>
        }
      />

      <div className="space-y-4">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          categories={categories}
          activeCount={activeFilterCount}
          view={view}
          onViewChange={setView}
          resultCount={sorted.length}
          totalCount={products.length}
        />

        {products.length === 0 ? (
          <EmptyState
            icon={RadarIcon}
            title="No products on the radar yet"
            description="Add your first product manually — its opportunity score is computed the moment you save it."
            action={
              <Button onClick={() => setAddOpen(true)}>
                <PackagePlus className="size-4" />
                Add product
              </Button>
            }
          />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No products match these filters"
            description="Loosen the filters or clear them all to see the full radar."
            action={
              <Button variant="outline" onClick={() => setFilters(EMPTY_FILTERS)}>
                Clear filters
              </Button>
            }
          />
        ) : view === "table" ? (
          <ProductTable
            products={sorted}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
          />
        ) : (
          <ProductCards products={sorted} />
        )}
      </div>

      <AddProductDialog open={addOpen} onOpenChange={setAddOpen} categories={categories} />
    </>
  );
}
