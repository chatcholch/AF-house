import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";

/** Compact dashboard section wrapper: title + optional icon/hint/header action. */
export function SectionCard({
  title,
  icon: Icon,
  hint,
  action,
  children,
  className,
}: {
  title: string;
  icon?: LucideIcon;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("gap-4 py-5", className)}>
      <CardHeader className="px-5">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
          <span className="truncate">{title}</span>
        </CardTitle>
        {hint && <CardDescription className="text-xs">{hint}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className="flex-1 px-5">{children}</CardContent>
    </Card>
  );
}

/** Small "view all"-style header link used across dashboard sections. */
export function SectionLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
      <ArrowUpRight className="size-3.5" />
    </Link>
  );
}

/** Short relative timestamp for compact rows ("just now", "3h ago", "2d ago"). */
export function timeAgo(date: Date): string {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}
