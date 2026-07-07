"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function RescoreButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function rescore() {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/rescore`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      toast.success("Opportunity score recalculated");
      router.refresh();
    } catch {
      toast.error("Could not recalculate the score");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full"
      onClick={rescore}
      disabled={loading}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
      Recalculate
    </Button>
  );
}
