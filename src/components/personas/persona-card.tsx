"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Mic,
  Pencil,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CopyButton } from "@/components/shared/copy-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  buildConsistencyBlock,
  personaAvatarClass,
  personaInitials,
  splitLines,
  type PersonaWithCounts,
} from "@/components/personas/persona-shared";

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="grid grid-cols-[64px_1fr] gap-2 text-sm">
      <span className="pt-px text-xs text-muted-foreground">{label}</span>
      <span className="leading-snug">{value}</span>
    </div>
  );
}

export function PersonaCard({
  persona,
  isLastPersona,
  onEdit,
}: {
  persona: PersonaWithCounts;
  isLastPersona: boolean;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [settingDefault, setSettingDefault] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const doItems = splitLines(persona.doList);
  const dontItems = splitLines(persona.dontList);
  const consistencyBlock = buildConsistencyBlock(persona);
  const { contentIdeas, videoPrompts, campaigns } = persona.counts;

  async function handleSetDefault() {
    setSettingDefault(true);
    try {
      const res = await fetch(`/api/personas/${persona.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Could not set default");
      }
      toast.success(`${persona.name} is now the default persona`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not set default");
    } finally {
      setSettingDefault(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/personas/${persona.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Could not delete persona");
      }
      toast.success(`Persona "${persona.name}" deleted`);
      setDeleteOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete persona");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="gap-4">
      <CardHeader className="gap-1">
        <div className="flex items-start gap-3">
          <Avatar className="size-11">
            <AvatarFallback
              className={cn("text-sm font-semibold", personaAvatarClass(persona.name))}
            >
              {personaInitials(persona.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold leading-none">{persona.name}</h3>
              {persona.isDefault && <Badge>Default</Badge>}
              <Badge variant="outline">Fictional</Badge>
            </div>
            {persona.ageRange && (
              <p className="mt-1.5 text-sm text-muted-foreground">{persona.ageRange}</p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <InfoRow label="Style" value={persona.style} />
          <InfoRow label="Voice" value={persona.voiceTone} />
        </div>

        {persona.personality && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{persona.personality}</p>
        )}

        {persona.speakingStyle && (
          <div className="flex items-start gap-2 rounded-md bg-muted/50 px-2.5 py-2 text-xs text-muted-foreground">
            <Mic className="mt-0.5 size-3.5 shrink-0" />
            <span className="line-clamp-2">{persona.speakingStyle}</span>
          </div>
        )}

        <p className="text-xs text-muted-foreground tabular-nums">
          Used in {contentIdeas} idea{contentIdeas === 1 ? "" : "s"} · {videoPrompts} prompt
          {videoPrompts === 1 ? "" : "s"} · {campaigns} campaign{campaigns === 1 ? "" : "s"}
        </p>

        {(doItems.length > 0 || dontItems.length > 0) && (
          <div>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {expanded ? (
                <ChevronUp className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
              Do / don&apos;t ({doItems.length + dontItems.length})
            </button>
            {expanded && (
              <div className="mt-2 grid gap-3 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-2">
                <ul className="space-y-1.5">
                  {doItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
                <ul className="space-y-1.5">
                  {dontItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <X className="mt-0.5 size-3.5 shrink-0 text-rose-500" />
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap items-center gap-1.5 border-t pt-4 [.border-t]:pt-4">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="size-3.5" />
          Edit
        </Button>
        {!persona.isDefault && (
          <Button variant="ghost" size="sm" onClick={handleSetDefault} disabled={settingDefault}>
            {settingDefault ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Star className="size-3.5" />
            )}
            Set default
          </Button>
        )}
        <CopyButton text={consistencyBlock} label="Copy Veo block" />
        <div className="ml-auto">
          {isLastPersona ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled
                    className="size-8 text-muted-foreground"
                    aria-label="Delete persona"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Keep at least one persona — create another before deleting this one</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteOpen(true)}
              className="size-8 text-muted-foreground hover:text-destructive"
              aria-label="Delete persona"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </CardFooter>

      <Dialog open={deleteOpen} onOpenChange={(next) => !deleting && setDeleteOpen(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete persona &quot;{persona.name}&quot;?</DialogTitle>
            <DialogDescription>
              Linked content is kept — {contentIdeas} idea{contentIdeas === 1 ? "" : "s"},{" "}
              {videoPrompts} video prompt{videoPrompts === 1 ? "" : "s"} and {campaigns} campaign
              {campaigns === 1 ? "" : "s"} will simply lose their persona reference.
              {persona.isDefault && " Another persona will become the default."} This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Delete persona
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
