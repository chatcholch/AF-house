import Link from "next/link";
import { CheckCircle2, ChevronRight, ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { label } from "@/lib/types";
import { SectionCard, SectionLink, timeAgo } from "./section-card";

export interface ApprovalIdea {
  id: string;
  title: string;
  productName: string;
  style: string;
  language: string;
  createdAt: Date;
}

export interface ApprovalCampaign {
  id: string;
  title: string;
  productName: string;
  platform: string;
  createdAt: Date;
}

type QueueItem = {
  key: string;
  kind: "idea" | "campaign";
  title: string;
  meta: string;
  href: string;
  createdAt: Date;
};

export function ApprovalQueue({
  ideas,
  campaigns,
  totalIdeas,
  totalCampaigns,
}: {
  ideas: ApprovalIdea[];
  campaigns: ApprovalCampaign[];
  totalIdeas: number;
  totalCampaigns: number;
}) {
  const items: QueueItem[] = [
    ...ideas.map<QueueItem>((idea) => ({
      key: `idea-${idea.id}`,
      kind: "idea",
      title: idea.title,
      meta: `${idea.productName} · ${label(idea.style)} · ${label(idea.language)} · ${timeAgo(idea.createdAt)}`,
      href: "/prompt-lab",
      createdAt: idea.createdAt,
    })),
    ...campaigns.map<QueueItem>((campaign) => ({
      key: `campaign-${campaign.id}`,
      kind: "campaign",
      title: campaign.title,
      meta: `${campaign.productName} · ${label(campaign.platform)} · ${timeAgo(campaign.createdAt)}`,
      href: "/campaigns",
      createdAt: campaign.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8);

  const total = totalIdeas + totalCampaigns;

  return (
    <SectionCard
      title="Awaiting your approval"
      icon={ClipboardCheck}
      hint={
        total > 0
          ? `${totalIdeas} content idea${totalIdeas === 1 ? "" : "s"} · ${totalCampaigns} campaign${totalCampaigns === 1 ? "" : "s"} — nothing goes live without you`
          : "Nothing goes live without your sign-off"
      }
      action={<SectionLink href="/campaigns">Review all</SectionLink>}
    >
      {items.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All caught up"
          description="No drafts are waiting for review. Generate fresh content in the Prompt Lab to keep the pipeline full."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/prompt-lab">Open Prompt Lab</Link>
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className="group -mx-2 flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/60"
              >
                <Badge
                  variant="outline"
                  className={
                    item.kind === "idea"
                      ? "shrink-0 border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-[10px] text-amber-600 dark:text-amber-400"
                      : "shrink-0 border-sky-500/30 bg-sky-500/10 px-1.5 py-0 text-[10px] text-sky-600 dark:text-sky-400"
                  }
                >
                  {item.kind === "idea" ? "Idea" : "Campaign"}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.meta}</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
