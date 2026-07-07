"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plug2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/status-badge";
import { label } from "@/lib/types";

/** Masked integration credential shape passed from the server — never includes key values. */
export interface IntegrationInfo {
  provider: string;
  name: string;
  status: string;
  isActive: boolean;
  hasKey: boolean;
  keyHint: string | null;
  hasSecret: boolean;
}

const META: Record<string, { description: string; hint: string; keyLabel: string }> = {
  SHOPEE_AFFILIATE: {
    description:
      "Product feeds, offer data, affiliate links — official Shopee Affiliate Open API",
    hint: "Apply for Open API access in your Shopee Affiliate dashboard (affiliate.shopee.co.th) — App ID and Secret are issued there once approved.",
    keyLabel: "App ID",
  },
  TIKTOK_SHOP_AFFILIATE: {
    description: "Product & commission data — official TikTok Shop Affiliate API",
    hint: "Create an app in TikTok Shop Partner Center (partner.tiktokshop.com) to get an App Key and Secret for the Affiliate API.",
    keyLabel: "App Key",
  },
  FACEBOOK: {
    description: "Reels performance metrics for the Monitor tab — Meta Graph API",
    hint: "Create an app at developers.facebook.com, add the Pages / Instagram Graph products, then paste the App ID and Secret here.",
    keyLabel: "App ID",
  },
};

export function IntegrationCard({ integration }: { integration: IntegrationInfo }) {
  const router = useRouter();
  const meta = META[integration.provider] ?? {
    description: integration.name,
    hint: "See the provider's developer documentation.",
    keyLabel: "API key",
  };

  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [busy, setBusy] = useState(false);

  async function patch(body: Record<string, unknown>) {
    const res = await fetch("/api/integrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: integration.provider, ...body }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "Request failed");
    }
  }

  async function save() {
    const key = apiKey.trim();
    const secret = apiSecret.trim();
    if (!key && !secret) {
      toast.error(`Paste your ${meta.keyLabel} or secret first`);
      return;
    }
    setBusy(true);
    try {
      await patch({
        ...(key ? { apiKey: key } : {}),
        ...(secret ? { apiSecret: secret } : {}),
      });
      toast.success(`${label(integration.provider)} credentials saved`);
      setApiKey("");
      setApiSecret("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save credentials");
    } finally {
      setBusy(false);
    }
  }

  async function clearCredentials() {
    setBusy(true);
    try {
      await patch({ apiKey: "", apiSecret: "" });
      toast.success(`${label(integration.provider)} credentials cleared`);
      setApiKey("");
      setApiSecret("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not clear credentials");
    } finally {
      setBusy(false);
    }
  }

  function testConnection() {
    // Honest placeholder — no API client ships in v1.
    toast.info("API client not implemented in v1 — data stays on mock/manual");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{label(integration.provider)}</CardTitle>
        <CardDescription>{meta.description}</CardDescription>
        <CardAction>
          <StatusBadge status={integration.status} />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={`${integration.provider}-key`}>{meta.keyLabel}</Label>
          <Input
            id={`${integration.provider}-key`}
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={
              integration.hasKey && integration.keyHint
                ? `Saved ${integration.keyHint} — paste to replace`
                : `Paste your ${meta.keyLabel}`
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${integration.provider}-secret`}>Secret</Label>
          <Input
            id={`${integration.provider}-secret`}
            type="password"
            autoComplete="off"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            placeholder={integration.hasSecret ? "Saved — paste to replace" : "Paste your secret"}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
          <Button size="sm" variant="outline" onClick={testConnection}>
            <Plug2 className="size-3.5" />
            Test connection
          </Button>
          {integration.hasKey && (
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={clearCredentials}
              disabled={busy}
            >
              Clear
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Where to get this: {meta.hint}</p>
      </CardContent>
    </Card>
  );
}
