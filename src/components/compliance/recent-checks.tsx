import { ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ScoreBadge } from "@/components/shared/score-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface RecentCheckItem {
  id: string;
  verdict: string;
  score: number;
  excerpt: string;
  checkedAt: string; // pre-formatted date string
  flagCount: number;
  productName: string | null;
  ideaTitle: string | null;
}

export function RecentChecks({ checks }: { checks: RecentCheckItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent checks</CardTitle>
        <CardDescription>The last {checks.length || ""} runs through the safety gate.</CardDescription>
      </CardHeader>
      <CardContent>
        {checks.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No checks yet"
            description="Run your first check on the left — every script and caption should pass here before approval."
          />
        ) : (
          <ul className="divide-y">
            {checks.map((check) => (
              <li key={check.id} className="space-y-1.5 py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={check.verdict} />
                  <ScoreBadge score={check.score} />
                  <span className="truncate text-xs font-medium">
                    {check.productName ?? "General"}
                  </span>
                  {check.ideaTitle && (
                    <span className="truncate text-xs text-muted-foreground">
                      · {check.ideaTitle}
                    </span>
                  )}
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {check.excerpt}
                </p>
                <p className="text-xs text-muted-foreground/70 tabular-nums">
                  {check.checkedAt} · {check.flagCount}{" "}
                  {check.flagCount === 1 ? "flag" : "flags"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
