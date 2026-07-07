"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { label, PRODUCT_PLATFORMS, PRODUCT_STATUSES, RISK_CATEGORIES } from "@/lib/types";

interface FormState {
  name: string;
  brand: string;
  category: string;
  description: string;
  price: string;
  commissionRate: string;
  platform: string;
  riskCategory: string;
  status: string;
  isNewLaunch: boolean;
  isKnownBrand: boolean;
  isRising: boolean;
  isSeasonal: boolean;
  isEvergreen: boolean;
  demandScore: number;
  trendScore: number;
  competitionScore: number;
  contentDifficultyScore: number;
  trustScore: number;
  launchDate: string;
  productUrl: string;
  affiliateUrl: string;
  tags: string;
  notes: string;
}

const INITIAL_FORM: FormState = {
  name: "",
  brand: "",
  category: "",
  description: "",
  price: "",
  commissionRate: "",
  platform: "SHOPEE",
  riskCategory: "GENERAL",
  status: "WATCHLIST",
  isNewLaunch: false,
  isKnownBrand: false,
  isRising: false,
  isSeasonal: false,
  isEvergreen: false,
  demandScore: 50,
  trendScore: 50,
  competitionScore: 50,
  contentDifficultyScore: 50,
  trustScore: 50,
  launchDate: "",
  productUrl: "",
  affiliateUrl: "",
  tags: "",
  notes: "",
};

const FLAG_FIELDS = [
  { key: "isNewLaunch", label: "New launch" },
  { key: "isKnownBrand", label: "Known brand" },
  { key: "isRising", label: "Rising" },
  { key: "isSeasonal", label: "Seasonal" },
  { key: "isEvergreen", label: "Evergreen" },
] as const;

const SCORE_FIELDS = [
  { key: "demandScore", label: "Demand", hint: "How many people want this" },
  { key: "trendScore", label: "Trend", hint: "Interest momentum right now" },
  { key: "competitionScore", label: "Competition", hint: "Higher = more crowded" },
  { key: "contentDifficultyScore", label: "Content difficulty", hint: "Higher = harder to film" },
  { key: "trustScore", label: "Trust", hint: "Brand / product credibility" },
] as const;

export function AddProductDialog({
  open,
  onOpenChange,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((s) => ({ ...s, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.category.trim()) {
      toast.error("Name and category are required");
      return;
    }
    const price = Number(form.price);
    if (form.price.trim() === "" || Number.isNaN(price) || price < 0) {
      toast.error("Enter a valid price");
      return;
    }
    const commissionRate = form.commissionRate.trim() === "" ? 0 : Number(form.commissionRate);
    if (Number.isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
      toast.error("Commission must be between 0 and 100%");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          brand: form.brand.trim() || undefined,
          category: form.category.trim(),
          description: form.description.trim() || undefined,
          price,
          commissionRate,
          platform: form.platform,
          riskCategory: form.riskCategory,
          status: form.status,
          isNewLaunch: form.isNewLaunch,
          isKnownBrand: form.isKnownBrand,
          isRising: form.isRising,
          isSeasonal: form.isSeasonal,
          isEvergreen: form.isEvergreen,
          demandScore: form.demandScore,
          trendScore: form.trendScore,
          competitionScore: form.competitionScore,
          contentDifficultyScore: form.contentDifficultyScore,
          trustScore: form.trustScore,
          launchDate: form.launchDate || undefined,
          productUrl: form.productUrl.trim() || undefined,
          affiliateUrl: form.affiliateUrl.trim() || undefined,
          tags: form.tags.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to create product");
      }
      toast.success(`${form.name.trim()} added to the radar`);
      setForm(INITIAL_FORM);
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add product</DialogTitle>
          <DialogDescription>
            Add a product manually. The opportunity score is computed from your inputs the moment
            it is saved.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ap-name">Name *</Label>
              <Input
                id="ap-name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Vitamin C serum 30ml"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-brand">Brand</Label>
              <Input
                id="ap-brand"
                value={form.brand}
                onChange={(e) => set("brand", e.target.value)}
                placeholder="e.g. GlowLab"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-category">Category *</Label>
              <Input
                id="ap-category"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="e.g. Skincare"
                list="ap-category-options"
                required
              />
              <datalist id="ap-category-options">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ap-description">Description</Label>
              <Textarea
                id="ap-description"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="What is it, who is it for?"
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-price">Price (THB) *</Label>
              <Input
                id="ap-price"
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="590"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-commission">Commission %</Label>
              <Input
                id="ap-commission"
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={form.commissionRate}
                onChange={(e) => set("commissionRate", e.target.value)}
                placeholder="12.5"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <Select value={form.platform} onValueChange={(v) => set("platform", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {label(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Risk category</Label>
              <Select value={form.riskCategory} onValueChange={(v) => set("riskCategory", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RISK_CATEGORIES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {label(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {label(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-launch-date">Launch date</Label>
              <Input
                id="ap-launch-date"
                type="date"
                value={form.launchDate}
                onChange={(e) => set("launchDate", e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Opportunity flags</Label>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {FLAG_FIELDS.map((f) => (
                <label
                  key={f.key}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={form[f.key]}
                    onCheckedChange={(checked) => set(f.key, checked === true)}
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <Label>Score inputs (0–100)</Label>
              <p className="text-xs text-muted-foreground">
                Your own read of the market — these feed the opportunity score.
              </p>
            </div>
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {SCORE_FIELDS.map((f) => (
                <div key={f.key}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium">{f.label}</span>
                    <span className="text-xs font-semibold tabular-nums">{form[f.key]}</span>
                  </div>
                  <Slider
                    value={[form[f.key]]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(vals) => set(f.key, vals[0] ?? 50)}
                    aria-label={f.label}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">{f.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ap-product-url">Product URL</Label>
              <Input
                id="ap-product-url"
                type="url"
                value={form.productUrl}
                onChange={(e) => set("productUrl", e.target.value)}
                placeholder="https://shopee.co.th/…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-affiliate-url">Affiliate link URL</Label>
              <Input
                id="ap-affiliate-url"
                type="url"
                value={form.affiliateUrl}
                onChange={(e) => set("affiliateUrl", e.target.value)}
                placeholder="https://shope.ee/… (optional)"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-tags">Tags</Label>
              <Input
                id="ap-tags"
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
                placeholder="comma, separated, tags"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-notes">Notes</Label>
              <Textarea
                id="ap-notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Anything worth remembering"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Add product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
