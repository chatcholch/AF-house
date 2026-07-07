"use client";

import {
  CheckCircle2,
  Lightbulb,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CopyButton } from "@/components/shared/copy-button";
import { ScoreBadge } from "@/components/shared/score-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { DISCLOSURE_TEXT } from "@/lib/compliance";
import { label, type ComplianceFlag } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ProductOption {
  id: string;
  name: string;
  riskCategory: string;
}

interface CheckResult {
  verdict: string;
  score: number;
  hasDisclosure: boolean;
  flags: ComplianceFlag[];
}

const NO_PRODUCT = "none";

const VERDICT_BANNER: Record<string, string> = {
  SAFE: "border-emerald-500/30 bg-emerald-500/5",
  NEEDS_REVIEW: "border-amber-500/30 bg-amber-500/5",
  RISKY: "border-orange-500/30 bg-orange-500/5",
  REJECT: "border-red-500/30 bg-red-500/5",
};

const SEVERITY_ROW: Record<ComplianceFlag["severity"], string> = {
  critical: "border-l-red-500",
  warning: "border-l-amber-500",
  info: "border-l-sky-500",
};

const SEVERITY_BADGE: Record<ComplianceFlag["severity"], string> = {
  critical: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  info: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
};

const VERDICT_LEGEND: { verdict: string; meaning: string }[] = [
  { verdict: "SAFE", meaning: "No issues — ready to approve" },
  { verdict: "NEEDS_REVIEW", meaning: "Warnings — soften the wording first" },
  { verdict: "RISKY", meaning: "One critical issue — fix before use" },
  { verdict: "REJECT", meaning: "Multiple critical issues — rewrite it" },
];

export function ComplianceChecker({ products }: { products: ProductOption[] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [productId, setProductId] = useState<string>(NO_PRODUCT);
  const [aiPresenter, setAiPresenter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);

  const activeRisk =
    products.find((p) => p.id === productId)?.riskCategory ?? "GENERAL";

  async function runCheck() {
    if (!text.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/compliance/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          productId: productId === NO_PRODUCT ? undefined : productId,
          isAiGenerated: aiPresenter,
        }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data: CheckResult = await res.json();
      setResult(data);
      router.refresh();
    } catch {
      toast.error("Could not run the check — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Checker</CardTitle>
        <CardDescription>
          Paste content, pick the product it belongs to, and run the rules. Nothing
          leaves this app — checks run locally against the claim-safety rule set.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="compliance-text">Content to check</Label>
          <Textarea
            id="compliance-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste a script, caption, or hook — Thai or English…"
            className="min-h-48"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="compliance-product">Product (optional)</Label>
          <div className="flex items-center gap-2">
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger id="compliance-product" className="w-full min-w-0 flex-1">
                <SelectValue placeholder="— no product / general —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PRODUCT}>— no product / general —</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="shrink-0 text-muted-foreground">
              {label(activeRisk)} rules
            </Badge>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 rounded-md border p-3">
          <div className="space-y-1">
            <Label htmlFor="compliance-ai">AI-presenter content</Label>
            <p className="text-xs text-muted-foreground">
              Flags first-person experience claims that would be misleading for an AI
              persona
            </p>
          </div>
          <Switch
            id="compliance-ai"
            checked={aiPresenter}
            onCheckedChange={setAiPresenter}
          />
        </div>

        <Button onClick={runCheck} disabled={!text.trim() || loading} className="w-full sm:w-auto">
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Checking…
            </>
          ) : (
            <>
              <ShieldCheck className="size-4" />
              Run check
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-3">
            <div
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-lg border p-4",
                VERDICT_BANNER[result.verdict] ?? ""
              )}
            >
              <StatusBadge status={result.verdict} className="px-3 py-1 text-sm" />
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                Safety score
                <ScoreBadge score={result.score} />
              </span>
            </div>

            {result.hasDisclosure ? (
              <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4 shrink-0" />
                Disclosure found
              </div>
            ) : (
              <div className="rounded-md border border-red-500/30 bg-red-500/5 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                  <XCircle className="size-4 shrink-0" />
                  No affiliate disclosure
                </div>
                <div className="mt-2 flex items-start justify-between gap-2 rounded-md bg-muted/60 p-2">
                  <code className="text-xs leading-relaxed">{DISCLOSURE_TEXT.TH}</code>
                  <CopyButton text={DISCLOSURE_TEXT.TH} label="Copy" />
                </div>
              </div>
            )}

            {result.flags.length === 0 ? (
              <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4 shrink-0" />
                No issues found
              </div>
            ) : (
              <div className="space-y-2">
                {result.flags.map((flag, i) => (
                  <div
                    key={`${flag.ruleId}-${i}`}
                    className={cn(
                      "rounded-md border border-l-4 p-3",
                      SEVERITY_ROW[flag.severity] ?? "border-l-sky-500"
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn("uppercase", SEVERITY_BADGE[flag.severity] ?? "")}
                      >
                        {flag.severity}
                      </Badge>
                      <span className="text-sm font-medium">{flag.message}</span>
                    </div>
                    {flag.excerpt && (
                      <code className="mt-2 inline-block rounded bg-muted px-1.5 py-0.5 text-xs">
                        “{flag.excerpt}”
                      </code>
                    )}
                    {flag.suggestion && (
                      <p className="mt-2 flex items-start gap-1.5 text-xs italic text-muted-foreground">
                        <Lightbulb className="mt-0.5 size-3.5 shrink-0" />
                        {flag.suggestion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-2 border-t pt-4">
          {VERDICT_LEGEND.map((item) => (
            <div key={item.verdict} className="flex items-center gap-1.5">
              <StatusBadge status={item.verdict} />
              <span className="text-xs text-muted-foreground">{item.meaning}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
