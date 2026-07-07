import type { ComplianceCheck } from "@prisma/client";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ComplianceFlag } from "@/lib/types";
import { formatDate } from "@/lib/utils";

function flagCount(check: ComplianceCheck): number {
  try {
    const flags = JSON.parse(check.flagsJson) as ComplianceFlag[];
    return Array.isArray(flags) ? flags.length : 0;
  } catch {
    return 0;
  }
}

export function ComplianceCard({ checks }: { checks: ComplianceCheck[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance</CardTitle>
        <CardDescription>Latest checks on content for this product</CardDescription>
      </CardHeader>
      <CardContent>
        {checks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center">
            <ShieldCheck className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No compliance checks run for this product yet.
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {checks.map((check) => {
              const flags = flagCount(check);
              return (
                <li
                  key={check.id}
                  className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-2">
                    <StatusBadge status={check.verdict} />
                    <span className="text-sm font-medium tabular-nums">{check.score}</span>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p className="tabular-nums">
                      {flags} flag{flags === 1 ? "" : "s"}
                    </p>
                    <p>{formatDate(check.checkedAt)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href="/compliance">
            <ShieldCheck className="size-4" />
            Open Compliance Check
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
