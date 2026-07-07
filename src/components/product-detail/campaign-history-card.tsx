import type { Campaign, CampaignResult } from "@prisma/client";
import { Megaphone, StickyNote } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PlatformBadge, StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate, formatNumber } from "@/lib/utils";

type CampaignWithResults = Campaign & { results: CampaignResult[] };

function latestResult(campaign: CampaignWithResults): CampaignResult | null {
  if (campaign.results.length === 0) return null;
  return [...campaign.results].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  )[0];
}

export function CampaignHistoryCard({ campaigns }: { campaigns: CampaignWithResults[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign history</CardTitle>
        <CardDescription>Every campaign created from this product</CardDescription>
        {campaigns.length > 0 && (
          <CardAction>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/campaigns">Open board</Link>
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {campaigns.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No campaigns yet"
            description="Turn a generated hook or script into a campaign on the Campaign Board."
            action={
              <Button asChild size="sm" variant="outline">
                <Link href="/campaigns">Go to Campaign Board</Link>
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Latest result</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => {
                  const result = latestResult(campaign);
                  const date = campaign.postedDate ?? campaign.scheduledDate;
                  const dateKind = campaign.postedDate
                    ? "Posted"
                    : campaign.scheduledDate
                      ? "Scheduled"
                      : null;
                  return (
                    <TableRow key={campaign.id}>
                      <TableCell className="max-w-64">
                        <Link
                          href="/campaigns"
                          className="block truncate text-sm font-medium hover:underline"
                        >
                          {campaign.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <PlatformBadge platform={campaign.platform} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={campaign.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {date ? (
                          <>
                            <span className="text-xs text-muted-foreground/70">{dateKind} </span>
                            {formatDate(date)}
                          </>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground tabular-nums">
                        {result ? (
                          <span>
                            {formatNumber(result.views)} views · {formatNumber(result.clicks)}{" "}
                            clicks · {formatNumber(result.orders)} orders
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {campaign.notes && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex cursor-default text-muted-foreground">
                                <StickyNote className="size-4" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-72">
                              {campaign.notes}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
