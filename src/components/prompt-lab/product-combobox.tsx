"use client";

// Searchable product picker: name + brand/category/price line + ScoreBadge.

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScoreBadge } from "@/components/shared/score-badge";
import { formatCurrency } from "@/lib/utils";
import type { ProductOption } from "./prompt-lab-client";

export function ProductCombobox({
  products,
  value,
  onSelect,
}: {
  products: ProductOption[];
  value: string | null;
  onSelect: (product: ProductOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = products.find((p) => p.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      `${p.name} ${p.brand ?? ""} ${p.category}`.toLowerCase().includes(q)
    );
  }, [products, query]);

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-auto min-h-9 w-full justify-between px-3 py-1.5 font-normal"
        >
          {selected ? (
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm">{selected.name}</span>
              <ScoreBadge score={selected.opportunityScore} />
            </span>
          ) : (
            <span className="text-muted-foreground">Select a product…</span>
          )}
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[336px] p-0" align="start">
        <div className="border-b p-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, brand, category…"
            className="h-8"
            autoFocus
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No products match “{query}”.
            </p>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onSelect(p);
                  setOpen(false);
                  setQuery("");
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-accent hover:text-accent-foreground"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{p.name}</span>
                    {p.id === value && <Check className="size-3.5 shrink-0 text-primary" />}
                  </div>
                  <p className="truncate text-xs text-muted-foreground tabular-nums">
                    {p.brand ? `${p.brand} · ` : ""}
                    {p.category} · {formatCurrency(p.price)} · {p.commissionRate}% comm.
                  </p>
                </div>
                <ScoreBadge score={p.opportunityScore} />
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
