"use client";

import { Check, Clapperboard, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CopyButton } from "@/components/shared/copy-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  buildConsistencyBlock,
  EMPTY_PERSONA_FORM,
  splitLines,
  type PersonaFormValues,
  type PersonaWithCounts,
} from "@/components/personas/persona-shared";

function Field({
  label,
  htmlFor,
  helper,
  children,
}: {
  label: string;
  htmlFor: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

export function PersonaEditor({
  open,
  onOpenChange,
  persona,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create a new persona */
  persona: PersonaWithCounts | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PersonaFormValues>(() =>
    persona
      ? {
          name: persona.name,
          ageRange: persona.ageRange,
          style: persona.style,
          voiceTone: persona.voiceTone,
          personality: persona.personality,
          clothingStyle: persona.clothingStyle,
          background: persona.background,
          cameraStyle: persona.cameraStyle,
          speakingStyle: persona.speakingStyle,
          visualDescription: persona.visualDescription,
          consistencyPrompt: persona.consistencyPrompt,
          doList: persona.doList,
          dontList: persona.dontList,
          brandSafeRules: persona.brandSafeRules,
          isDefault: persona.isDefault,
        }
      : EMPTY_PERSONA_FORM
  );

  function set<K extends keyof PersonaFormValues>(key: K, value: PersonaFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const previewBlock = useMemo(() => buildConsistencyBlock(form), [form]);

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Give the persona a name first");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(persona ? `/api/personas/${persona.id}` : "/api/personas", {
        method: persona ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Could not save persona");
      }
      toast.success(persona ? "Persona updated" : "Persona created");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save persona");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-2xl">
        <SheetHeader className="border-b">
          <SheetTitle>{persona ? `Edit persona — ${persona.name}` : "New persona"}</SheetTitle>
          <SheetDescription>
            Fictional AI presenter profile. Never describe a real person or celebrity.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
          {/* Identity */}
          <div className="space-y-4">
            <SectionTitle>Identity</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="persona-name">
                <Input
                  id="persona-name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Nara"
                />
              </Field>
              <Field label="Age range" htmlFor="persona-age">
                <Input
                  id="persona-age"
                  value={form.ageRange}
                  onChange={(e) => set("ageRange", e.target.value)}
                  placeholder="e.g. Early-to-mid 20s appearance"
                />
              </Field>
            </div>
            <Field label="Style" htmlFor="persona-style">
              <Input
                id="persona-style"
                value={form.style}
                onChange={(e) => set("style", e.target.value)}
                placeholder="e.g. Clean, minimal, approachable"
              />
            </Field>
            <Field label="Voice tone" htmlFor="persona-voice-tone">
              <Input
                id="persona-voice-tone"
                value={form.voiceTone}
                onChange={(e) => set("voiceTone", e.target.value)}
                placeholder="e.g. Warm, calm, friendly — never salesy"
              />
            </Field>
            <Field label="Personality" htmlFor="persona-personality">
              <Textarea
                id="persona-personality"
                value={form.personality}
                onChange={(e) => set("personality", e.target.value)}
                rows={3}
                placeholder="How the persona behaves and recommends products"
              />
            </Field>
          </div>

          <Separator />

          {/* Look & scene */}
          <div className="space-y-4">
            <SectionTitle>Look &amp; scene</SectionTitle>
            <Field label="Clothing style" htmlFor="persona-clothing">
              <Input
                id="persona-clothing"
                value={form.clothingStyle}
                onChange={(e) => set("clothingStyle", e.target.value)}
                placeholder="e.g. Plain soft-tone t-shirts, minimal accessories"
              />
            </Field>
            <Field label="Background" htmlFor="persona-background">
              <Input
                id="persona-background"
                value={form.background}
                onChange={(e) => set("background", e.target.value)}
                placeholder="e.g. Cozy, softly lit room corner with a small plant"
              />
            </Field>
            <Field label="Camera style" htmlFor="persona-camera">
              <Input
                id="persona-camera"
                value={form.cameraStyle}
                onChange={(e) => set("cameraStyle", e.target.value)}
                placeholder="e.g. Handheld selfie framing at chest-up"
              />
            </Field>
            <Field label="Speaking style" htmlFor="persona-speaking">
              <Textarea
                id="persona-speaking"
                value={form.speakingStyle}
                onChange={(e) => set("speakingStyle", e.target.value)}
                rows={3}
                placeholder="Language, pacing, sentence length, delivery quirks"
              />
            </Field>
          </div>

          <Separator />

          {/* Visual identity */}
          <div className="space-y-4">
            <SectionTitle>Visual identity</SectionTitle>
            <Field
              label="Visual description"
              htmlFor="persona-visual"
              helper="Physical description — must be fictional"
            >
              <Textarea
                id="persona-visual"
                value={form.visualDescription}
                onChange={(e) => set("visualDescription", e.target.value)}
                rows={4}
                placeholder="A fictional presenter: face, hair, skin tone, energy…"
              />
            </Field>
            <Field
              label="Consistency prompt"
              htmlFor="persona-consistency"
              helper="Paste-ready block that keeps the persona identical across videos"
            >
              <Textarea
                id="persona-consistency"
                value={form.consistencyPrompt}
                onChange={(e) => set("consistencyPrompt", e.target.value)}
                rows={4}
                placeholder="Same fictional presenter across all videos: identical facial features, hairstyle, styling…"
              />
            </Field>
          </div>

          <Separator />

          {/* Guardrails */}
          <div className="space-y-4">
            <SectionTitle>Guardrails</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Do" htmlFor="persona-do" helper="One rule per line">
                <Textarea
                  id="persona-do"
                  value={form.doList}
                  onChange={(e) => set("doList", e.target.value)}
                  rows={5}
                  placeholder={"Explain like a helpful friend\nShow the product clearly"}
                />
              </Field>
              <Field label="Don't" htmlFor="persona-dont" helper="One rule per line">
                <Textarea
                  id="persona-dont"
                  value={form.dontList}
                  onChange={(e) => set("dontList", e.target.value)}
                  rows={5}
                  placeholder={"Never hard-sell\nNever imitate a real person"}
                />
              </Field>
            </div>
            {(form.doList.trim() || form.dontList.trim()) && (
              <div className="grid gap-3 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-2">
                <ul className="space-y-1.5">
                  {splitLines(form.doList).map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <ul className="space-y-1.5">
                  {splitLines(form.dontList).map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <X className="mt-0.5 size-3.5 shrink-0 text-rose-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Field label="Brand-safe rules" htmlFor="persona-brand-safe">
              <Textarea
                id="persona-brand-safe"
                value={form.brandSafeRules}
                onChange={(e) => set("brandSafeRules", e.target.value)}
                rows={3}
                placeholder="e.g. Fictional persona only; conservative claims; disclosure always present"
              />
            </Field>
          </div>

          <Separator />

          {/* Default switch */}
          <div className="flex items-center justify-between gap-4 rounded-md border p-3">
            <div>
              <Label htmlFor="persona-default">Default persona</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Pre-selected in the Prompt Lab and generators. Only one persona can be default.
              </p>
            </div>
            <Switch
              id="persona-default"
              checked={form.isDefault}
              onCheckedChange={(checked) => set("isDefault", checked)}
            />
          </div>

          {/* Consistency preview */}
          <div className="space-y-2">
            <SectionTitle>Consistency preview</SectionTitle>
            <div className="rounded-md border bg-muted/30">
              <div className="flex items-center justify-between gap-2 border-b px-3 py-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Clapperboard className="size-3.5" />
                  Paste this block into a Veo prompt
                </div>
                <CopyButton text={previewBlock} label="Copy" />
              </div>
              <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap px-3 py-3 font-mono text-xs leading-relaxed text-muted-foreground">
                {previewBlock}
              </pre>
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row justify-end border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {persona ? "Save changes" : "Create persona"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
