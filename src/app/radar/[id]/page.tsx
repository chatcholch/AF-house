import { notFound } from "next/navigation";
import { AffiliateDataCard } from "@/components/product-detail/affiliate-data-card";
import { CampaignHistoryCard } from "@/components/product-detail/campaign-history-card";
import { ComplianceCard } from "@/components/product-detail/compliance-card";
import {
  GeneratedContentTabs,
  type CaptionRow,
  type IdeaRow,
  type ScriptRow,
  type VideoPromptRow,
} from "@/components/product-detail/generated-content-tabs";
import {
  AnglesWarningsCard,
  BuyerPersonasCard,
  PainPointsCard,
  WhyItMightSellCard,
} from "@/components/product-detail/insight-cards";
import { NotesCard } from "@/components/product-detail/notes-card";
import { OpportunityScoreCard } from "@/components/product-detail/opportunity-score-card";
import { ProductHeader } from "@/components/product-detail/product-header";
import { TrendSignalsCard } from "@/components/product-detail/trend-signals-card";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await db.product.findUnique({
    where: { id },
    include: {
      platformData: true,
      affiliateLinks: { orderBy: { createdAt: "desc" } },
      trendSignals: { orderBy: { detectedAt: "desc" } },
      opportunityScores: { where: { isCurrent: true }, take: 1 },
      contentIdeas: { include: { persona: true }, orderBy: { createdAt: "desc" } },
      scripts: { orderBy: { createdAt: "desc" }, take: 6 },
      captions: { orderBy: { createdAt: "desc" }, take: 6 },
      videoPrompts: { orderBy: { createdAt: "desc" }, take: 6 },
      campaigns: {
        include: { results: { orderBy: { recordedAt: "desc" } } },
        orderBy: { updatedAt: "desc" },
      },
      complianceChecks: { orderBy: { checkedAt: "desc" }, take: 5 },
    },
  });

  if (!product) notFound();

  const currentScore = product.opportunityScores[0] ?? null;

  // Serialized rows for the client-side tabs component.
  const ideas: IdeaRow[] = product.contentIdeas.map((idea) => ({
    id: idea.id,
    title: idea.title,
    hook: idea.hook,
    angle: idea.angle,
    status: idea.status,
    personaName: idea.persona?.name ?? null,
    language: idea.language,
  }));
  const scripts: ScriptRow[] = product.scripts.map((script) => ({
    id: script.id,
    title: script.title,
    hookLine: script.hookLine,
    body: script.body,
    durationSec: script.durationSec,
    language: script.language,
  }));
  const captions: CaptionRow[] = product.captions.map((caption) => ({
    id: caption.id,
    platform: caption.platform,
    text: caption.text,
    hashtags: caption.hashtags,
    disclosure: caption.disclosure,
  }));
  const videoPrompts: VideoPromptRow[] = product.videoPrompts.map((prompt) => ({
    id: prompt.id,
    title: prompt.title,
    promptType: prompt.promptType,
    compiledPrompt: prompt.compiledPrompt,
    negativePrompt: prompt.negativePrompt,
    durationSec: prompt.durationSec,
    aspectRatio: prompt.aspectRatio,
  }));

  return (
    <div className="space-y-6">
      <ProductHeader product={product} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 space-y-6 xl:col-span-2">
          <WhyItMightSellCard product={product} />
          <BuyerPersonasCard product={product} />
          <PainPointsCard product={product} />
          <AnglesWarningsCard product={product} />
          <GeneratedContentTabs
            productId={product.id}
            ideas={ideas}
            scripts={scripts}
            captions={captions}
            videoPrompts={videoPrompts}
          />
          <CampaignHistoryCard campaigns={product.campaigns} />
        </div>

        <div className="min-w-0 space-y-6">
          <OpportunityScoreCard productId={product.id} score={currentScore} />
          <AffiliateDataCard
            platformData={product.platformData}
            affiliateLinks={product.affiliateLinks}
          />
          <TrendSignalsCard signals={product.trendSignals} />
          <ComplianceCard checks={product.complianceChecks} />
          <NotesCard productId={product.id} initialNotes={product.notes} />
        </div>
      </div>
    </div>
  );
}
