import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeOpportunityScore, DEFAULT_WEIGHTS, type ScoringWeights } from "@/lib/scoring";
import { PRODUCT_PLATFORMS, PRODUCT_STATUSES, RISK_CATEGORIES } from "@/lib/types";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Small robust CSV parser: quoted fields, "" escapes, commas/newlines inside
// quotes, \r\n and \n line endings. Returns an array of records (rows).
// ---------------------------------------------------------------------------
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      endField();
      i++;
      continue;
    }
    if (c === "\r") {
      if (text[i + 1] === "\n") i++;
      endRow();
      i++;
      continue;
    }
    if (c === "\n") {
      endRow();
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field.length > 0 || row.length > 0) endRow();
  return rows;
}

// Header names are matched case-insensitively with spaces/underscores/dashes
// stripped, so "Commission Rate", "commission_rate" and "commissionRate" all work.
const HEADER_ALIASES: Record<string, string> = {
  name: "name",
  productname: "name",
  brand: "brand",
  category: "category",
  description: "description",
  price: "price",
  commissionrate: "commissionRate",
  commission: "commissionRate",
  platform: "platform",
  riskcategory: "riskCategory",
  risk: "riskCategory",
  status: "status",
  isnewlaunch: "isNewLaunch",
  isknownbrand: "isKnownBrand",
  isrising: "isRising",
  isseasonal: "isSeasonal",
  isevergreen: "isEvergreen",
  demandscore: "demandScore",
  trendscore: "trendScore",
  competitionscore: "competitionScore",
  contentdifficultyscore: "contentDifficultyScore",
  trustscore: "trustScore",
  tags: "tags",
  notes: "notes",
  producturl: "productUrl",
  affiliateurl: "affiliateUrl",
};

const normalizeHeader = (h: string) => h.trim().toLowerCase().replace(/[\s_-]/g, "");
const parseBool = (v: string | undefined) => /^(true|1|yes|y)$/i.test((v ?? "").trim());
const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

function parseScore(v: string | undefined): number {
  const n = Number((v ?? "").trim());
  return Number.isFinite(n) && (v ?? "").trim() !== "" ? clamp(Math.round(n)) : 50;
}

async function loadWeights(): Promise<ScoringWeights> {
  try {
    const row = await db.appSetting.findUnique({ where: { key: "scoringWeights" } });
    if (row) {
      const parsed = JSON.parse(row.valueJson);
      if (parsed && typeof parsed === "object") return { ...DEFAULT_WEIGHTS, ...parsed };
    }
  } catch {
    // fall through
  }
  return { ...DEFAULT_WEIGHTS };
}

/**
 * POST /api/products/import
 * Body: { csv: string } — first row must be headers, "name" and "price" required.
 * Creates products with source "CSV" + a computed opportunity score, and an
 * AffiliateLink when affiliateUrl is present.
 * Returns { created: n, skipped: [{ row, reason }] } (row 1 = header row).
 */
export async function POST(req: NextRequest) {
  let body: { csv?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.csv !== "string" || !body.csv.trim()) {
    return NextResponse.json({ error: "csv is required" }, { status: 400 });
  }

  const records = parseCsv(body.csv);
  if (records.length < 2) {
    return NextResponse.json(
      { error: "CSV needs a header row and at least one data row" },
      { status: 400 }
    );
  }

  // Map each column index → canonical field name (unknown columns are ignored).
  const columns = records[0].map((h) => HEADER_ALIASES[normalizeHeader(h)] ?? null);
  if (!columns.includes("name") || !columns.includes("price")) {
    return NextResponse.json(
      { error: 'CSV must include "name" and "price" columns' },
      { status: 400 }
    );
  }

  const weights = await loadWeights();
  let created = 0;
  const skipped: { row: number; reason: string }[] = [];

  for (let i = 1; i < records.length; i++) {
    const rowNumber = i + 1; // header = row 1
    const cells = records[i];
    if (cells.every((c) => c.trim() === "")) continue; // silently skip blank lines

    const record: Record<string, string> = {};
    columns.forEach((field, col) => {
      if (field && cells[col] !== undefined) record[field] = cells[col].trim();
    });

    const name = record.name ?? "";
    if (!name) {
      skipped.push({ row: rowNumber, reason: "missing name" });
      continue;
    }

    const priceRaw = (record.price ?? "").replace(/[฿,\s]/g, "");
    const price = Number(priceRaw);
    if (!priceRaw || !Number.isFinite(price) || price < 0) {
      skipped.push({ row: rowNumber, reason: priceRaw ? "invalid price" : "missing price" });
      continue;
    }

    const commissionRate = (() => {
      const n = Number((record.commissionRate ?? "").replace(/%/g, "").trim());
      return Number.isFinite(n) && n >= 0 ? n : 0;
    })();

    let platform = (record.platform ?? "").toUpperCase().replace(/[\s-]/g, "_");
    if (platform === "TIKTOK") platform = "TIKTOK_SHOP";
    if (!(PRODUCT_PLATFORMS as readonly string[]).includes(platform)) platform = "SHOPEE";

    const riskCategory = (record.riskCategory ?? "").toUpperCase().trim();
    const status = (record.status ?? "").toUpperCase().trim();

    const productData = {
      name,
      brand: record.brand || undefined,
      category: record.category || "General",
      description: record.description || undefined,
      price,
      commissionRate,
      platform,
      riskCategory: (RISK_CATEGORIES as readonly string[]).includes(riskCategory)
        ? riskCategory
        : "GENERAL",
      status: (PRODUCT_STATUSES as readonly string[]).includes(status) ? status : "WATCHLIST",
      isNewLaunch: parseBool(record.isNewLaunch),
      isKnownBrand: parseBool(record.isKnownBrand),
      isRising: parseBool(record.isRising),
      isSeasonal: parseBool(record.isSeasonal),
      isEvergreen: parseBool(record.isEvergreen),
      demandScore: parseScore(record.demandScore),
      trendScore: parseScore(record.trendScore),
      competitionScore: parseScore(record.competitionScore),
      contentDifficultyScore: parseScore(record.contentDifficultyScore),
      trustScore: parseScore(record.trustScore),
      tags: record.tags || undefined,
      notes: record.notes || undefined,
      productUrl: record.productUrl || undefined,
      source: "CSV",
    };

    const breakdown = computeOpportunityScore(productData, weights);
    const affiliateUrl = record.affiliateUrl || "";

    try {
      await db.product.create({
        data: {
          ...productData,
          opportunityScore: breakdown.total,
          opportunityScores: {
            create: {
              total: breakdown.total,
              trendMomentum: breakdown.trendMomentum,
              brandStrength: breakdown.brandStrength,
              commission: breakdown.commission,
              viralityPotential: breakdown.viralityPotential,
              competitionGap: breakdown.competitionGap,
              complianceSafety: breakdown.complianceSafety,
              weightsJson: JSON.stringify(weights),
              explanationJson: JSON.stringify(breakdown.explanations),
              isCurrent: true,
            },
          },
          affiliateLinks: affiliateUrl
            ? {
                create: {
                  platform: platform === "BOTH" ? "SHOPEE" : platform,
                  url: affiliateUrl,
                  label: "CSV import",
                },
              }
            : undefined,
        },
      });
      created++;
    } catch (error) {
      console.error(`CSV import: failed to create row ${rowNumber}`, error);
      skipped.push({ row: rowNumber, reason: "database error" });
    }
  }

  return NextResponse.json({ created, skipped });
}
