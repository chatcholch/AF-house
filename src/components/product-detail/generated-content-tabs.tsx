"use client";

import {
  Captions,
  ChevronDown,
  ChevronUp,
  Clapperboard,
  FileText,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CopyButton } from "@/components/shared/copy-button";
import { EmptyState } from "@/components/shared/empty-state";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { label } from "@/lib/types";

export interface IdeaRow {
  id: string;
  title: string;
  hook: string | null;
  angle: string;
  status: string;
  personaName: string | null;
  language: string;
}

export interface ScriptRow {
  id: string;
  title: string;
  hookLine: string | null;
  body: string;
  durationSec: number;
  language: string;
}

export interface CaptionRow {
  id: string;
  platform: string;
  text: string;
  hashtags: string | null;
  disclosure: string;
}

export interface VideoPromptRow {
  id: string;
  title: string;
  promptType: string;
  compiledPrompt: string;
  negativePrompt: string | null;
  durationSec: number;
  aspectRatio: string;
}

function TabEmpty({ productId, what }: { productId: string; what: string }) {
  return (
    <EmptyState
      icon={Sparkles}
      title={`No ${what} yet`}
      description={`Generate ${what} for this product in the Prompt Lab.`}
      action={
        <Button asChild size="sm" variant="outline">
          <Link href={`/prompt-lab?productId=${productId}`}>
            <Sparkles className="size-4" />
            Open Prompt Lab
          </Link>
        </Button>
      }
    />
  );
}

function ScriptItem({ script }: { script: ScriptRow }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">{script.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {script.durationSec}s · {label(script.language)}
          </p>
        </div>
        <CopyButton text={script.body} label="Copy script" />
      </div>
      {script.hookLine && (
        <p className="mt-2 text-sm italic text-muted-foreground">“{script.hookLine}”</p>
      )}
      <p
        className={`mt-2 text-sm whitespace-pre-line text-muted-foreground ${expanded ? "" : "line-clamp-3"}`}
      >
        {script.body}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-1 -ml-2 h-7 text-xs text-muted-foreground"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        {expanded ? "Show less" : "Show full script"}
      </Button>
    </div>
  );
}

export function GeneratedContentTabs({
  productId,
  ideas,
  scripts,
  captions,
  videoPrompts,
}: {
  productId: string;
  ideas: IdeaRow[];
  scripts: ScriptRow[];
  captions: CaptionRow[];
  videoPrompts: VideoPromptRow[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generated content</CardTitle>
        <CardDescription>
          Hooks, scripts, captions and video prompts already generated for this product
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ideas">
          <TabsList className="w-full max-w-full overflow-x-auto sm:w-fit">
            <TabsTrigger value="ideas">
              <Lightbulb className="size-4" />
              Hooks/Ideas ({ideas.length})
            </TabsTrigger>
            <TabsTrigger value="scripts">
              <FileText className="size-4" />
              Scripts ({scripts.length})
            </TabsTrigger>
            <TabsTrigger value="captions">
              <Captions className="size-4" />
              Captions ({captions.length})
            </TabsTrigger>
            <TabsTrigger value="prompts">
              <Clapperboard className="size-4" />
              Video prompts ({videoPrompts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ideas" className="mt-2">
            {ideas.length === 0 ? (
              <TabEmpty productId={productId} what="hooks or ideas" />
            ) : (
              <ul className="space-y-3">
                {ideas.map((idea) => (
                  <li key={idea.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{idea.title}</p>
                        {idea.hook && <p className="mt-1 text-sm">“{idea.hook}”</p>}
                        <p className="mt-1 text-xs text-muted-foreground">{idea.angle}</p>
                      </div>
                      {idea.hook && <CopyButton text={idea.hook} label="Copy hook" />}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={idea.status} />
                      {idea.personaName && (
                        <Badge variant="outline" className="text-muted-foreground">
                          {idea.personaName}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-muted-foreground">
                        {label(idea.language)}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="scripts" className="mt-2">
            {scripts.length === 0 ? (
              <TabEmpty productId={productId} what="scripts" />
            ) : (
              <div className="space-y-3">
                {scripts.map((script) => (
                  <ScriptItem key={script.id} script={script} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="captions" className="mt-2">
            {captions.length === 0 ? (
              <TabEmpty productId={productId} what="captions" />
            ) : (
              <ul className="space-y-3">
                {captions.map((caption) => {
                  const fullText = [caption.text, caption.hashtags, caption.disclosure]
                    .filter(Boolean)
                    .join("\n\n");
                  return (
                    <li key={caption.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 space-y-2">
                          <p className="text-sm whitespace-pre-line">{caption.text}</p>
                          {caption.hashtags && (
                            <p className="text-xs break-words text-sky-600 dark:text-sky-400">
                              {caption.hashtags}
                            </p>
                          )}
                          <p className="text-xs italic text-muted-foreground">
                            {caption.disclosure}
                          </p>
                        </div>
                        <CopyButton text={fullText} label="Copy" />
                      </div>
                      <div className="mt-2">
                        <Badge variant="outline" className="text-muted-foreground">
                          {label(caption.platform)}
                        </Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="prompts" className="mt-2">
            {videoPrompts.length === 0 ? (
              <TabEmpty productId={productId} what="video prompts" />
            ) : (
              <ul className="space-y-3">
                {videoPrompts.map((prompt) => (
                  <li key={prompt.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{prompt.title}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="text-muted-foreground">
                            {label(prompt.promptType)}
                          </Badge>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {prompt.durationSec}s · {prompt.aspectRatio}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <CopyButton text={prompt.compiledPrompt} label="Copy prompt" />
                        {prompt.negativePrompt && (
                          <CopyButton
                            text={prompt.negativePrompt}
                            label="Negative"
                            className="text-xs"
                          />
                        )}
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                      {prompt.compiledPrompt}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
