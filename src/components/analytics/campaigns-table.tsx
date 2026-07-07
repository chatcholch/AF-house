import {
  Card,
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
import { PlatformBadge, StatusBadge } from "@/components/shared/status-badge";
import { label } from "@/lib/types";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

export interface CampaignPerfRow {
  id: string;
  title: string;
  productName: string;
  platform: string;
  videoStyle: string | null;
  personaName: string | null;
  status: string;
  views: number;
  engagementRate: number; // 0-1
  clicks: number;
  orders: number;
  cvr: number; // 0-1
  gmv: number;
  commission: number;
}

/** Full campaign performance table, sorted by commission desc. Server component. */
export function CampaignsTable({ rows }: { rows: CampaignPerfRow[] }) {
  return (
    <Card className="gap-4 py-5">
      <CardHeader className="px-5">
        <CardTitle className="text-sm font-semibold">All campaigns performance</CardTitle>
        <CardDescription className="text-xs">
          Every campaign with recorded results or a concluded test, sorted by commission.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Campaign</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Style</TableHead>
              <TableHead>Persona</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Eng. rate</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">CVR</TableHead>
              <TableHead className="text-right">GMV</TableHead>
              <TableHead className="text-right">Commission</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="max-w-56 truncate font-medium">{row.title}</TableCell>
                <TableCell className="max-w-48 truncate text-muted-foreground">
                  {row.productName}
                </TableCell>
                <TableCell>
                  <PlatformBadge platform={row.platform} />
                </TableCell>
                <TableCell className="max-w-44 truncate text-muted-foreground">
                  {label(row.videoStyle)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.personaName ?? "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.views)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPercent(row.engagementRate * 100, 1)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.clicks)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{row.orders}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPercent(row.cvr * 100, 1)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(row.gmv)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(row.commission)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
