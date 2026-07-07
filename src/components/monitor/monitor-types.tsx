// Serialized (client-safe) shapes passed from the Monitor server page to
// the client components. Dates are ISO strings.

export interface ResultRow {
  id: string;
  campaignId: string;
  recordedAt: string; // ISO
  periodLabel: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  orders: number;
  gmv: number;
  commission: number;
  source: string; // MANUAL | API
  notes: string | null;
}

export interface CampaignRow {
  id: string;
  title: string;
  platform: string; // TIKTOK | SHOPEE_VIDEO | FACEBOOK | MULTI
  status: string; // POSTED | TESTING | WINNER | FAILED
  postedDate: string | null; // ISO
  productName: string;
  productCategory: string;
  personaName: string | null;
  /** All results for this campaign, ordered recordedAt desc (index 0 = latest). */
  results: ResultRow[];
}

export interface MonitorTotals {
  resultCount: number;
  views: number;
  clicks: number;
  orders: number;
  gmv: number;
  commission: number;
}

export interface CampaignOption {
  id: string;
  title: string;
  platform: string;
}
