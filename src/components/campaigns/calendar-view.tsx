"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { label } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { STATUS_CHIP_STYLES, type CampaignRow } from "./types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_CHIPS = 3;

export function CalendarView({
  campaigns,
  onOpenDetail,
}: {
  campaigns: CampaignRow[];
  onOpenDetail: (campaign: CampaignRow) => void;
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
      }),
    [month],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, CampaignRow[]>();
    for (const c of campaigns) {
      const date = c.scheduledDate ?? c.postedDate;
      if (!date) continue;
      const key = format(new Date(date), "yyyy-MM-dd");
      const list = map.get(key);
      if (list) list.push(c);
      else map.set(key, [c]);
    }
    return map;
  }, [campaigns]);

  const undated = useMemo(
    () => campaigns.filter((c) => !c.scheduledDate && !c.postedDate).length,
    [campaigns],
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="min-w-36 text-base font-semibold tabular-nums">
          {format(month, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            <ChevronLeft className="size-4" />
            <span className="sr-only">Previous month</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight className="size-4" />
            <span className="sr-only">Next month</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setMonth(startOfMonth(new Date()))}
          >
            Today
          </Button>
        </div>
        {undated > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {undated} unscheduled campaign{undated === 1 ? "" : "s"} not shown
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="grid grid-cols-7 gap-px bg-border">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="bg-muted/60 px-2 py-1.5 text-center text-xs font-medium text-muted-foreground"
            >
              {d}
            </div>
          ))}
          {days.map((day) => {
            const inMonth = isSameMonth(day, month);
            const items = byDay.get(format(day, "yyyy-MM-dd")) ?? [];
            const today = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-28 space-y-1 bg-background p-1.5",
                  !inMonth && "bg-muted/40",
                )}
              >
                <div className="flex justify-end">
                  {today ? (
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground tabular-nums">
                      {format(day, "d")}
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "text-xs tabular-nums",
                        inMonth ? "text-muted-foreground" : "text-muted-foreground/40",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  )}
                </div>
                {items.slice(0, MAX_CHIPS).map((c) => (
                  <Tooltip key={c.id}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onOpenDetail(c)}
                        className={cn(
                          "block w-full truncate rounded border px-1.5 py-0.5 text-left text-[10px] leading-4 font-medium",
                          !inMonth && "opacity-60",
                          STATUS_CHIP_STYLES[c.status] ??
                            "bg-muted text-muted-foreground border-border",
                        )}
                      >
                        {c.title}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-72">
                      <p className="font-medium">{c.title}</p>
                      <p>{c.product.name}</p>
                      <p>
                        {label(c.status)} · {label(c.platform)}
                        {c.videoStyle ? ` · ${label(c.videoStyle)}` : ""}
                      </p>
                      <p>
                        {c.scheduledDate
                          ? `Scheduled ${formatDate(c.scheduledDate)}`
                          : c.postedDate
                            ? `Posted ${formatDate(c.postedDate)}`
                            : null}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {items.length > MAX_CHIPS && (
                  <div className="px-1 text-[10px] text-muted-foreground">
                    +{items.length - MAX_CHIPS} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
