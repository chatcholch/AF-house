"use client";

import { StickyNote } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export interface NoteEntry {
  id: string;
  campaignTitle: string;
  recordedAt: string; // ISO
  note: string;
}

export function RecentNotesCard({ notes }: { notes: NoteEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent notes</CardTitle>
        <CardDescription>
          Observations logged with your latest result snapshots.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
            <StickyNote className="size-4 shrink-0" />
            No notes yet — add one when you log a result.
          </div>
        ) : (
          <ul className="space-y-3">
            {notes.map((n) => (
              <li key={n.id} className="rounded-md border p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-xs font-medium">
                    {n.campaignTitle}
                  </p>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(n.recordedAt)}
                  </p>
                </div>
                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                  {n.note}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
