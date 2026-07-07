"use client";

import { useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUpRight, FileUp, Link2, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/shared/copy-button";
import { cn } from "@/lib/utils";

const CSV_TEMPLATE = `name,brand,category,description,price,commissionRate,platform,riskCategory,isNewLaunch,isKnownBrand,isRising,tags,productUrl,affiliateUrl
Glow Boost Serum 30ml,SkinLab,Beauty,"Lightweight vitamin C serum, brightening",259,12,SHOPEE,SKINCARE,true,false,true,"skincare,serum,vitamin c",https://shopee.co.th/product/123456,https://s.shopee.co.th/abc123`;

interface ImportResult {
  created: number;
  skipped: { row: number; reason: string }[];
}

export function ImportProductsCard() {
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setCsv(await file.text());
      toast.success(`Loaded ${file.name}`);
    } catch {
      toast.error("Could not read the file");
    } finally {
      e.target.value = "";
    }
  }

  async function runImport() {
    if (!csv.trim()) {
      toast.error("Paste CSV data or choose a file first");
      return;
    }
    setImporting(true);
    setResult(null);
    try {
      const res = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Import failed");
        return;
      }
      setResult(data as ImportResult);
      toast.success(`Imported ${(data as ImportResult).created} products`);
      router.refresh();
    } catch {
      toast.error("Import failed");
    } finally {
      setImporting(false);
    }
  }

  const summary = result
    ? [
        `Created ${result.created}`,
        result.skipped.length
          ? `Skipped ${result.skipped.length} (${result.skipped
              .map((s) => `row ${s.row}: ${s.reason}`)
              .join("; ")})`
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Import products</CardTitle>
        <CardDescription>
          Bring products in without any API — CSV, manual entry, or affiliate-dashboard exports.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="csv">
          <TabsList>
            <TabsTrigger value="csv">
              <FileUp className="size-3.5" />
              CSV import
            </TabsTrigger>
            <TabsTrigger value="manual">
              <PencilLine className="size-3.5" />
              Manual entry
            </TabsTrigger>
            <TabsTrigger value="links">
              <Link2 className="size-3.5" />
              Affiliate link export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="mt-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="csv-input">Paste CSV — first row must be headers</Label>
              <CopyButton text={CSV_TEMPLATE} label="Template" />
            </div>
            <Textarea
              id="csv-input"
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              rows={8}
              className="font-mono text-xs"
              placeholder={
                "name,brand,category,price,commissionRate,platform,...\nGlow Boost Serum 30ml,SkinLab,Beauty,259,12,SHOPEE,..."
              }
            />
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleFile}
                className="max-w-64"
                aria-label="Choose a CSV file"
              />
              <Button size="sm" onClick={runImport} disabled={importing}>
                {importing ? "Importing…" : "Import"}
              </Button>
            </div>
            {summary && (
              <p
                className={cn(
                  "rounded-md border bg-muted/50 px-3 py-2 text-sm tabular-nums",
                  result && result.skipped.length > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {summary}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Recognized columns: name (required), price (required), brand, category, description,
              commissionRate, platform (SHOPEE / TIKTOK_SHOP / BOTH), riskCategory, status,
              isNewLaunch, isKnownBrand, isRising, isSeasonal, isEvergreen, demandScore,
              trendScore, competitionScore, contentDifficultyScore, trustScore, tags, notes,
              productUrl, affiliateUrl. Every imported product gets an opportunity score computed
              with your current weights.
            </p>
          </TabsContent>

          <TabsContent value="manual" className="mt-3 space-y-3">
            <p className="text-sm text-muted-foreground">
              Add a single product by hand — name, price, commission, flags and component scores.
              The Add-product dialog lives on the Product Radar page.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/radar">
                Open Product Radar
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </TabsContent>

          <TabsContent value="links" className="mt-3 space-y-3">
            <p className="text-sm text-muted-foreground">
              Generate affiliate links in your Shopee or TikTok Shop affiliate dashboard, export or
              copy them, then paste them into the matching product record on the{" "}
              <Link href="/radar" className="font-medium text-foreground underline underline-offset-4">
                Product Radar
              </Link>{" "}
              page. Links are stored per product and per platform, so captions and campaigns always
              pick up the right URL — no scraping or unofficial automation involved.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
