"use client";

// "Save to Campaign Board" — posts the generated package to /api/campaigns.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CONTENT_PLATFORMS, label, type ContentPlatform } from "@/lib/types";
import {
  mapGeneratorStyle,
  type GenerateResult,
  type GenerationContext,
} from "./prompt-lab-client";

export function SaveCampaignDialog({
  result,
  context,
}: {
  result: GenerateResult;
  context: GenerationContext;
}) {
  const router = useRouter();
  const pkg = result.package;
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(
    `${context.product.name} — ${pkg.concepts[0]?.title ?? "Content package"}`
  );
  const [platform, setPlatform] = useState<ContentPlatform>(context.options.platform);
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const caption = pkg.captions[0];
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: context.product.id,
          contentIdeaId: result.contentIdeaId ?? undefined,
          personaId: context.personaId ?? undefined,
          platform,
          title,
          videoStyle: mapGeneratorStyle(context.options.style),
          hookUsed: pkg.hooks[0]?.text,
          scriptText: pkg.scripts[0]?.body,
          captionText: caption
            ? `${caption.text}\n\n${caption.hashtags.join(" ")}\n${caption.disclosure}`
            : undefined,
          promptText: pkg.showcasePrompt.compiledPrompt,
          status: "GENERATED",
          scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to save campaign");
      }
      toast.success("Saved to Campaign Board", {
        action: { label: "Open board", onClick: () => router.push("/campaigns") },
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save campaign");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          <FolderKanban className="size-4" />
          Save to Campaign Board
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to Campaign Board</DialogTitle>
          <DialogDescription>
            Creates a campaign card with the first hook, script, caption, and Veo prompt.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="campaign-title">Title</Label>
            <Input
              id="campaign-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as ContentPlatform)}>
                <SelectTrigger className="w-full" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {label(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="campaign-date">Scheduled date (optional)</Label>
              <Input
                id="campaign-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="h-8"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="campaign-notes">Notes (optional)</Label>
            <Textarea
              id="campaign-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything the reviewer should know…"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || !title.trim()}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save campaign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
