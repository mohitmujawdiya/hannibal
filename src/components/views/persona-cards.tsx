"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Target,
  Frown,
  Activity,
  Monitor,
  Quote,
  StickyNote,
  Sparkles,
  Copy,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceContext } from "@/stores/workspace-context";
import { useProjectPersonas } from "@/hooks/use-project-data";
import { parsePersonaMarkdown } from "@/lib/markdown-to-artifact";
import type { ParsedPersona } from "@/lib/markdown-to-artifact";

function buildPersonaMarkdown(fields: ParsedPersona): string {
  const parts: string[] = [
    `## ${fields.name}`,
    `**Demographics:** ${fields.demographics}`,
    `**Tech Proficiency:** ${fields.techProficiency}`,
    fields.quote ? `> ${fields.quote}` : "",
  ].filter(Boolean);
  if (fields.goals.length > 0) {
    parts.push(`**Goals:**\n${fields.goals.map((g) => `- ${g}`).join("\n")}`);
  }
  if (fields.frustrations.length > 0) {
    parts.push(`**Frustrations:**\n${fields.frustrations.map((f) => `- ${f}`).join("\n")}`);
  }
  if (fields.behaviors.length > 0) {
    parts.push(`**Behaviors:**\n${fields.behaviors.map((b) => `- ${b}`).join("\n")}`);
  }
  if (fields.notes?.trim()) {
    parts.push(`**Notes:**\n${fields.notes}`);
  }
  return parts.join("\n\n");
}

function linesToList(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.replace(/^-\s*/, "").trim())
    .filter(Boolean);
}

function listToLines(items: string[]): string {
  return items.join("\n");
}

export function PersonaCardsView({ projectId }: { projectId: string }) {
  const { data: personas, isLoading, update, remove } = useProjectPersonas(projectId);
  const setAiPanelOpen = useWorkspaceContext((s) => s.setAiPanelOpen);
  const aiPanelOpen = useWorkspaceContext((s) => s.aiPanelOpen);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    useWorkspaceContext.getState().setActiveView("personas");
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-6 h-12 flex items-center">
          <h2 className="text-base font-semibold">User Personas</h2>
        </div>
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl mx-auto">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (personas.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-6 h-12 flex items-center">
          <h2 className="text-base font-semibold">User Personas</h2>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center max-w-sm">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">No personas yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ask Hannibal to generate user personas for your product.
            </p>
            {!aiPanelOpen && (
              <Button variant="outline" size="sm" onClick={() => setAiPanelOpen(true)}>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Open AI Panel
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const getCopyText = () => personas.map((p) => p.content ?? "").join("\n\n---\n\n");

  const handleSave = (personaId: string, fields: ParsedPersona) => {
    const content = buildPersonaMarkdown(fields);
    update({ id: personaId, name: fields.name, content });
    setEditingId(null);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 h-12 flex items-center justify-between">
        <h2 className="text-base font-semibold">User Personas</h2>
        <div className="flex items-center gap-2">
          <CopyButton getText={getCopyText} />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl mx-auto">
            {personas.map((persona) => {
              const parsed = parsePersonaMarkdown(persona.content ?? "");
              const isEditing = editingId === persona.id;

              if (isEditing) {
                return (
                  <EditPersonaCard
                    key={persona.id}
                    persona={persona}
                    parsed={parsed}
                    onSave={(fields) => handleSave(persona.id, fields)}
                    onCancel={() => setEditingId(null)}
                  />
                );
              }

              return (
                <Card key={persona.id} className="overflow-hidden gap-2">
                  <CardHeader className="pb-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{persona.name || parsed.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {parsed.demographics}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {parsed.techProficiency && (
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            <Monitor className="h-3 w-3 mr-1" />
                            {parsed.techProficiency}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => setEditingId(persona.id)}
                          aria-label="Edit persona"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => navigator.clipboard.writeText(persona.content ?? "")}
                          aria-label="Copy persona as markdown"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(persona.id)}
                          aria-label="Delete persona"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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

                    {parsed.notes && (
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                          <StickyNote className="h-3 w-3" />
                          Notes
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-3">{parsed.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
      </div>
    </div>
  );
}

function EditPersonaCard({
  persona,
  parsed,
  onSave,
  onCancel,
}: {
  persona: { id: string; name: string; content: string | null };
  parsed: ParsedPersona;
  onSave: (fields: ParsedPersona) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(persona.name || parsed.name);
  const [demographics, setDemographics] = useState(parsed.demographics);
  const [techProficiency, setTechProficiency] = useState(parsed.techProficiency);
  const [quote, setQuote] = useState(parsed.quote);
  const [goals, setGoals] = useState(listToLines(parsed.goals));
  const [frustrations, setFrustrations] = useState(listToLines(parsed.frustrations));
  const [behaviors, setBehaviors] = useState(listToLines(parsed.behaviors));
  const [notes, setNotes] = useState(parsed.notes);

  const handleSave = () => {
    onSave({
      name,
      demographics,
      techProficiency,
      quote,
      goals: linesToList(goals),
      frustrations: linesToList(frustrations),
      behaviors: linesToList(behaviors),
      notes,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <Card className="overflow-hidden gap-2 ring-1 ring-primary/30">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-2 space-y-1.5">
            <div className="rounded-md border border-border/50 px-2.5 py-1.5">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="text-base font-semibold bg-transparent border-none outline-none w-full placeholder:text-muted-foreground"
                placeholder="Persona name"
                autoFocus
              />
            </div>
            <div className="rounded-md border border-border/50 px-2.5 py-1">
              <input
                value={demographics}
                onChange={(e) => setDemographics(e.target.value)}
                onKeyDown={handleKeyDown}
                className="text-xs text-muted-foreground bg-transparent border-none outline-none w-full placeholder:text-muted-foreground"
                placeholder="Demographics"
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-green-400 hover:text-green-300"
              onClick={handleSave}
              aria-label="Save changes"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={onCancel}
              aria-label="Cancel editing"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <EditField label="Tech Proficiency" icon={Monitor}>
          <input
            value={techProficiency}
            onChange={(e) => setTechProficiency(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-sm bg-transparent border-none outline-none w-full placeholder:text-muted-foreground"
            placeholder="e.g. Advanced, Intermediate"
          />
        </EditField>

        <EditField label="Quote" icon={Quote}>
          <input
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-sm bg-transparent border-none outline-none w-full italic placeholder:text-muted-foreground"
            placeholder="A quote from this persona"
          />
        </EditField>

        <EditListField
          label="Goals"
          icon={Target}
          color="text-green-400"
          value={goals}
          onChange={setGoals}
          onKeyDown={handleKeyDown}
          placeholder="One goal per line"
        />

        <EditListField
          label="Frustrations"
          icon={Frown}
          color="text-red-400"
          value={frustrations}
          onChange={setFrustrations}
          onKeyDown={handleKeyDown}
          placeholder="One frustration per line"
        />

        <EditListField
          label="Behaviors"
          icon={Activity}
          color="text-blue-400"
          value={behaviors}
          onChange={setBehaviors}
          onKeyDown={handleKeyDown}
          placeholder="One behavior per line"
        />

        <EditField label="Notes" icon={StickyNote}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={Math.max(2, notes.split("\n").length)}
            className="text-sm bg-transparent border-none outline-none w-full resize-none placeholder:text-muted-foreground"
            placeholder="Freeform notes, observations, follow-ups..."
          />
        </EditField>
      </CardContent>
    </Card>
  );
}

function EditField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="rounded-md border border-border/50 px-2.5 py-1.5">
        {children}
      </div>
    </div>
  );
}

function EditListField({
  label,
  icon: Icon,
  color,
  value,
  onChange,
  onKeyDown,
  placeholder,
}: {
  label: string;
  icon: React.ElementType;
  color: string;
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder: string;
}) {
  return (
    <div>
      <div className={`flex items-center gap-1.5 text-xs font-medium ${color} mb-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="rounded-md border border-border/50 px-2.5 py-1.5">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          rows={Math.max(2, value.split("\n").length)}
          className="text-sm bg-transparent border-none outline-none w-full resize-none placeholder:text-muted-foreground"
          placeholder={placeholder}
        />
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
      <ul className="space-y-1 pl-3">
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
