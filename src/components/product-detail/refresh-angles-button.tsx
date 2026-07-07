"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function RefreshAnglesButton({
  productId,
  label = "Refresh angles",
  variant = "outline",
  size = "sm",
}: {
  productId: string;
  label?: string;
  variant?: "outline" | "default" | "secondary" | "ghost";
  size?: "sm" | "default";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/angles`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      toast.success("Angles refreshed", {
        description: "Why-it-might-sell, personas and pain points were regenerated.",
      });
      router.refresh();
    } catch {
      toast.error("Could not refresh angles");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant={variant} size={size} onClick={refresh} disabled={loading}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
      {label}
    </Button>
  );
}
