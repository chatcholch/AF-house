import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { label } from "@/lib/types";
import { SectionCard, SectionLink, timeAgo } from "./section-card";

export interface QueueIdea {
  id: string;
  title: string;
  productName: string;
  status: string;
  generatedBy: string;
  createdAt: Date;
}

export function GenerationQueue({ ideas }: { ideas: QueueIdea[] }) {
  return (
    <SectionCard
      title="AI generation queue"
      icon={Sparkles}
      hint="Latest content ideas from the Prompt Lab"
      action={<SectionLink href="/prompt-lab">Open Prompt Lab</SectionLink>}
    >
      {ideas.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No generated content yet"
          description="Pick a product and generate hooks, scripts and captions in the Prompt Lab — drafts land here for review."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/prompt-lab">Generate content</Link>
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-border/60">
          {ideas.map((idea) => (
            <li key={idea.id}>
              <Link
                href="/prompt-lab"
                className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{idea.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {idea.productName} · {label(idea.generatedBy)} · {timeAgo(idea.createdAt)}
                  </p>
                </div>
                <StatusBadge status={idea.status} className="shrink-0 px-1.5 py-0 text-[10px]" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
