"use client";

import { CalendarDays, List, Plus, SquareKanban } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BoardView } from "./board-view";
import { CalendarView } from "./calendar-view";
import { CampaignDetailSheet } from "./campaign-detail-sheet";
import { CampaignFormDialog } from "./campaign-form-dialog";
import { ListView } from "./list-view";
import type { CampaignRow, Option } from "./types";

export function CampaignBoardClient({
  campaigns,
  products,
  personas,
}: {
  campaigns: CampaignRow[];
  products: Option[];
  personas: Option[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CampaignRow | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  // Resolve from the (fresh) list so router.refresh() updates the open sheet.
  const detailCampaign = detailId
    ? (campaigns.find((c) => c.id === detailId) ?? null)
    : null;

  const openDetail = (c: CampaignRow) => setDetailId(c.id);
  const openEdit = (c: CampaignRow) => setEditTarget(c);

  return (
    <div>
      <PageHeader
        title="Campaign Board"
        description="Plan, approve, and schedule every piece of content. Human approval required before posting."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> New campaign
          </Button>
        }
      />

      {campaigns.length === 0 ? (
        <EmptyState
          icon={SquareKanban}
          title="No campaigns yet"
          description="Create your first campaign to start planning and scheduling content."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> New campaign
            </Button>
          }
        />
      ) : (
        <Tabs defaultValue="board">
          <TabsList className="mb-2">
            <TabsTrigger value="board">
              <SquareKanban /> Board
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <CalendarDays /> Calendar
            </TabsTrigger>
            <TabsTrigger value="list">
              <List /> List
            </TabsTrigger>
          </TabsList>
          <TabsContent value="board">
            <BoardView campaigns={campaigns} onOpenDetail={openDetail} onEdit={openEdit} />
          </TabsContent>
          <TabsContent value="calendar">
            <CalendarView campaigns={campaigns} onOpenDetail={openDetail} />
          </TabsContent>
          <TabsContent value="list">
            <ListView campaigns={campaigns} onOpenDetail={openDetail} />
          </TabsContent>
        </Tabs>
      )}

      <CampaignFormDialog
        key={editTarget ? editTarget.id : `create-${createOpen}`}
        open={createOpen || !!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditTarget(null);
          }
        }}
        products={products}
        personas={personas}
        campaign={editTarget}
      />

      <CampaignDetailSheet
        campaign={detailCampaign}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
      />
    </div>
  );
}
