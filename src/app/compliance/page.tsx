import { ComplianceChecker } from "@/components/compliance/compliance-checker";
import { RecentChecks, type RecentCheckItem } from "@/components/compliance/recent-checks";
import { WhatGetsChecked } from "@/components/compliance/what-gets-checked";
import { PageHeader } from "@/components/shared/page-header";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function flagCount(flagsJson: string): number {
  try {
    const parsed = JSON.parse(flagsJson);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export default async function CompliancePage() {
  const [checks, products] = await Promise.all([
    db.complianceCheck.findMany({
      take: 20,
      orderBy: { checkedAt: "desc" },
      include: {
        product: { select: { name: true, riskCategory: true } },
        contentIdea: { select: { title: true } },
      },
    }),
    db.product.findMany({
      select: { id: true, name: true, riskCategory: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const recentChecks: RecentCheckItem[] = checks.map((check) => ({
    id: check.id,
    verdict: check.verdict,
    score: check.score,
    excerpt:
      check.contentText.length > 80
        ? `${check.contentText.slice(0, 80)}…`
        : check.contentText,
    checkedAt: formatDate(check.checkedAt),
    flagCount: flagCount(check.flagsJson),
    productName: check.product?.name ?? null,
    ideaTitle: check.contentIdea?.title ?? null,
  }));

  return (
    <div>
      <PageHeader
        title="Compliance Check"
        description="Claim-safety and disclosure checker. Run every script and caption through here before approving."
      />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ComplianceChecker products={products} />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <WhatGetsChecked />
          <RecentChecks checks={recentChecks} />
        </div>
      </div>
    </div>
  );
}
