"use client";

// Right results area: compliance strip + tabbed content package
// (hooks / concepts / scripts / captions / video prompts / storyboard).

import { useState } from "react";
import {
  AlertTriangle,
  Clapperboard,
  Wand2,
} from "lucide-react";
import type { ShotListItem } from "@/lib/types";
import { label } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "@/components/shared/copy-button";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import { VideoPromptCard } from "./video-prompt-card";
import { SaveCampaignDialog } from "./save-campaign-dialog";
import type {
  ComplianceEntry,
  GenerateResult,
  GenerationContext,
} from "./prompt-lab-client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function targetLabel(target: string): string {
  const [kind, n] = target.split("-");
  return `${kind.charAt(0).toUpperCase()}${kind.slice(1)} ${n}`;
}

function storyboardText(shots: ShotListItem[]): string {
  return shots
    .map(
      (s) =>
        `Scene ${s.scene} [${s.timecode}]\n  Visual: ${s.visual}\n  Voiceover: ${s.voiceover}${
          s.onScreenText ? `\n  On-screen: ${s.onScreenText}` : ""
        }`
    )
    .join("\n\n");
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-sky-500",
};

function FlagList({ entry }: { entry: ComplianceEntry | undefined }) {
  if (!entry) return null;
  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Compliance
        </span>
        <StatusBadge status={entry.verdict} />
        <span className="text-xs text-muted-foreground tabular-nums">score {entry.score}</span>
      </div>
      {entry.flags.length === 0 ? (
        <p className="text-xs text-muted-foreground">No issues flagged.</p>
      ) : (
        <ul className="space-y-2">
          {entry.flags.map((f, i) => (
            <li key={`${f.ruleId}-${i}`} className="flex gap-2 text-xs">
              <span
                className={cn(
                  "mt-1 size-1.5 shrink-0 rounded-full",
                  SEVERITY_STYLES[f.severity] ?? "bg-muted-foreground"
                )}
              />
              <div className="min-w-0 space-y-0.5">
                <p className="font-medium">{f.message}</p>
                {f.excerpt && (
                  <p className="text-muted-foreground">
                    Found: <code className="rounded bg-muted px-1 py-0.5">{f.excerpt}</code>
                  </p>
                )}
                {f.suggestion && <p className="text-muted-foreground">Fix: {f.suggestion}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ShotListTable({ shots }: { shots: ShotListItem[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">Scene</TableHead>
            <TableHead className="w-24">Time</TableHead>
            <TableHead>Visual</TableHead>
            <TableHead>Voiceover</TableHead>
            <TableHead>On-screen text</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shots.map((s) => (
            <TableRow key={s.scene}>
              <TableCell className="tabular-nums">{s.scene}</TableCell>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                {s.timecode}
              </TableCell>
              <TableCell className="min-w-44 text-xs">{s.visual}</TableCell>
              <TableCell className="min-w-44 text-xs">{s.voiceover}</TableCell>
              <TableCell className="min-w-28 text-xs text-muted-foreground">
                {s.onScreenText ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state (before first generation)
// ---------------------------------------------------------------------------

const PACKAGE_ITEMS = [
  "10 hooks",
  "5 concepts",
  "3 scripts",
  "3 captions",
  "Hashtag sets",
  "Affiliate disclosure",
  "Veo video prompts",
  "Storyboard shot list",
];

function ResultsEmpty() {
  return (
    <EmptyState
      icon={Wand2}
      title="Your content package will appear here"
      description="Pick a product on the left and hit Generate. One click produces a complete, compliance-checked draft package ready to review, copy, and turn into a campaign."
      action={
        <div className="flex max-w-md flex-wrap justify-center gap-1.5">
          {PACKAGE_ITEMS.map((item) => (
            <Badge key={item} variant="secondary" className="font-normal">
              {item}
            </Badge>
          ))}
        </div>
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export function ResultsPanel({
  result,
  context,
}: {
  result: GenerateResult | null;
  context: GenerationContext | null;
}) {
  const [tab, setTab] = useState("hooks");
  const [scriptTab, setScriptTab] = useState("script-1");

  if (!result || !context) return <ResultsEmpty />;

  const pkg = result.package;
  const hasRisky = result.compliance.some(
    (c) => c.verdict === "RISKY" || c.verdict === "REJECT"
  );
  const complianceFor = (target: string) =>
    result.compliance.find((c) => c.target === target);

  function jumpTo(target: string) {
    if (target.startsWith("script")) {
      setTab("scripts");
      setScriptTab(target);
    } else {
      setTab("captions");
    }
  }

  const hooksAllText = pkg.hooks.map((h, i) => `${i + 1}. ${h.text}`).join("\n");

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Clapperboard className="size-4 text-muted-foreground" />
            Generated package
          </h2>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {context.product.name} · {label(context.options.style)} ·{" "}
            {label(context.options.language)} · {context.options.durationSec}s · Provider:{" "}
            {label(result.provider.toUpperCase())}
          </p>
        </div>
        <SaveCampaignDialog result={result} context={context} />
      </div>

      {/* Compliance summary strip */}
      <div className="flex flex-wrap items-center gap-2">
        {result.compliance.map((c) => (
          <button
            key={c.target}
            type="button"
            onClick={() => jumpTo(c.target)}
            className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors hover:bg-accent"
            title={`Jump to ${targetLabel(c.target)}`}
          >
            <span className="font-medium">{targetLabel(c.target)}</span>
            <StatusBadge status={c.verdict} />
            <span className="text-muted-foreground tabular-nums">{c.score}</span>
          </button>
        ))}
      </div>

      {hasRisky && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Review flagged lines before approving</AlertTitle>
          <AlertDescription>
            One or more assets were flagged as risky. Open the flagged script or caption and
            apply the suggested fixes before saving or approving.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start">
          <TabsTrigger value="hooks">Hooks</TabsTrigger>
          <TabsTrigger value="concepts">Concepts</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
          <TabsTrigger value="captions">Captions</TabsTrigger>
          <TabsTrigger value="prompts">Video Prompts</TabsTrigger>
          <TabsTrigger value="storyboard">Storyboard</TabsTrigger>
        </TabsList>

        {/* ------------------------------ Hooks ------------------------------ */}
        <TabsContent value="hooks">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">10 scroll-stopping hooks</CardTitle>
              <CardDescription>
                First 1–2 seconds of the video. Mix hook types across test videos.
              </CardDescription>
              <CardAction>
                <CopyButton text={hooksAllText} label="Copy all" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <ol className="divide-y">
                {pkg.hooks.map((h, i) => (
                  <li key={i} className="flex items-center gap-3 py-2">
                    <span className="w-5 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                      {i + 1}
                    </span>
                    <Badge variant="outline" className="shrink-0 capitalize">
                      {h.type}
                    </Badge>
                    <p className="min-w-0 flex-1 text-sm">{h.text}</p>
                    <CopyButton text={h.text} />
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----------------------------- Concepts ---------------------------- */}
        <TabsContent value="concepts">
          <div className="grid gap-3 lg:grid-cols-2">
            {pkg.concepts.map((c, i) => (
              <Card key={i} className="min-w-0">
                <CardHeader>
                  <CardTitle className="text-sm">{c.title}</CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline">{c.angle}</Badge>
                    <span>Suggested style: {label(c.suggestedStyle)}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{c.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ----------------------------- Scripts ----------------------------- */}
        <TabsContent value="scripts">
          <Tabs value={scriptTab} onValueChange={setScriptTab}>
            <TabsList>
              {pkg.scripts.map((_, i) => (
                <TabsTrigger key={i} value={`script-${i + 1}`}>
                  Script {i + 1}
                </TabsTrigger>
              ))}
            </TabsList>
            {pkg.scripts.map((s, i) => {
              const entry = complianceFor(`script-${i + 1}`);
              const fullScript = `${s.title} (${s.durationSec}s)\n\nHook: ${s.hookLine}\n\n${s.body}\n\nCTA: ${s.cta}`;
              return (
                <TabsContent key={i} value={`script-${i + 1}`}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                        {s.title}
                        <Badge variant="outline" className="tabular-nums">
                          {s.durationSec}s
                        </Badge>
                        {entry && <StatusBadge status={entry.verdict} />}
                      </CardTitle>
                      <CardAction>
                        <CopyButton text={fullScript} label="Copy script" />
                      </CardAction>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-md border-l-2 border-primary bg-primary/5 px-3 py-2">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Hook
                        </p>
                        <p className="text-sm font-medium">{s.hookLine}</p>
                      </div>

                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Script body
                          </p>
                          <CopyButton text={s.body} />
                        </div>
                        <pre className="whitespace-pre-wrap rounded-md border bg-muted/50 p-3 font-mono text-xs leading-relaxed">
                          {s.body}
                        </pre>
                      </div>

                      <div>
                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Storyboard
                        </p>
                        <ShotListTable shots={s.shotList} />
                      </div>

                      <p className="text-sm">
                        <span className="font-medium">CTA:</span>{" "}
                        <span className="text-muted-foreground">{s.cta}</span>
                      </p>

                      <FlagList entry={entry} />
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </TabsContent>

        {/* ----------------------------- Captions ---------------------------- */}
        <TabsContent value="captions">
          <div className="space-y-3">
            {pkg.captions.map((c, i) => {
              const entry = complianceFor(`caption-${i + 1}`);
              const fullCaption = `${c.text}\n\n${c.hashtags.join(" ")}\n${c.disclosure}`;
              return (
                <Card key={i} className="min-w-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      Caption {i + 1}
                      {entry && <StatusBadge status={entry.verdict} />}
                    </CardTitle>
                    <CardAction>
                      <CopyButton text={fullCaption} label="Copy all" />
                    </CardAction>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="whitespace-pre-wrap text-sm">{c.text}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.hashtags.map((h) => (
                        <Badge key={h} variant="secondary" className="font-normal">
                          {h}
                        </Badge>
                      ))}
                    </div>
                    <div className="rounded-md border bg-muted/50 px-3 py-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Disclosure (always included)
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{c.disclosure}</p>
                    </div>
                    <FlagList entry={entry} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* --------------------------- Video prompts ------------------------- */}
        <TabsContent value="prompts">
          <div className="grid min-w-0 gap-4 2xl:grid-cols-2">
            <VideoPromptCard heading="Product showcase prompt" prompt={pkg.showcasePrompt} />
            {pkg.personaPrompt ? (
              <VideoPromptCard heading="Persona prompt" prompt={pkg.personaPrompt} />
            ) : (
              <Card className="flex items-center justify-center border-dashed">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No persona prompt — turn on “Include AI persona” in the generator to add a
                  fictional persona talking-head prompt.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ----------------------------- Storyboard -------------------------- */}
        <TabsContent value="storyboard">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Storyboard</CardTitle>
              <CardDescription>
                Scene-by-scene shot list for the primary script — export it for your editor or
                Veo prompt sequencing.
              </CardDescription>
              <CardAction>
                <CopyButton text={storyboardText(pkg.storyboard)} label="Copy as text" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <ShotListTable shots={pkg.storyboard} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
