import { Info } from "lucide-react";
import { db } from "@/lib/db";
import { DEFAULT_WEIGHTS, type ScoringWeights } from "@/lib/scoring";
import { AI_PROVIDERS, type AiProviderName } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IntegrationCard, type IntegrationInfo } from "@/components/settings/integration-card";
import { AiProvidersCard } from "@/components/settings/ai-providers-card";
import { ScoringWeightsCard } from "@/components/settings/scoring-weights-card";
import { ImportProductsCard } from "@/components/settings/import-products-card";

export const dynamic = "force-dynamic";

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
}

// Strip secret values before anything crosses the server → client boundary.
function toInfo(provider: string, row: CredentialRow | undefined): IntegrationInfo {
  return {
    provider,
    name: row?.name ?? PROVIDER_NAMES[provider] ?? provider,
    status: row?.status ?? "NOT_CONFIGURED",
    isActive: row?.isActive ?? false,
    hasKey: Boolean(row?.apiKey),
    keyHint: row?.apiKey ? `••••${row.apiKey.slice(-4)}` : null,
    hasSecret: Boolean(row?.apiSecret),
  };
}

export default async function SettingsPage() {
  const [credentials, settings, productCount] = await Promise.all([
    db.integrationCredential.findMany(),
    db.appSetting.findMany({ where: { key: { in: ["scoringWeights", "aiProvider"] } } }),
    db.product.count(),
  ]);

  const byProvider = new Map(credentials.map((c) => [c.provider, c]));

  let scoringWeights: ScoringWeights = { ...DEFAULT_WEIGHTS };
  let aiProvider: AiProviderName = "mock";
  for (const row of settings) {
    try {
      const value = JSON.parse(row.valueJson);
      if (row.key === "scoringWeights" && value && typeof value === "object") {
        scoringWeights = { ...DEFAULT_WEIGHTS, ...value };
      }
      if (row.key === "aiProvider" && (AI_PROVIDERS as readonly string[]).includes(value)) {
        aiProvider = value as AiProviderName;
      }
    } catch {
      // malformed setting rows fall back to defaults
    }
  }

  const affiliateProviders = ["SHOPEE_AFFILIATE", "TIKTOK_SHOP_AFFILIATE", "FACEBOOK"] as const;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Integrations & Settings"
        description="Connect official APIs when you have credentials. Until then the app runs on mock data, CSV import, and manual entry."
      />

      <Alert>
        <Info />
        <AlertTitle>v1 uses official APIs, exports, and manual data only — no scraping.</AlertTitle>
        <AlertDescription>
          Keys are stored locally in your SQLite database; do not commit dev.db.
        </AlertDescription>
      </Alert>

      <section aria-labelledby="affiliate-platforms">
        <h2 id="affiliate-platforms" className="text-lg font-semibold tracking-tight">
          Affiliate platforms
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Official platform APIs only — add credentials once your affiliate account is approved
          for API access.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {affiliateProviders.map((provider) => (
            <IntegrationCard key={provider} integration={toInfo(provider, byProvider.get(provider))} />
          ))}
        </div>
      </section>

      <AiProvidersCard
        current={aiProvider}
        integrations={{
          OPENAI: toInfo("OPENAI", byProvider.get("OPENAI")),
          GEMINI: toInfo("GEMINI", byProvider.get("GEMINI")),
        }}
      />

      <ScoringWeightsCard initialWeights={scoringWeights} productCount={productCount} />

      <ImportProductsCard />
    </div>
  );
}
