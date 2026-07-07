import Link from "next/link";
import { Eye, MousePointerClick, NotebookPen, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { formatNumber } from "@/lib/utils";
import { SectionCard, SectionLink, timeAgo } from "./section-card";

export interface PerformanceNote {
  id: string;
  campaignTitle: string;
  recordedAt: Date;
  views: number;
  clicks: number;
  orders: number;
  note: string;
}

export function PerformanceNotes({ notes }: { notes: PerformanceNote[] }) {
  return (
    <SectionCard
      title="Recent performance notes"
      icon={NotebookPen}
      hint="What you learned from the latest result check-ins"
      action={<SectionLink href="/monitor">Open monitor</SectionLink>}
    >
      {notes.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="No performance notes yet"
          description="Log results for posted campaigns in the Monitor and jot down what worked — notes show up here."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/monitor">Open Monitor</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {notes.map((note) => (
            <li key={note.id}>
              <Link
                href="/monitor"
                className="block rounded-lg border bg-muted/20 p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-medium">{note.campaignTitle}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {timeAgo(note.recordedAt)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {note.note}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs tabular-nums text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Eye className="size-3.5" />
                    {formatNumber(note.views)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MousePointerClick className="size-3.5" />
                    {formatNumber(note.clicks)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ShoppingBag className="size-3.5" />
                    {formatNumber(note.orders)} orders
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
