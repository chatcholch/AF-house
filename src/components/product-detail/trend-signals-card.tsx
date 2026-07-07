import type { TrendSignal } from "@prisma/client";
import { TrendingUp } from "lucide-react";
import { ScoreBadge } from "@/components/shared/score-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { label } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function TrendSignalsCard({ signals }: { signals: TrendSignal[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trend signals</CardTitle>
        <CardDescription>Why this product is on the radar</CardDescription>
      </CardHeader>
      <CardContent>
        {signals.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center">
            <TrendingUp className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No trend signals detected yet.</p>
          </div>
        ) : (
          <ul className="relative space-y-4 border-l pl-4">
            {signals.map((signal) => (
              <li key={signal.id} className="relative">
                <span
                  className="absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-background bg-muted-foreground/50"
                  aria-hidden
                />
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="text-muted-foreground">
                    {label(signal.signalType)}
                  </Badge>
                  <ScoreBadge score={signal.strength} className="min-w-8 px-1.5 text-[11px]" />
                </div>
                {signal.note && (
                  <p className="mt-1 text-sm text-muted-foreground">{signal.note}</p>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground/70">
                  {formatDate(signal.detectedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
