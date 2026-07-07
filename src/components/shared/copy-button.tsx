"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyButton({
  text,
  label,
  className,
  size = "sm",
}: {
  text: string;
  label?: string;
  className?: string;
  size?: "sm" | "icon" | "default";
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy — select and copy manually");
    }
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      onClick={copy}
      className={cn("shrink-0 text-muted-foreground", className)}
    >
      {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
      {label && <span className="ml-1">{label}</span>}
    </Button>
  );
}
