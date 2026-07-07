import { CopyButton } from "@/components/shared/copy-button";
import { cn, formatNumber, formatPercent } from "@/lib/utils";

export interface HookRow {
  id: string;
  hook: string;
  campaignTitle: string;
  productName: string;
  orders: number;
  cvr: number; // 0-1
  views: number;
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-14 text-right">
      <p className="text-sm font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
    </div>
  );
}

/** Ranked list of the hooks that actually drove orders. Server component. */
export function HookLeaderboard({ rows }: { rows: HookRow[] }) {
  return (
    <div className="divide-y">
      {rows.map((row, i) => (
        <div key={row.id} className="flex flex-wrap items-start gap-3 py-3 first:pt-0 last:pb-0">
          <div
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-md text-sm font-semibold tabular-nums",
              i === 0
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "bg-muted text-muted-foreground",
            )}
          >
            {i + 1}
          </div>
          <div className="min-w-0 flex-1 basis-64">
            <div className="flex items-start gap-1">
              <p className="min-w-0 text-sm leading-snug font-medium">
                <span className="text-muted-foreground">&ldquo;</span>
                {row.hook}
                <span className="text-muted-foreground">&rdquo;</span>
              </p>
              <CopyButton text={row.hook} className="-my-1.5 size-7 p-0" size="icon" />
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {row.campaignTitle} · {row.productName}
            </p>
          </div>
          <div className="ml-auto flex shrink-0 items-start gap-5 pt-0.5">
            <Metric value={String(row.orders)} label="Orders" />
            <Metric value={formatPercent(row.cvr * 100, 1)} label="CVR" />
            <Metric value={formatNumber(row.views)} label="Views" />
          </div>
        </div>
      ))}
    </div>
  );
}
