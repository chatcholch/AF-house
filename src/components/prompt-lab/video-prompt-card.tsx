"use client";

// Structured Gemini/Veo prompt card: definition-list sections + compiled
// prompt + negative prompt, each with one-click copy.

import type { GeneratedVideoPrompt } from "@/lib/ai/provider";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CopyButton } from "@/components/shared/copy-button";
import { label } from "@/lib/types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </dt>
      <dd className="mt-0.5 text-sm leading-snug">{children}</dd>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items?.length) return <span className="text-muted-foreground">—</span>;
  return (
    <ul className="list-disc space-y-0.5 pl-4">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function VideoPromptCard({
  heading,
  prompt,
}: {
  heading: string;
  prompt: GeneratedVideoPrompt;
}) {
  const s = prompt.sections;
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="text-base">{heading}</CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">{label(prompt.promptType)}</Badge>
          <Badge variant="outline">Veo · 9:16</Badge>
          <span className="truncate">{prompt.title}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="max-h-96 space-y-3 overflow-y-auto rounded-md border bg-muted/30 p-3">
          <Section title="Objective">{s.objective}</Section>
          <Section title="Product">{s.product}</Section>
          <Section title="Target buyer">{s.targetBuyer}</Section>
          <Section title="Format">{s.videoFormat}</Section>
          <Section title="Scene sequence">
            <ol className="list-decimal space-y-0.5 pl-4">
              {s.sceneSequence.map((scene, i) => (
                <li key={i}>{scene}</li>
              ))}
            </ol>
          </Section>
          <Section title="Camera">{s.cameraMovement}</Section>
          <Section title="Lighting">{s.lighting}</Section>
          <Section title="Background">{s.background}</Section>
          {s.personaDescription && <Section title="Persona">{s.personaDescription}</Section>}
          {s.wardrobe && <Section title="Wardrobe">{s.wardrobe}</Section>}
          <Section title="Product handling">{s.productHandling}</Section>
          <Section title="On-screen text">
            <BulletList items={s.onScreenText} />
          </Section>
          <Section title="Voiceover">{s.voiceover}</Section>
          <Section title="Audio / music">{s.audioMusicDirection}</Section>
          <Section title="Visual style">{s.visualStyle}</Section>
          <Section title="Must include">
            <BulletList items={s.mustInclude} />
          </Section>
          <Section title="Must avoid">
            <BulletList items={s.mustAvoid} />
          </Section>
          <Section title="Brand safety">
            <BulletList items={s.brandSafetyNotes} />
          </Section>
          <Section title="Disclosure placement">{s.disclosurePlacement}</Section>
          <Section title="Final CTA">{s.finalCta}</Section>
        </dl>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Compiled prompt
            </p>
            <CopyButton text={prompt.compiledPrompt} label="Copy prompt" size="default" />
          </div>
          <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/50 p-3 font-mono text-xs leading-relaxed">
            {prompt.compiledPrompt}
          </pre>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Negative prompt / avoid list
            </p>
            <CopyButton text={prompt.negativePrompt} label="Copy" />
          </div>
          <pre className="whitespace-pre-wrap rounded-md border bg-muted/50 p-3 font-mono text-xs leading-relaxed">
            {prompt.negativePrompt}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
