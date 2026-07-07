import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ScoreBadge } from "@/components/shared/score-badge";
import { SectionCard, SectionLink } from "./section-card";

export interface OpportunityRow {
  id: string;
  name: string;
  score: number;
  /** Pre-formatted metric relevant to the list (e.g. "Trend 92", "4d since launch", "15% commission"). */
  metric: string;
}

export function OpportunityListCard({
  title,
  icon,
  hint,
  rows,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  icon: LucideIcon;
  hint?: string;
  rows: OpportunityRow[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <SectionCard title={title} icon={icon} hint={hint} action={<SectionLink href="/radar">Radar</SectionLink>}>
      {rows.length === 0 ? (
        <EmptyState
          icon={icon}
          title={emptyTitle}
          description={emptyDescription}
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/radar">Open Product Radar</Link>
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-border/60">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/radar/${row.id}`}
                className="group -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium group-hover:text-foreground">{row.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.metric}</p>
                </div>
                <ScoreBadge score={row.score} className="shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
