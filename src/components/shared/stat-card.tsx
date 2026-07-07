import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <Card className={cn("py-4", className)}>
      <CardContent className="flex items-start justify-between gap-2 px-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          {hint && <p className="mt-1 truncate text-xs text-muted-foreground/80">{hint}</p>}
        </div>
        {Icon && (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
