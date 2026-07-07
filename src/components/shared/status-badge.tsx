import { Badge } from "@/components/ui/badge";
import { label } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  // Product statuses
  WATCHLIST: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  TEST: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
  ACTIVE: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  REJECTED: "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400 border-zinc-500/30",
  WINNER: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  // Campaign statuses
  IDEA: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
  GENERATED: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  NEEDS_REVIEW: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  APPROVED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  POSTED: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  TESTING: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
  FAILED: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  ARCHIVED: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  // Content statuses
  DRAFT: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
  USED: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  // Compliance verdicts
  SAFE: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  RISKY: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  REJECT: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  // Integration statuses
  NOT_CONFIGURED: "bg-zinc-500/15 text-zinc-500 border-zinc-500/30",
  CONFIGURED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  ERROR: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[status] ?? "", className)}>
      {label(status)}
    </Badge>
  );
}

const PLATFORM_STYLES: Record<string, string> = {
  SHOPEE: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  TIKTOK_SHOP: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30",
  BOTH: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
  TIKTOK: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30",
  SHOPEE_VIDEO: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  FACEBOOK: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  MULTI: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
};

export function PlatformBadge({ platform, className }: { platform: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn(PLATFORM_STYLES[platform] ?? "", className)}>
      {label(platform)}
    </Badge>
  );
}
