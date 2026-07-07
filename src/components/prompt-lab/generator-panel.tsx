"use client";

// Left config rail: product, template, style, platform, language, tone,
// duration, persona, claim strictness → Generate.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { CONTENT_TEMPLATES } from "@/lib/templates";
import {
  CLAIM_STRICTNESS,
  CONTENT_PLATFORMS,
  DURATIONS,
  GENERATOR_STYLES,
  LANGUAGES,
  TONES,
  label,
  type ClaimStrictness,
  type ContentLanguage,
  type ContentPlatform,
  type ContentTone,
  type GeneratorStyle,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductCombobox } from "./product-combobox";
import type {
  GenerateResult,
  GenerationContext,
  PersonaOption,
  ProductOption,
} from "./prompt-lab-client";

const HIGH_RISK = ["SKINCARE", "BEAUTY", "SUPPLEMENT", "HEALTH"];

function autoStrictness(product: ProductOption | null): ClaimStrictness {
  return product && HIGH_RISK.includes(product.riskCategory) ? "HEALTH_BEAUTY_SAFE" : "NORMAL";
}

export function GeneratorPanel({
  products,
  personas,
  initialProductId,
  onGenerated,
}: {
  products: ProductOption[];
  personas: PersonaOption[];
  initialProductId: string | null;
  onGenerated: (result: GenerateResult, context: GenerationContext) => void;
}) {
  const router = useRouter();
  const defaultPersona = personas.find((p) => p.isDefault) ?? personas[0] ?? null;
  const initialProduct = products.find((p) => p.id === initialProductId) ?? null;

  const [productId, setProductId] = useState<string | null>(initialProduct?.id ?? null);
  const [templateKey, setTemplateKey] = useState<string | null>(null);
  const [style, setStyle] = useState<GeneratorStyle>("TALKING_HEAD");
  const [platform, setPlatform] = useState<ContentPlatform>("TIKTOK");
  const [language, setLanguage] = useState<ContentLanguage>("TH");
  const [tone, setTone] = useState<ContentTone>("FRIENDLY");
  const [durationSec, setDurationSec] = useState<number>(15);
  const [includePersona, setIncludePersona] = useState(true);
  const [personaId, setPersonaId] = useState<string | null>(defaultPersona?.id ?? null);
  const [claimStrictness, setClaimStrictness] = useState<ClaimStrictness>(
    autoStrictness(initialProduct)
  );
  const [loading, setLoading] = useState(false);

  const product = products.find((p) => p.id === productId) ?? null;

  function handleProductSelect(p: ProductOption) {
    setProductId(p.id);
    setClaimStrictness(autoStrictness(p));
  }

  async function handleGenerate() {
    if (!product || loading) return;
    setLoading(true);
    const options = {
      platform,
      style,
      language,
      tone,
      durationSec,
      includePersona,
      claimStrictness,
      ...(templateKey ? { templateKey } : {}),
    };
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          personaId: includePersona ? personaId : null,
          options,
          save: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Generation failed");
      toast.success(`Content package generated (${label(String(data.provider).toUpperCase())})`);
      onGenerated(data as GenerateResult, {
        product,
        personaId: includePersona ? (personaId ?? null) : null,
        options,
      });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-muted-foreground" />
          Generator
        </CardTitle>
        <CardDescription>
          Pick a product and format — get a full content package in one shot.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Product */}
        <div className="space-y-1.5">
          <Label>Product</Label>
          <ProductCombobox products={products} value={productId} onSelect={handleProductSelect} />
        </div>

        {/* Template */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Template (optional)</Label>
            {templateKey && (
              <button
                type="button"
                onClick={() => setTemplateKey(null)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" /> Clear
              </button>
            )}
          </div>
          <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1">
            {CONTENT_TEMPLATES.map((t) => {
              const active = t.key === templateKey;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTemplateKey(active ? null : t.key)}
                  className={cn(
                    "rounded-md border p-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground",
                    active && "border-primary bg-primary/5 ring-2 ring-primary/40"
                  )}
                >
                  <p className="text-xs font-medium leading-tight">{t.name}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                    {t.bestFor}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Style + platform */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Style</Label>
            <Select value={style} onValueChange={(v) => setStyle(v as GeneratorStyle)}>
              <SelectTrigger className="w-full" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GENERATOR_STYLES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {label(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Platform</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as ContentPlatform)}>
              <SelectTrigger className="w-full" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {label(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Language + tone */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Language</Label>
            <Select value={language} onValueChange={(v) => setLanguage(v as ContentLanguage)}>
              <SelectTrigger className="w-full" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l} value={l}>
                    {label(l)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={(v) => setTone(v as ContentTone)}>
              <SelectTrigger className="w-full" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {label(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-1.5">
          <Label>Duration</Label>
          <div className="flex gap-1.5">
            {DURATIONS.map((d) => (
              <Button
                key={d}
                type="button"
                size="sm"
                variant={durationSec === d ? "default" : "outline"}
                className="flex-1 tabular-nums"
                onClick={() => setDurationSec(d)}
              >
                {d}s
              </Button>
            ))}
          </div>
        </div>

        {/* Persona */}
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <Label htmlFor="include-persona">Include AI persona</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Adds a persona talking-head Veo prompt. Personas are always fictional.
              </p>
            </div>
            <Switch
              id="include-persona"
              checked={includePersona}
              onCheckedChange={setIncludePersona}
            />
          </div>
          {includePersona && (
            <Select
              value={personaId ?? undefined}
              onValueChange={(v) => setPersonaId(v)}
            >
              <SelectTrigger className="w-full" size="sm">
                <SelectValue placeholder="Select persona…" />
              </SelectTrigger>
              <SelectContent>
                {personas.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {p.isDefault ? " (default)" : ""} — {p.ageRange}, {p.style}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Claim strictness */}
        <div className="space-y-1.5">
          <Label>Claim strictness</Label>
          <Select
            value={claimStrictness}
            onValueChange={(v) => setClaimStrictness(v as ClaimStrictness)}
          >
            <SelectTrigger className="w-full" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLAIM_STRICTNESS.map((c) => (
                <SelectItem key={c} value={c}>
                  {label(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Auto-strict for skincare/health products.
          </p>
        </div>

        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={!product || loading}
          onClick={handleGenerate}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Generating package…
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Generate content package
            </>
          )}
        </Button>

        <p className="text-center text-[11px] leading-snug text-muted-foreground">
          Drafts only — nothing is auto-published. Disclosure is always included.
        </p>
      </CardContent>
    </Card>
  );
}
