"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Target,
  Frown,
  Activity,
  Monitor,
  Quote,
  Sparkles,
  Copy,
  Trash2,
  FileText,
  LayoutGrid,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspaceContext } from "@/stores/workspace-context";
import { useArtifactStore, usePersonas } from "@/stores/artifact-store";
import { personaToMarkdown } from "@/lib/artifact-to-markdown";
import { parsePersonaMarkdown } from "@/lib/markdown-to-artifact";
import { MarkdownDoc } from "@/components/editor/markdown-doc";
import type { PersonaArtifact } from "@/lib/artifact-types";

function getPersonaContent(persona: PersonaArtifact): string {
  if (persona.content != null && persona.content.trim()) return persona.content;
  return personaToMarkdown(persona);
}

export function PersonaCardsView({ projectId }: { projectId: string }) {
  const personas = usePersonas();
  const updateArtifact = useArtifactStore((s) => s.updateArtifact);
  const removeArtifact = useArtifactStore((s) => s.removeArtifact);
  const setAiPanelOpen = useWorkspaceContext((s) => s.setAiPanelOpen);
  const [viewMode, setViewMode] = useState<"card" | "markdown">("card");

  useEffect(() => {
    useWorkspaceContext.getState().setActiveView("personas");
  }, []);

  if (personas.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-6 py-[16px]">
          <h2 className="text-sm font-semibold">User Personas</h2>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center max-w-sm">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">No personas yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ask Hannibal to generate user personas for your product.
            </p>
            <button
              onClick={() => setAiPanelOpen(true)}
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Open AI Panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    const markdown = personas.map((p) => getPersonaContent(p)).join("\n\n---\n\n");
    navigator.clipboard.writeText(markdown);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-[16px] flex items-center justify-between">
        <h2 className="text-sm font-semibold">User Personas</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-border">
            <Button
              variant={viewMode === "card" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 rounded-r-none"
              onClick={() => setViewMode("card")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "markdown" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 rounded-l-none"
              onClick={() => setViewMode("markdown")}
            >
              <FileText className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="h-7" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5 mr-1" />
            Copy
          </Button>
          <Badge variant="secondary" className="text-xs">
            {personas.length} persona{personas.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {viewMode === "markdown" ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {personas.map((persona) => (
              <MarkdownDoc
                key={persona.id}
                value={getPersonaContent(persona)}
                onChange={(v) => updateArtifact(persona.id, { content: v } as Partial<PersonaArtifact>)}
                placeholder="Write persona markdown..."
                toolbarActions={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-destructive hover:text-destructive"
                    onClick={() => removeArtifact(persona.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                }
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl mx-auto">
            {personas.map((persona) => {
              const parsed = parsePersonaMarkdown(getPersonaContent(persona));
              return (
                <Card key={persona.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{parsed.name || persona.title}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {parsed.demographics}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeArtifact(persona.id)}
                          aria-label="Delete persona"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        {parsed.techProficiency && (
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            <Monitor className="h-3 w-3 mr-1" />
                            {parsed.techProficiency}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {parsed.quote && (
                      <div className="bg-muted/50 rounded-lg px-3 py-2">
                        <div className="flex items-start gap-2">
                          <Quote className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                          <p className="text-sm italic text-muted-foreground">
                            {parsed.quote}
                          </p>
                        </div>
                      </div>
                    )}

                    {parsed.goals.length > 0 && (
                      <PersonaList
                        icon={Target}
                        title="Goals"
                        items={parsed.goals}
                        color="text-green-400"
                        dotColor="bg-green-400"
                      />
                    )}

                    {parsed.frustrations.length > 0 && (
                      <PersonaList
                        icon={Frown}
                        title="Frustrations"
                        items={parsed.frustrations}
                        color="text-red-400"
                        dotColor="bg-red-400"
                      />
                    )}

                    {parsed.behaviors.length > 0 && (
                      <PersonaList
                        icon={Activity}
                        title="Behaviors"
                        items={parsed.behaviors}
                        color="text-blue-400"
                        dotColor="bg-blue-400"
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PersonaList({
  icon: Icon,
  title,
  items,
  color,
  dotColor,
}: {
  icon: React.ElementType;
  title: string;
  items: string[];
  color: string;
  dotColor: string;
}) {
  return (
    <div>
      <div className={`flex items-center gap-1.5 text-xs font-medium ${color} mb-1.5`}>
        <Icon className="h-3 w-3" />
        {title}
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm flex items-start gap-2">
            <span
              className={`mt-1.5 h-1.5 w-1.5 rounded-full ${dotColor} shrink-0`}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
