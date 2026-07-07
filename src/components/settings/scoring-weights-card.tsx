"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { ScoringWeights } from "@/lib/scoring";

const ROWS: { key: keyof ScoringWeights; label: string; hint: string }[] = [
  { key: "trendMomentum", label: "Trend momentum", hint: "Rising interest, buzz, launch recency" },
  { key: "brandStrength", label: "Brand strength", hint: "Known brand, trust score" },
  { key: "commission", label: "Commission", hint: "Rate × price payout attractiveness" },
  { key: "viralityPotential", label: "Virality potential", hint: "How easy it is to make engaging short video" },
  { key: "competitionGap", label: "Competition gap", hint: "Low content saturation scores higher" },
  { key: "complianceSafety", label: "Compliance safety", hint: "Low claim / compliance risk scores higher" },
];

type Percents = Record<keyof ScoringWeights, number>;

export function ScoringWeightsCard({
  initialWeights,
  productCount,
}: {
  initialWeights: ScoringWeights;
  productCount: number;
}) {
  const router = useRouter();
  const [pct, setPct] = useState<Percents>(() => {
    const out = {} as Percents;
    for (const row of ROWS) out[row.key] = Math.round(initialWeights[row.key] * 100);
    return out;
  });
  const [saving, setSaving] = useState<"save" | "rescore" | null>(null);

  const sum = useMemo(() => ROWS.reduce((acc, row) => acc + pct[row.key], 0), [pct]);
  const sumOk = sum === 100;

  async function saveWeights({ quiet = false } = {}): Promise<boolean> {
    const scoringWeights = {} as ScoringWeights;
    for (const row of ROWS) scoringWeights[row.key] = pct[row.key] / 100;
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scoringWeights }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Could not save weights");
      return false;
    }
    if (!quiet) toast.success("Scoring weights saved");
    return true;
  }

  async function handleSave() {
    setSaving("save");
    try {
      if (await saveWeights()) router.refresh();
    } finally {
      setSaving(null);
    }
  }

  async function handleSaveAndRescore() {
    setSaving("rescore");
    try {
      if (!(await saveWeights({ quiet: true }))) return;
      const res = await fetch("/api/settings/rescore-all", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Rescore failed");
        return;
      }
      const data = await res.json();
      toast.success(`Rescored ${data.updated} products`);
      router.refresh();
    } finally {
      setSaving(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Opportunity scoring weights</CardTitle>
        <CardDescription>
          How the 0–100 opportunity score blends its six components. Weights must total 100%.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {ROWS.map((row) => (
          <div
            key={row.key}
            className="grid items-center gap-x-4 gap-y-1 sm:grid-cols-[11rem_1fr_3.25rem]"
          >
            <div>
              <Label htmlFor={`weight-${row.key}`} className="text-sm">
                {row.label}
              </Label>
              <p className="hidden text-xs text-muted-foreground xl:block">{row.hint}</p>
            </div>
            <Slider
              id={`weight-${row.key}`}
              aria-label={row.label}
              min={0}
              max={50}
              step={5}
              value={[pct[row.key]]}
              onValueChange={([value]) => setPct((p) => ({ ...p, [row.key]: value }))}
            />
            <span className="text-right text-sm font-medium tabular-nums">{pct[row.key]}%</span>
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center gap-3">
        <div
          className={cn(
            "flex items-center gap-1.5 text-sm font-medium tabular-nums",
            sumOk
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          )}
        >
          {sumOk ? <CheckCircle2 className="size-4" /> : <CircleAlert className="size-4" />}
          Total: {sum}%{!sumOk && " — must equal 100%"}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!sumOk || saving !== null}
          >
            {saving === "save" ? "Saving…" : "Save weights"}
          </Button>
          <Button size="sm" onClick={handleSaveAndRescore} disabled={!sumOk || saving !== null}>
            {saving === "rescore"
              ? "Rescoring…"
              : `Save & rescore all products (${productCount})`}
          </Button>
        </div>
        <p className="w-full text-xs text-muted-foreground">
          Weights are also editable in code at{" "}
          <code className="font-mono">src/lib/scoring.ts</code>.
        </p>
      </CardFooter>
    </Card>
  );
}
