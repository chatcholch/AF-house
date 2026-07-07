"use client";

import {
  CalendarDays,
  Eye,
  MoreHorizontal,
  MousePointerClick,
  PanelRight,
  Pencil,
  ShoppingCart,
  StickyNote,
  Trash2,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlatformBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CAMPAIGN_STATUSES, label } from "@/lib/types";
import { cn, formatDate, formatNumber } from "@/lib/utils";
import {
  apiDeleteCampaign,
  apiPatchCampaign,
  errorMessage,
  STATUS_DOT,
  type CampaignRow,
} from "./types";

export function CampaignCard({
  campaign,
  onOpenDetail,
  onEdit,
}: {
  campaign: CampaignRow;
  onOpenDetail: (campaign: CampaignRow) => void;
  onEdit: (campaign: CampaignRow) => void;
}) {
  const router = useRouter();
  const latest = campaign.results[0];
  const date = campaign.postedDate ?? campaign.scheduledDate;

  async function moveTo(status: string) {
    try {
      await apiPatchCampaign(campaign.id, { status });
      toast.success(`Moved to ${label(status)}`);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to move campaign"));
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete campaign "${campaign.title}"? This cannot be undone.`)) return;
    try {
      await apiDeleteCampaign(campaign.id);
      toast.success("Campaign deleted");
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete campaign"));
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetail(campaign)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target === e.currentTarget) onOpenDetail(campaign);
      }}
      className="group cursor-pointer rounded-lg border bg-card p-3 shadow-xs transition-colors hover:border-ring/50"
    >
      <div className="flex items-start justify-between gap-1">
        <p className="line-clamp-2 text-sm leading-snug font-medium">{campaign.title}</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => e.stopPropagation()}
              className="-mt-1 -mr-1 size-6 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Campaign actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-44">
                {CAMPAIGN_STATUSES.map((status) => (
                  <DropdownMenuItem
                    key={status}
                    disabled={status === campaign.status}
                    onSelect={() => moveTo(status)}
                  >
                    <span className={cn("size-2 rounded-full", STATUS_DOT[status])} />
                    {label(status)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem onSelect={() => onEdit(campaign)}>
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onOpenDetail(campaign)}>
              <PanelRight /> Open details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={handleDelete}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="mt-0.5 truncate text-xs text-muted-foreground">{campaign.product.name}</p>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <PlatformBadge platform={campaign.platform} className="px-1.5 py-0 text-[10px]" />
        {campaign.videoStyle && (
          <span className="text-[11px] text-muted-foreground">{label(campaign.videoStyle)}</span>
        )}
      </div>

      {(date || campaign.persona) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {date && (
            <span className="inline-flex items-center gap-1 tabular-nums">
              <CalendarDays className="size-3" />
              {formatDate(date)}
            </span>
          )}
          {campaign.persona && (
            <span className="inline-flex max-w-32 items-center gap-1">
              <User className="size-3 shrink-0" />
              <span className="truncate">{campaign.persona.name}</span>
            </span>
          )}
        </div>
      )}

      {(latest || campaign.notes) && (
        <div className="mt-2 flex items-center gap-3 border-t pt-2 text-[11px] text-muted-foreground tabular-nums">
          {latest && (
            <>
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3" />
                {formatNumber(latest.views)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MousePointerClick className="size-3" />
                {formatNumber(latest.clicks)}
              </span>
              <span className="inline-flex items-center gap-1">
                <ShoppingCart className="size-3" />
                {formatNumber(latest.orders)}
              </span>
            </>
          )}
          {campaign.notes && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="ml-auto" onClick={(e) => e.stopPropagation()}>
                  <StickyNote className="size-3.5" />
                  <span className="sr-only">Notes</span>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-64 whitespace-pre-wrap">
                {campaign.notes}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
}
