"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
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
import { PlatformBadge } from "@/components/shared/status-badge";
import type { CampaignOption, ResultRow } from "./monitor-types";

interface FormState {
  campaignId: string;
  periodLabel: string;
  recordedAt: string; // yyyy-mm-dd
  views: string;
  likes: string;
  comments: string;
  shares: string;
  saves: string;
  clicks: string;
  orders: string;
  gmv: string;
  commission: string;
  notes: string;
}

const INT_FIELDS = [
  { key: "views", label: "Views" },
  { key: "likes", label: "Likes" },
  { key: "comments", label: "Comments" },
  { key: "shares", label: "Shares" },
  { key: "saves", label: "Saves" },
  { key: "clicks", label: "Clicks" },
  { key: "orders", label: "Orders" },
] as const;

const MONEY_FIELDS = [
  { key: "gmv", label: "GMV (THB)" },
  { key: "commission", label: "Commission (THB)" },
] as const;

function todayInput(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function toDateInput(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function parseIntSafe(value: string): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function parseFloatSafe(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function buildInitialState(
  editing: ResultRow | null | undefined,
  fixedCampaignId: string | undefined
): FormState {
  if (editing) {
    return {
      campaignId: editing.campaignId,
      periodLabel: editing.periodLabel ?? "",
      recordedAt: toDateInput(editing.recordedAt),
      views: String(editing.views),
      likes: String(editing.likes),
      comments: String(editing.comments),
      shares: String(editing.shares),
      saves: String(editing.saves),
      clicks: String(editing.clicks),
      orders: String(editing.orders),
      gmv: String(editing.gmv),
      commission: String(editing.commission),
      notes: editing.notes ?? "",
    };
  }
  return {
    campaignId: fixedCampaignId ?? "",
    periodLabel: "",
    recordedAt: todayInput(),
    views: "",
    likes: "",
    comments: "",
    shares: "",
    saves: "",
    clicks: "",
    orders: "",
    gmv: "",
    commission: "",
    notes: "",
  };
}

export function ResultDialog({
  open,
  onOpenChange,
  campaigns,
  fixedCampaignId,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaigns: CampaignOption[];
  /** When set (row "Add result" / edit), the campaign is fixed and not selectable. */
  fixedCampaignId?: string;
  editing?: ResultRow | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() =>
    buildInitialState(editing, fixedCampaignId)
  );
  const [submitting, setSubmitting] = useState(false);

  // Re-initialize the form whenever the dialog opens for a different target
  // (render-time state adjustment — see react.dev "You Might Not Need an Effect").
  const formKey = `${open}:${editing?.id ?? ""}:${fixedCampaignId ?? ""}`;
  const [prevFormKey, setPrevFormKey] = useState(formKey);
  if (prevFormKey !== formKey) {
    setPrevFormKey(formKey);
    if (open) setForm(buildInitialState(editing, fixedCampaignId));
  }

  const set = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isEdit = Boolean(editing);
  const campaignLocked = isEdit || Boolean(fixedCampaignId);
  const lockedCampaign = campaignLocked
    ? campaigns.find((c) => c.id === form.campaignId)
    : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.campaignId) {
      toast.error("Select a campaign first");
      return;
    }

    setSubmitting(true);
    try {
      const metrics = {
        views: parseIntSafe(form.views),
        likes: parseIntSafe(form.likes),
        comments: parseIntSafe(form.comments),
        shares: parseIntSafe(form.shares),
        saves: parseIntSafe(form.saves),
        clicks: parseIntSafe(form.clicks),
        orders: parseIntSafe(form.orders),
        gmv: parseFloatSafe(form.gmv),
        commission: parseFloatSafe(form.commission),
      };
      const recordedAt = form.recordedAt
        ? new Date(`${form.recordedAt}T12:00:00`).toISOString()
        : undefined;

      const res = await fetch(
        isEdit ? `/api/results/${editing!.id}` : "/api/results",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isEdit
              ? {
                  ...metrics,
                  periodLabel: form.periodLabel.trim() || null,
                  notes: form.notes.trim() || null,
                  ...(recordedAt ? { recordedAt } : {}),
                }
              : {
                  campaignId: form.campaignId,
                  ...metrics,
                  periodLabel: form.periodLabel.trim() || undefined,
                  notes: form.notes.trim() || undefined,
                  ...(recordedAt ? { recordedAt } : {}),
                }
          ),
        }
      );
      if (!res.ok) throw new Error("Request failed");

      toast.success(isEdit ? "Result updated" : "Result logged");
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error(
        isEdit ? "Failed to update result" : "Failed to log result"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit result" : "Add result"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this results snapshot."
              : "Log a manual results snapshot for a campaign. API sync can fill these automatically later."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="result-campaign">Campaign</Label>
            {campaignLocked ? (
              <div className="flex min-h-9 items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-sm">
                <span className="truncate">
                  {lockedCampaign?.title ?? "Selected campaign"}
                </span>
                {lockedCampaign && (
                  <PlatformBadge platform={lockedCampaign.platform} />
                )}
              </div>
            ) : (
              <Select
                value={form.campaignId}
                onValueChange={(v) => set("campaignId", v)}
              >
                <SelectTrigger id="result-campaign" className="w-full">
                  <SelectValue placeholder="Select a live campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="result-period">Period label</Label>
              <Input
                id="result-period"
                placeholder="e.g. Week 1"
                value={form.periodLabel}
                onChange={(e) => set("periodLabel", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="result-recorded">Recorded on</Label>
              <Input
                id="result-recorded"
                type="date"
                value={form.recordedAt}
                onChange={(e) => set("recordedAt", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {INT_FIELDS.map((f) => (
              <div key={f.key} className="space-y-2">
                <Label htmlFor={`result-${f.key}`}>{f.label}</Label>
                <Input
                  id={`result-${f.key}`}
                  type="number"
                  min={0}
                  step={1}
                  placeholder="0"
                  className="tabular-nums"
                  value={form[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              </div>
            ))}
            {MONEY_FIELDS.map((f) => (
              <div key={f.key} className="space-y-2">
                <Label htmlFor={`result-${f.key}`}>{f.label}</Label>
                <Input
                  id={`result-${f.key}`}
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  className="tabular-nums"
                  value={form[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="result-notes">Notes</Label>
            <Textarea
              id="result-notes"
              placeholder="What worked, what to try next…"
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Log result"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
