"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { CAMPAIGN_STATUSES, CONTENT_PLATFORMS, label, VIDEO_STYLES } from "@/lib/types";
import { apiPatchCampaign, errorMessage, type CampaignRow, type Option } from "./types";

const NONE = "NONE";

export function CampaignFormDialog({
  open,
  onOpenChange,
  products,
  personas,
  campaign,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Option[];
  personas: Option[];
  /** When set the dialog edits this campaign; otherwise it creates a new one. */
  campaign?: CampaignRow | null;
}) {
  const router = useRouter();
  const isEdit = !!campaign;

  const [productId, setProductId] = useState(campaign?.productId ?? "");
  const [title, setTitle] = useState(campaign?.title ?? "");
  const [platform, setPlatform] = useState(campaign?.platform ?? "TIKTOK");
  const [videoStyle, setVideoStyle] = useState(campaign?.videoStyle ?? NONE);
  const [personaId, setPersonaId] = useState(campaign?.personaId ?? NONE);
  const [status, setStatus] = useState(campaign?.status ?? "IDEA");
  const [scheduledDate, setScheduledDate] = useState(
    campaign?.scheduledDate ? format(new Date(campaign.scheduledDate), "yyyy-MM-dd") : "",
  );
  const [notes, setNotes] = useState(campaign?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!productId) {
      toast.error("Select a product");
      return;
    }
    if (!title.trim()) {
      toast.error("Enter a campaign title");
      return;
    }
    const body = {
      productId,
      title: title.trim(),
      platform,
      videoStyle: videoStyle === NONE ? null : videoStyle,
      personaId: personaId === NONE ? null : personaId,
      status,
      scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null,
      notes: notes.trim() || null,
    };

    setSubmitting(true);
    try {
      if (isEdit && campaign) {
        await apiPatchCampaign(campaign.id, body);
        toast.success("Campaign updated");
      } else {
        const res = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error ?? "Failed to create campaign");
        }
        toast.success("Campaign created");
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, isEdit ? "Failed to update campaign" : "Failed to create campaign"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit campaign" : "New campaign"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the campaign details. Content stays in draft until you approve it."
              : "Plan a piece of content for a product. Nothing is published automatically — posting always needs your approval."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="cf-product">Product</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger id="cf-product" className="w-full">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="cf-title">Title</Label>
            <Input
              id="cf-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hook test — unboxing angle v1"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="cf-platform">Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="cf-platform" className="w-full">
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
            <div className="grid gap-1.5">
              <Label htmlFor="cf-style">Video style</Label>
              <Select value={videoStyle} onValueChange={setVideoStyle}>
                <SelectTrigger id="cf-style" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No style</SelectItem>
                  {VIDEO_STYLES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {label(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="cf-persona">Persona (optional)</Label>
              <Select value={personaId} onValueChange={setPersonaId}>
                <SelectTrigger id="cf-persona" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No persona</SelectItem>
                  {personas.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cf-status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="cf-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {label(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="cf-scheduled">Scheduled date</Label>
            <Input
              id="cf-scheduled"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="cf-notes">Notes</Label>
            <Textarea
              id="cf-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes (angle, deadline, learnings…)"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
                ? "Save changes"
                : "Create campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
