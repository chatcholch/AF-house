"use client";

import { Plus, ShieldCheck, UsersRound } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PersonaCard } from "@/components/personas/persona-card";
import { PersonaEditor } from "@/components/personas/persona-editor";
import type { PersonaWithCounts } from "@/components/personas/persona-shared";

export function PersonaStudio({ personas }: { personas: PersonaWithCounts[] }) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PersonaWithCounts | null>(null);

  function openNew() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(persona: PersonaWithCounts) {
    setEditing(persona);
    setEditorOpen(true);
  }

  return (
    <>
      <PageHeader
        title="Persona Studio"
        description="Reusable fictional AI presenters. Same face, same voice, every video."
        actions={
          <Button onClick={openNew}>
            <Plus className="size-4" />
            New persona
          </Button>
        }
      />

      <Alert className="mb-6 border-sky-500/40 bg-sky-500/5 [&>svg]:text-sky-600 dark:[&>svg]:text-sky-400">
        <ShieldCheck />
        <AlertTitle>Fictional presenters only</AlertTitle>
        <AlertDescription>
          All personas are fictional. Never use a real person&apos;s name, face, likeness, or any
          celebrity reference. Disclose AI-generated presenters where required.
        </AlertDescription>
      </Alert>

      {personas.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="Create your first fictional presenter"
          description="A persona locks the presenter's face, voice, and style so every video looks like the same trusted creator."
          action={
            <Button onClick={openNew}>
              <Plus className="size-4" />
              New persona
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {personas.map((persona) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              isLastPersona={personas.length === 1}
              onEdit={() => openEdit(persona)}
            />
          ))}
        </div>
      )}

      <PersonaEditor
        key={editing?.id ?? "new"}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        persona={editing}
      />
    </>
  );
}
