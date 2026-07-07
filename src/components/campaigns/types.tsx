// Shared types + helpers for the Campaign Board client components.
// Campaigns are serialized in the server page (dates → ISO strings).

export interface CampaignResultRow {
  id: string;
  recordedAt: string;
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
}

export interface CampaignRow {
  id: string;
  productId: string;
  contentIdeaId: string | null;
  videoPromptId: string | null;
  personaId: string | null;
  platform: string;
  title: string;
  videoStyle: string | null;
  hookUsed: string | null;
  scriptText: string | null;
  captionText: string | null;
  promptText: string | null;
  status: string;
  scheduledDate: string | null;
  postedDate: string | null;
  postUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  product: { id: string; name: string };
  persona: { id: string; name: string } | null;
  /** Latest result only (recordedAt desc, take 1) on the board page. */
  results: CampaignResultRow[];
}

export interface Option {
  id: string;
  name: string;
}

// Mirrors the StatusBadge palette as tiny calendar chips.
export const STATUS_CHIP_STYLES: Record<string, string> = {
  IDEA: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
  GENERATED: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  NEEDS_REVIEW: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  APPROVED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  POSTED: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  TESTING: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
  WINNER: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  FAILED: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  ARCHIVED: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};

export const STATUS_DOT: Record<string, string> = {
  IDEA: "bg-zinc-400",
  GENERATED: "bg-sky-500",
  NEEDS_REVIEW: "bg-amber-500",
  APPROVED: "bg-emerald-500",
  POSTED: "bg-blue-500",
  TESTING: "bg-violet-500",
  WINNER: "bg-amber-400",
  FAILED: "bg-red-500",
  ARCHIVED: "bg-zinc-500",
};

async function parseError(res: Response, fallback: string): Promise<string> {
  const data = (await res.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? fallback;
}

export async function apiPatchCampaign(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/campaigns/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res, "Failed to update campaign"));
  return (await res.json()) as { campaign: unknown };
}

export async function apiDeleteCampaign(id: string) {
  const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await parseError(res, "Failed to delete campaign"));
}

export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}
