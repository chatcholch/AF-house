import type { Product } from "@prisma/client";
import { AlertTriangle, Info, Lightbulb, ListChecks, Sparkles, Users } from "lucide-react";
import { RefreshAnglesButton } from "@/components/product-detail/refresh-angles-button";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BuyerPersona } from "@/lib/types";

function parseJson<T>(json: string | null | undefined): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 1. Why this might sell
// ---------------------------------------------------------------------------

export function WhyItMightSellCard({ product }: { product: Product }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Why this might sell</CardTitle>
        <CardDescription>AI-generated sales rationale for this product</CardDescription>
      </CardHeader>
      <CardContent>
        {product.whyItMightSell ? (
          <p className="text-sm leading-relaxed whitespace-pre-line">{product.whyItMightSell}</p>
        ) : (
          <EmptyState
            icon={Sparkles}
            title="No rationale yet"
            description="Run Refresh angles to generate why this product might sell, buyer personas and pain points."
            action={<RefreshAnglesButton productId={product.id} />}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 2. Buyer personas
// ---------------------------------------------------------------------------

export function BuyerPersonasCard({ product }: { product: Product }) {
  const personas = parseJson<BuyerPersona[]>(product.buyerPersonasJson) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buyer personas</CardTitle>
        <CardDescription>Who is most likely to buy — target these in hooks</CardDescription>
      </CardHeader>
      <CardContent>
        {personas.length > 0 ? (
          <ul className="divide-y">
            {personas.map((persona, i) => (
              <li key={`${persona.name}-${i}`} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:gap-4">
                <span className="shrink-0 text-sm font-medium sm:w-44">{persona.name}</span>
                <span className="text-sm text-muted-foreground">{persona.description}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Users}
            title="No buyer personas yet"
            description="Refresh angles to generate likely buyer segments for this product."
            action={<RefreshAnglesButton productId={product.id} />}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 3. Pain points
// ---------------------------------------------------------------------------

export function PainPointsCard({ product }: { product: Product }) {
  const painPoints = parseJson<string[]>(product.painPointsJson) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pain points</CardTitle>
        <CardDescription>Problems this product solves — lead your hooks with these</CardDescription>
      </CardHeader>
      <CardContent>
        {painPoints.length > 0 ? (
          <ul className="space-y-2">
            {painPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={ListChecks}
            title="No pain points yet"
            description="Refresh angles to extract the buyer problems this product addresses."
            action={<RefreshAnglesButton productId={product.id} />}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 4. Content angles & warnings
// ---------------------------------------------------------------------------

const CONSERVATIVE_CLAIM_WARNINGS = [
  "No medical or curative claims — say “helps the look of…”, never “treats”, “cures” or “heals”.",
  "No guaranteed results or timelines (“see results in 7 days” is a red flag).",
  "Avoid before/after visuals that imply a physical transformation.",
  "Frame everything as personal experience (“for me…”) and note that results vary.",
  "Affiliate disclosure is mandatory in every caption — it is added automatically, do not remove it.",
];

const GENERAL_GUIDANCE = [
  "Keep claims factual and verifiable from the product listing.",
  "No fake urgency or invented discounts — only real prices and promotions.",
  "Affiliate disclosure is always included in captions — never remove it.",
  "AI personas are always fictional — never imply a real person or celebrity uses this.",
];

const CONSERVATIVE_RISK_CATEGORIES = new Set(["SKINCARE", "BEAUTY", "SUPPLEMENT", "HEALTH"]);

function staticAngleIdeas(product: Product): string[] {
  const ideas: string[] = [];
  if (product.isNewLaunch)
    ideas.push("“Just dropped” first-look — be early before reviews flood the feed.");
  if (product.isKnownBrand)
    ideas.push(`Brand-trust angle — lead with ${product.brand ?? "the brand"}, buyers need less convincing.`);
  if (product.isRising)
    ideas.push("Trend-jacking — ride the current search and social momentum while it lasts.");
  if (product.isSeasonal)
    ideas.push(
      `Seasonal urgency — tie the content to ${product.seasonalWindow ?? "the seasonal window"}.`
    );
  if (product.isEvergreen)
    ideas.push("Evergreen problem → solution — content keeps converting long after posting.");
  ideas.push("Price/value angle — anchor on the price and what buyers get for it.");
  return ideas;
}

export function AnglesWarningsCard({ product }: { product: Product }) {
  const conservative = CONSERVATIVE_RISK_CATEGORIES.has(product.riskCategory);
  const warnings = conservative ? CONSERVATIVE_CLAIM_WARNINGS : GENERAL_GUIDANCE;
  const angles = staticAngleIdeas(product);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content angles &amp; warnings</CardTitle>
        <CardDescription>
          Starting angles from the product flags, plus claim rules for the{" "}
          {product.riskCategory.toLowerCase()} category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h4 className="mb-3 flex items-center gap-1.5 text-sm font-medium">
              <Lightbulb className="size-4 text-muted-foreground" />
              Angle starting points
            </h4>
            <ul className="space-y-2">
              {angles.map((angle, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sky-500/60" aria-hidden />
                  <span>{angle}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground/80">
              Fresh AI-tailored angles are generated on demand — use{" "}
              <span className="font-medium">Refresh angles</span> above or open Prompt Lab.
            </p>
          </div>
          <div>
            <h4 className="mb-3 flex items-center gap-1.5 text-sm font-medium">
              {conservative ? (
                <AlertTriangle className="size-4 text-amber-500" />
              ) : (
                <Info className="size-4 text-muted-foreground" />
              )}
              {conservative ? "Conservative-claims rules" : "General claim guidance"}
            </h4>
            <ul className="space-y-2">
              {warnings.map((warning, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span
                    className={`mt-1.5 size-1.5 shrink-0 rounded-full ${conservative ? "bg-amber-500/70" : "bg-muted-foreground/50"}`}
                    aria-hidden
                  />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
