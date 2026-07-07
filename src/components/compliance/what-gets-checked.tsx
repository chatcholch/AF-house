import { Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const CHECK_ITEMS = [
  "Affiliate disclosure present",
  "Exaggerated / miracle claims",
  "Medical & treatment claims",
  "Weight-loss promises",
  "Skincare/beauty transformation claims",
  "Time-bound result promises",
  "Fake personal-experience framing for AI content",
  "Fake scarcity & stale price claims",
  "Aggressive CTAs",
  "Before/after safety",
  "“Results vary” softeners for risky categories",
];

export function WhatGetsChecked() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>What gets checked</CardTitle>
        <CardDescription>
          Rule-based scan in Thai and English — tuned to platform and FTC-style
          affiliate guidelines.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5">
          {CHECK_ITEMS.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
