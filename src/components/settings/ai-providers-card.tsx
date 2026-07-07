"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import type { AiProviderName } from "@/lib/types";
import type { IntegrationInfo } from "./integration-card";

interface AiOption {
  value: AiProviderName;
  title: string;
  subtitle: string;
  provider?: "OPENAI" | "GEMINI";
  keyPlaceholder?: string;
}

const OPTIONS: AiOption[] = [
  {
    value: "mock",
    title: "Mock (built-in)",
    subtitle: "Deterministic, offline — always available. Good enough to run the whole workflow.",
  },
  {
    value: "openai",
    title: "OpenAI",
    subtitle: "GPT models for hooks, scripts, captions and Veo prompts.",
    provider: "OPENAI",
    keyPlaceholder: "sk-…",
  },
  {
    value: "gemini",
    title: "Gemini",
    subtitle: "Google Gemini models for generation.",
    provider: "GEMINI",
    keyPlaceholder: "AIza…",
  },
];

export function AiProvidersCard({
  current,
  integrations,
}: {
  current: AiProviderName;
  integrations: { OPENAI: IntegrationInfo; GEMINI: IntegrationInfo };
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<AiProviderName>(current);
  const [keys, setKeys] = useState<{ OPENAI: string; GEMINI: string }>({ OPENAI: "", GEMINI: "" });
  const [savingKey, setSavingKey] = useState<"OPENAI" | "GEMINI" | null>(null);

  async function selectProvider(value: AiProviderName) {
    if (value === selected) return;
    const previous = selected;
    setSelected(value);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiProvider: value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Request failed");
      }
      toast.success(
        value === "mock" ? "AI provider set to Mock (built-in)" : `AI provider set to ${value === "openai" ? "OpenAI" : "Gemini"}`
      );
      router.refresh();
    } catch (error) {
      setSelected(previous);
      toast.error(error instanceof Error ? error.message : "Could not change AI provider");
    }
  }

  async function saveKey(provider: "OPENAI" | "GEMINI") {
    const key = keys[provider].trim();
    if (!key) {
      toast.error("Paste an API key first");
      return;
    }
    setSavingKey(provider);
    try {
      const res = await fetch("/api/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: key }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Request failed");
      }
      toast.success(`${provider === "OPENAI" ? "OpenAI" : "Gemini"} API key saved`);
      setKeys((k) => ({ ...k, [provider]: "" }));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save API key");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">AI providers</CardTitle>
        <CardDescription>
          Choose which engine generates hooks, scripts, captions and video prompts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div role="radiogroup" aria-label="AI provider" className="grid gap-4 lg:grid-cols-3">
          {OPTIONS.map((option) => {
            const checked = selected === option.value;
            const info = option.provider ? integrations[option.provider] : null;
            return (
              <div
                key={option.value}
                role="radio"
                aria-checked={checked}
                tabIndex={0}
                onClick={() => selectProvider(option.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectProvider(option.value);
                  }
                }}
                className={cn(
                  "cursor-pointer rounded-lg border bg-card p-4 outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  checked
                    ? "border-primary ring-1 ring-primary/40"
                    : "hover:border-muted-foreground/40"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={cn(
                        "size-4 shrink-0 rounded-full border",
                        checked ? "border-[5px] border-primary" : "border-muted-foreground/50"
                      )}
                    />
                    <span className="text-sm font-medium">{option.title}</span>
                  </div>
                  {info ? (
                    <StatusBadge status={info.status} />
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    >
                      Always available
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{option.subtitle}</p>
                {option.provider && info && (
                  <div className="mt-3 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                    <Label htmlFor={`${option.provider}-ai-key`} className="text-xs">
                      API key
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={`${option.provider}-ai-key`}
                        type="password"
                        autoComplete="off"
                        className="h-8"
                        value={keys[option.provider]}
                        onChange={(e) =>
                          setKeys((k) => ({ ...k, [option.provider as string]: e.target.value }))
                        }
                        onKeyDown={(e) => e.stopPropagation()}
                        placeholder={
                          info.hasKey && info.keyHint
                            ? `Saved ${info.keyHint}`
                            : option.keyPlaceholder
                        }
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        disabled={savingKey === option.provider}
                        onClick={() => saveKey(option.provider as "OPENAI" | "GEMINI")}
                      >
                        {savingKey === option.provider ? "Saving…" : "Save"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Env vars <code className="font-mono">OPENAI_API_KEY</code> /{" "}
          <code className="font-mono">GEMINI_API_KEY</code> also work and take priority over keys
          saved here. If no key is found, generation automatically falls back to the built-in mock
          provider.
        </p>
      </CardContent>
    </Card>
  );
}
