"use client";

import { LayoutGrid, Search, Table2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { label, PRODUCT_STATUSES } from "@/lib/types";
import { cn } from "@/lib/utils";

export type FlagKey = "isNewLaunch" | "isRising" | "isKnownBrand" | "isSeasonal" | "isEvergreen";

export interface RadarFilters {
  search: string;
  platform: string; // "ALL" | ProductPlatform
  category: string; // "ALL" | category name
  status: string; // "ALL" | ProductStatus
  minScore: number; // 0 | 40 | 60 | 80
  minCommission: number; // 0 | 10 | 15 | 20
  flags: FlagKey[];
}

export const EMPTY_FILTERS: RadarFilters = {
  search: "",
  platform: "ALL",
  category: "ALL",
  status: "ALL",
  minScore: 0,
  minCommission: 0,
  flags: [],
};

const FLAG_CHIPS: { key: FlagKey; label: string }[] = [
  { key: "isNewLaunch", label: "New launch" },
  { key: "isRising", label: "Rising" },
  { key: "isKnownBrand", label: "Known brand" },
  { key: "isSeasonal", label: "Seasonal" },
  { key: "isEvergreen", label: "Evergreen" },
];

const MIN_SCORE_OPTIONS = [
  { value: 0, label: "Any score" },
  { value: 40, label: "Score 40+" },
  { value: 60, label: "Score 60+" },
  { value: 80, label: "Score 80+" },
];

const MIN_COMMISSION_OPTIONS = [
  { value: 0, label: "Any commission" },
  { value: 10, label: "Commission 10%+" },
  { value: 15, label: "Commission 15%+" },
  { value: 20, label: "Commission 20%+" },
];

export function FilterBar({
  filters,
  onChange,
  categories,
  activeCount,
  view,
  onViewChange,
  resultCount,
  totalCount,
}: {
  filters: RadarFilters;
  onChange: (filters: RadarFilters) => void;
  categories: string[];
  activeCount: number;
  view: "table" | "cards";
  onViewChange: (view: "table" | "cards") => void;
  resultCount: number;
  totalCount: number;
}) {
  const set = (patch: Partial<RadarFilters>) => onChange({ ...filters, ...patch });

  const toggleFlag = (key: FlagKey) =>
    set({
      flags: filters.flags.includes(key)
        ? filters.flags.filter((f) => f !== key)
        : [...filters.flags, key],
    });

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Search name, brand, category…"
            className="h-8 w-60 pl-8"
            aria-label="Search products"
          />
        </div>

        <Select value={filters.platform} onValueChange={(v) => set({ platform: v })}>
          <SelectTrigger size="sm" className="w-[140px]" aria-label="Platform filter">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All platforms</SelectItem>
            <SelectItem value="SHOPEE">Shopee</SelectItem>
            <SelectItem value="TIKTOK_SHOP">TikTok Shop</SelectItem>
            <SelectItem value="BOTH">Both</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.category} onValueChange={(v) => set({ category: v })}>
          <SelectTrigger size="sm" className="w-[150px]" aria-label="Category filter">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={(v) => set({ status: v })}>
          <SelectTrigger size="sm" className="w-[130px]" aria-label="Status filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {PRODUCT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {label(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(filters.minScore)}
          onValueChange={(v) => set({ minScore: Number(v) })}
        >
          <SelectTrigger size="sm" className="w-[125px]" aria-label="Minimum opportunity score">
            <SelectValue placeholder="Score" />
          </SelectTrigger>
          <SelectContent>
            {MIN_SCORE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={String(o.value)}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(filters.minCommission)}
          onValueChange={(v) => set({ minCommission: Number(v) })}
        >
          <SelectTrigger size="sm" className="w-[160px]" aria-label="Minimum commission">
            <SelectValue placeholder="Commission" />
          </SelectTrigger>
          <SelectContent>
            {MIN_COMMISSION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={String(o.value)}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            {resultCount} of {totalCount}
          </span>
          <div className="flex items-center gap-0.5 rounded-md border p-0.5">
            <Button
              type="button"
              variant={view === "table" ? "secondary" : "ghost"}
              size="icon"
              className="size-7"
              onClick={() => onViewChange("table")}
              aria-label="Table view"
            >
              <Table2 className="size-4" />
            </Button>
            <Button
              type="button"
              variant={view === "cards" ? "secondary" : "ghost"}
              size="icon"
              className="size-7"
              onClick={() => onViewChange("cards")}
              aria-label="Card view"
            >
              <LayoutGrid className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {FLAG_CHIPS.map((chip) => {
          const active = filters.flags.includes(chip.key);
          return (
            <button
              key={chip.key}
              type="button"
              aria-pressed={active}
              onClick={() => toggleFlag(chip.key)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {chip.label}
            </button>
          );
        })}
        {activeCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground"
            onClick={() => onChange(EMPTY_FILTERS)}
          >
            <X className="size-3.5" />
            Clear all ({activeCount})
          </Button>
        )}
      </div>
    </div>
  );
}
