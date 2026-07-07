import { cn } from "@/lib/utils";

/** Colored 0-100 opportunity/compliance score pill. */
export function ScoreBadge({ score, className }: { score: number; className?: string }) {
  const tone =
    score >= 80
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
      : score >= 60
        ? "bg-lime-500/15 text-lime-600 dark:text-lime-400 border-lime-500/30"
        : score >= 40
          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
          : "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30";
  return (
    <span
      className={cn(
        "inline-flex min-w-10 items-center justify-center rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums",
        tone,
        className
      )}
    >
      {score}
    </span>
  );
}

/** Small horizontal score bar with label, for component-score breakdowns. */
export function ScoreBar({ label, score, hint }: { label: string; score: number; hint?: string }) {
  const color =
    score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-lime-500" : score >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{score}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${score}%` }} />
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground/80">{hint}</p>}
    </div>
  );
}
