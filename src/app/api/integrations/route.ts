import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { INTEGRATION_PROVIDERS } from "@/lib/types";

export const dynamic = "force-dynamic";

// Default display names used when a credential row does not exist yet
// (the seed creates all five, but PATCH upserts defensively).
const PROVIDER_NAMES: Record<string, string> = {
  SHOPEE_AFFILIATE: "Shopee Affiliate API",
  TIKTOK_SHOP_AFFILIATE: "TikTok Shop Affiliate API",
  FACEBOOK: "Facebook / Meta API",
  OPENAI: "OpenAI API",
  GEMINI: "Google Gemini API",
};

interface CredentialRow {
  provider: string;
  name: string;
  status: string;
  isActive: boolean;
  apiKey: string | null;
  apiSecret: string | null;
  lastTestedAt: Date | null;
}

// SECURITY: never return apiKey/apiSecret values — only booleans + a masked hint.
function serialize(row: CredentialRow) {
  return {
    provider: row.provider,
    name: row.name,
    status: row.status,
    isActive: row.isActive,
    hasKey: Boolean(row.apiKey),
    keyHint: row.apiKey ? `••••${row.apiKey.slice(-4)}` : null,
    hasSecret: Boolean(row.apiSecret),
    lastTestedAt: row.lastTestedAt ? row.lastTestedAt.toISOString() : null,
  };
}

/** GET /api/integrations — list all credentials (masked, no secret values). */
export async function GET() {
  const rows = await db.integrationCredential.findMany();
  const order = (p: string) => {
    const i = (INTEGRATION_PROVIDERS as readonly string[]).indexOf(p);
    return i === -1 ? INTEGRATION_PROVIDERS.length : i;
  };
  rows.sort((a, b) => order(a.provider) - order(b.provider));
  return NextResponse.json({ integrations: rows.map(serialize) });
}

/**
 * PATCH /api/integrations
 * Body: { provider, apiKey?, apiSecret?, extraJson?, isActive? }
 * Upserts by provider. Setting a non-empty apiKey marks the integration
 * CONFIGURED and active (unless isActive is explicitly false); clearing the
 * key (empty string / null) marks it NOT_CONFIGURED and inactive.
 */
export async function PATCH(req: NextRequest) {
  let body: {
    provider?: string;
    apiKey?: string | null;
    apiSecret?: string | null;
    extraJson?: string | null;
    isActive?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const provider = body.provider;
  if (!provider || !(INTEGRATION_PROVIDERS as readonly string[]).includes(provider)) {
    return NextResponse.json(
      { error: `provider must be one of: ${INTEGRATION_PROVIDERS.join(", ")}` },
      { status: 400 }
    );
  }

  const data: {
    apiKey?: string | null;
    apiSecret?: string | null;
    extraJson?: string | null;
    isActive?: boolean;
    status?: string;
  } = {};

  if (body.apiKey !== undefined) {
    const key = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    if (key) {
      data.apiKey = key;
      data.status = "CONFIGURED";
      data.isActive = body.isActive === false ? false : true;
    } else {
      data.apiKey = null;
      data.status = "NOT_CONFIGURED";
      data.isActive = false;
    }
  } else if (typeof body.isActive === "boolean") {
    data.isActive = body.isActive;
  }

  if (body.apiSecret !== undefined) {
    const secret = typeof body.apiSecret === "string" ? body.apiSecret.trim() : "";
    data.apiSecret = secret || null;
  }
  if (body.extraJson !== undefined) {
    data.extraJson =
      typeof body.extraJson === "string" && body.extraJson.trim() ? body.extraJson : null;
  }

  try {
    const row = await db.integrationCredential.upsert({
      where: { provider },
      update: data,
      create: {
        provider,
        name: PROVIDER_NAMES[provider] ?? provider,
        apiKey: data.apiKey ?? null,
        apiSecret: data.apiSecret ?? null,
        extraJson: data.extraJson ?? null,
        isActive: data.isActive ?? false,
        status: data.status ?? "NOT_CONFIGURED",
      },
    });
    return NextResponse.json({ integration: serialize(row) });
  } catch (error) {
    console.error("Failed to update integration credential", error);
    return NextResponse.json({ error: "Failed to update integration" }, { status: 500 });
  }
}
