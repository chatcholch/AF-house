import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { PlatformBadge, StatusBadge } from "@/components/shared/status-badge";
import { SectionCard, SectionLink } from "./section-card";

export interface CalendarCampaign {
  id: string;
  title: string;
  platform: string;
  status: string;
  scheduledDate: Date;
}

const DAY_MS = 86_400_000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayLabel(date: Date): string {
  const diff = Math.round((startOfDay(date).getTime() - startOfDay(new Date()).getTime()) / DAY_MS);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function CampaignCalendar({ campaigns }: { campaigns: CalendarCampaign[] }) {
  // Campaigns arrive sorted ascending by scheduledDate; Map preserves insertion order.
  const days = new Map<string, CalendarCampaign[]>();
  for (const campaign of campaigns) {
    const key = startOfDay(campaign.scheduledDate).toISOString();
    const list = days.get(key);
    if (list) list.push(campaign);
    else days.set(key, [campaign]);
  }

  return (
    <SectionCard
      title="Campaign calendar — next 14 days"
      icon={CalendarDays}
      hint="Scheduled posts by day. Drafts only — you publish manually."
      action={<SectionLink href="/campaigns">Open board</SectionLink>}
    >
      {campaigns.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nothing scheduled in the next 14 days"
          description="Approve a draft and give it a scheduled date on the campaign board to build your posting calendar."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/campaigns">Open campaign board</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {[...days.entries()].map(([key, items]) => (
            <div key={key}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {dayLabel(items[0].scheduledDate)}
                <span className="ml-1.5 font-normal normal-case text-muted-foreground/70">
                  · {items.length} post{items.length === 1 ? "" : "s"}
                </span>
              </p>
              <ul className="space-y-1.5">
                {items.map((campaign) => (
                  <li key={campaign.id}>
                    <Link
                      href="/campaigns"
                      className="flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5 transition-colors hover:bg-muted/60"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {campaign.title}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <PlatformBadge
                          platform={campaign.platform}
                          className="hidden px-1.5 py-0 text-[10px] sm:inline-flex"
                        />
                        <StatusBadge status={campaign.status} className="px-1.5 py-0 text-[10px]" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
