"use client";

import { format } from "date-fns";
import { Check, ExternalLink, Save, Trophy, Upload, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { CopyButton } from "@/components/shared/copy-button";
import { PlatformBadge, StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { label } from "@/lib/types";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import {
  apiPatchCampaign,
  errorMessage,
  type CampaignResultRow,
  type CampaignRow,
} from "./types";

interface CampaignDetail {
  results: CampaignResultRow[];
  contentIdea: { id: string; title: string } | null;
  videoPrompt: { id: string; title: string } | null;
}

function toDateInput(iso: string | null | undefined): string {
  return iso ? format(new Date(iso), "yyyy-MM-dd") : "";
}

function CopyBlock({
  title,
  text,
  mono = false,
}: {
  title: string;
  text: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {title}
        </p>
        <CopyButton text={text} />
      </div>
      <div
        className={
          mono
            ? "rounded-md bg-muted/60 p-3 font-mono text-xs whitespace-pre-wrap"
            : "rounded-md bg-muted/60 p-3 text-sm whitespace-pre-wrap"
        }
      >
        {text}
      </div>
    </div>
  );
}

function FieldRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}

export function CampaignDetailSheet({
  campaign,
  onOpenChange,
}: {
  campaign: CampaignRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={!!campaign} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-2xl">
        {campaign && (
          // Keyed by id + updatedAt so a PATCH + router.refresh() re-initializes
          // the editable fields from fresh server data.
          <DetailBody key={`${campaign.id}-${campaign.updatedAt}`} campaign={campaign} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailBody({ campaign }: { campaign: CampaignRow }) {
  const router = useRouter();
  const [detail, setDetail] = useState<CampaignDetail | null>(null);
  const [saving, setSaving] = useState(false);

  // Editable fields, initialized from the (fresh) campaign row.
  const [scheduled, setScheduled] = useState(() => toDateInput(campaign.scheduledDate));
  const [posted, setPosted] = useState(() => toDateInput(campaign.postedDate));
  const [postUrl, setPostUrl] = useState(campaign.postUrl ?? "");
  const [notes, setNotes] = useState(campaign.notes ?? "");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/campaigns/${campaign.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { campaign: CampaignDetail } | null) => {
        if (!cancelled && data) setDetail(data.campaign);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [campaign.id]);

  async function patch(body: Record<string, unknown>, successMessage = "Saved") {
    setSaving(true);
    try {
      await apiPatchCampaign(campaign.id, body);
      toast.success(successMessage);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to save"));
    } finally {
      setSaving(false);
    }
  }

  const scheduledDirty = scheduled !== toDateInput(campaign.scheduledDate);
  const postedDirty = posted !== toDateInput(campaign.postedDate);
  const postUrlDirty = postUrl !== (campaign.postUrl ?? "");
  const notesDirty = notes !== (campaign.notes ?? "");

  const results = detail?.results ?? campaign.results;

  return (
    <>
      <SheetHeader className="border-b pr-12">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={campaign.status} />
          <PlatformBadge platform={campaign.platform} />
          {campaign.videoStyle && (
            <span className="text-xs text-muted-foreground">{label(campaign.videoStyle)}</span>
          )}
        </div>
        <SheetTitle className="text-lg leading-snug">{campaign.title}</SheetTitle>
        <SheetDescription>
          <Link
            href={`/radar/${campaign.productId}`}
            className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
          >
            {campaign.product.name}
            <ExternalLink className="size-3" />
          </Link>
          {campaign.persona && <> · Persona: {campaign.persona.name}</>}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-5 p-4">
        {/* Quick status actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={saving || campaign.status === "APPROVED"}
            onClick={() => patch({ status: "APPROVED" }, "Campaign approved")}
          >
            <Check className="size-3.5 text-emerald-500" /> Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={saving || campaign.status === "POSTED"}
            onClick={() => patch({ status: "POSTED" }, "Marked as posted")}
          >
            <Upload className="size-3.5 text-blue-500" /> Mark posted
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={saving || campaign.status === "WINNER"}
            onClick={() => patch({ status: "WINNER" }, "Marked as winner")}
          >
            <Trophy className="size-3.5 text-amber-500" /> Mark winner
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={saving || campaign.status === "FAILED"}
            onClick={() => patch({ status: "FAILED" }, "Marked as failed")}
          >
            <X className="size-3.5 text-red-500" /> Mark failed
          </Button>
        </div>

        <Separator />

        {/* Dates */}
        <FieldRow>
          <div className="space-y-1.5">
            <Label htmlFor="detail-scheduled" className="text-xs">
              Scheduled date
            </Label>
            <div className="flex gap-1.5">
              <Input
                id="detail-scheduled"
                type="date"
                value={scheduled}
                onChange={(e) => setScheduled(e.target.value)}
                className="h-8"
              />
              {scheduledDirty && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8"
                  disabled={saving}
                  onClick={() =>
                    patch(
                      { scheduledDate: scheduled ? new Date(scheduled).toISOString() : null },
                      "Schedule updated",
                    )
                  }
                >
                  <Save className="size-3.5" /> Save
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="detail-posted" className="text-xs">
              Posted date
            </Label>
            <div className="flex gap-1.5">
              <Input
                id="detail-posted"
                type="date"
                value={posted}
                onChange={(e) => setPosted(e.target.value)}
                className="h-8"
              />
              {postedDirty && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8"
                  disabled={saving}
                  onClick={() =>
                    patch(
                      { postedDate: posted ? new Date(posted).toISOString() : null },
                      "Posted date updated",
                    )
                  }
                >
                  <Save className="size-3.5" /> Save
                </Button>
              )}
            </div>
          </div>
        </FieldRow>

        {/* Post URL */}
        <div className="space-y-1.5">
          <Label htmlFor="detail-post-url" className="text-xs">
            Post URL
          </Label>
          <div className="flex gap-1.5">
            <Input
              id="detail-post-url"
              placeholder="https://…"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              className="h-8"
            />
            <Button
              size="sm"
              variant="secondary"
              className="h-8"
              disabled={saving || !postUrlDirty}
              onClick={() => patch({ postUrl: postUrl.trim() || null }, "Post URL saved")}
            >
              <Save className="size-3.5" /> Save
            </Button>
            {campaign.postUrl && (
              <Button asChild size="icon" variant="ghost" className="size-8 shrink-0">
                <a href={campaign.postUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5" />
                  <span className="sr-only">Open post</span>
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Content blocks */}
        {campaign.hookUsed && (
          <div className="flex items-start justify-between gap-2 rounded-md border border-l-2 border-l-primary bg-card p-3">
            <div>
              <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Hook
              </p>
              <p className="text-sm font-medium">{campaign.hookUsed}</p>
            </div>
            <CopyButton text={campaign.hookUsed} />
          </div>
        )}
        {campaign.scriptText && <CopyBlock title="Script" text={campaign.scriptText} />}
        {campaign.captionText && <CopyBlock title="Caption" text={campaign.captionText} />}
        {campaign.promptText && <CopyBlock title="Video prompt" text={campaign.promptText} mono />}

        {(detail?.contentIdea || detail?.videoPrompt) && (
          <p className="text-xs text-muted-foreground">
            {detail.contentIdea && <>Linked idea: {detail.contentIdea.title}</>}
            {detail.contentIdea && detail.videoPrompt && " · "}
            {detail.videoPrompt && <>Linked prompt: {detail.videoPrompt.title}</>}
          </p>
        )}

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="detail-notes" className="text-xs">
            Notes
          </Label>
          <Textarea
            id="detail-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal notes for this campaign…"
            rows={3}
          />
          <Button
            size="sm"
            variant="secondary"
            disabled={saving || !notesDirty}
            onClick={() => patch({ notes: notes.trim() || null }, "Notes saved")}
          >
            <Save className="size-3.5" /> Save notes
          </Button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Results
              </p>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link href="/monitor">
                  View in Monitor <ExternalLink className="size-3" />
                </Link>
              </Button>
            </div>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">GMV</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">
                        {r.periodLabel ?? formatDate(r.recordedAt)}
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums">
                        {formatNumber(r.views)}
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums">
                        {formatNumber(r.clicks)}
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums">
                        {formatNumber(r.orders)}
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums">
                        {formatCurrency(r.gmv)}
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums">
                        {formatCurrency(r.commission)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <p className="pb-2 text-[11px] text-muted-foreground">
          Created {formatDate(campaign.createdAt)} · Updated {formatDate(campaign.updatedAt)}
        </p>
      </div>
    </>
  );
}
