"use client";

import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function NotesCard({
  productId,
  initialNotes,
}: {
  productId: string;
  initialNotes: string | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [savedNotes, setSavedNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);

  const dirty = notes !== savedNotes;

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setSavedNotes(notes);
      toast.success("Notes saved");
      router.refresh();
    } catch {
      toast.error("Could not save notes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
        <CardDescription>Private working notes for this product</CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Angle ideas, seller contacts, test results…"
          className="min-h-28"
        />
      </CardContent>
      <CardFooter className="justify-end">
        <Button type="button" size="sm" onClick={save} disabled={!dirty || saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? "Saving…" : "Save notes"}
        </Button>
      </CardFooter>
    </Card>
  );
}
