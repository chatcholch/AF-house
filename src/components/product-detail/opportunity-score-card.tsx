import type { OpportunityScore } from "@prisma/client";
import { Gauge } from "lucide-react";
import { RescoreButton } from "@/components/product-detail/rescore-button";
import { EmptyState } from "@/components/shared/empty-state";
import { ScoreBadge, ScoreBar } from "@/components/shared/score-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_WEIGHTS, type ScoringWeights } from "@/lib/scoring";
import type { ScoreExplanation } from "@/lib/types";
import { formatDate } from "@/lib/utils";

function parseJson<T>(json: string | null | undefined): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

const COMPONENTS: { key: keyof ScoringWeights; name: string }[] = [
  { key: "trendMomentum", name: "Trend momentum" },
  { key: "brandStrength", name: "Brand strength" },
  { key: "commission", name: "Commission" },
  { key: "viralityPotential", name: "Virality potential" },
  { key: "competitionGap", name: "Competition gap" },
  { key: "complianceSafety", name: "Compliance safety" },
];

export function OpportunityScoreCard({
  productId,
  score,
}: {
  productId: string;
  score: OpportunityScore | null;
}) {
  if (!score) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Opportunity score</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Gauge}
            title="Not scored yet"
            description="Run the scoring engine to get a weighted 0-100 opportunity score."
            action={<RescoreButton productId={productId} />}
          />
        </CardContent>
      </Card>
    );
  }

  const weights = parseJson<ScoringWeights>(score.weightsJson) ?? DEFAULT_WEIGHTS;
  const explanations = parseJson<ScoreExplanation[]>(score.explanationJson) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Opportunity score</CardTitle>
        <CardDescription>Computed {formatDate(score.computedAt)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-3">
          <ScoreBadge score={score.total} className="min-w-14 px-3 py-1.5 text-2xl" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{score.total} / 100</p>
            <p>Weighted across 6 components</p>
          </div>
        </div>

        <div className="space-y-3">
          {COMPONENTS.map(({ key, name }) => (
            <ScoreBar
              key={key}
              label={`${name} ${Math.round((weights[key] ?? 0) * 100)}%`}
              score={score[key]}
            />
          ))}
        </div>

        {explanations.length > 0 && (
          <>
            <Separator />
            <ul className="space-y-2">
              {explanations.map((exp, i) => (
                <li key={`${exp.component}-${i}`} className="text-xs">
                  <span className="font-medium">{exp.component}</span>{" "}
                  <span className="text-muted-foreground">— {exp.reason}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
      <CardFooter>
        <RescoreButton productId={productId} />
      </CardFooter>
    </Card>
  );
}
