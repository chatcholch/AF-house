"use client";

// Bottom panel: latest generated ContentIdeas with inline approve / reject / delete.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Inbox, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { EmptyState } from "@/components/shared/empty-state";
import { PlatformBadge, StatusBadge } from "@/components/shared/status-badge";
import { label } from "@/lib/types";
import type { QueueIdea } from "./prompt-lab-client";

export function GenerationQueue({ ideas }: { ideas: QueueIdea[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function setStatus(id: string, status: "APPROVED" | "REJECTED") {
    setPendingId(id);
    try {
      const res = await fetch(`/api/content-ideas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Update failed");
      }
      toast.success(status === "APPROVED" ? "Idea approved" : "Idea rejected");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPendingId(null);
    }
  }

  async function remove(id: string) {
    setPendingId(id);
    try {
      const res = await fetch(`/api/content-ideas/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Delete failed");
      }
      toast.success("Idea deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Generation queue</CardTitle>
        <CardDescription>
          Latest generated packages — every draft needs a human approve/reject before use.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {ideas.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No generated content yet"
            description="Generate your first content package above — it will land here for review."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Style</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ideas.map((idea) => {
                  const busy = pendingId === idea.id;
                  return (
                    <TableRow key={idea.id}>
                      <TableCell className="max-w-44 truncate font-medium">
                        {idea.productName}
                      </TableCell>
                      <TableCell className="max-w-64 truncate text-muted-foreground">
                        {idea.title}
                      </TableCell>
                      <TableCell>
                        <PlatformBadge platform={idea.platform} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {label(idea.style)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={idea.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {label(idea.language)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {idea.createdAt}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-emerald-600 hover:text-emerald-600 dark:text-emerald-400"
                            disabled={busy || idea.status === "APPROVED"}
                            onClick={() => setStatus(idea.id, "APPROVED")}
                            title="Approve"
                          >
                            <Check className="size-3.5" />
                            Approve
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-muted-foreground"
                            disabled={busy || idea.status === "REJECTED"}
                            onClick={() => setStatus(idea.id, "REJECTED")}
                            title="Reject"
                          >
                            <X className="size-3.5" />
                            Reject
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-destructive"
                            disabled={busy}
                            onClick={() => remove(idea.id)}
                            title="Delete"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
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
