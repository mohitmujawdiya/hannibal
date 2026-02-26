"use client";

import { useEffect, useState } from "react";
import {
  Swords,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  DollarSign,
  AlertCircle,
  Sparkles,
  Copy,
  Trash2,
  Pencil,
  Check,
  X,
  Globe,
  Crosshair,
  StickyNote,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { useWorkspaceContext } from "@/stores/workspace-context";
import { useArtifactStore, useCompetitors, softDeleteArtifact } from "@/stores/artifact-store";
import { competitorToMarkdown } from "@/lib/artifact-to-markdown";
import { parseCompetitorMarkdown } from "@/lib/markdown-to-artifact";
import type { ParsedCompetitor } from "@/lib/markdown-to-artifact";
import type { CompetitorArtifact } from "@/lib/artifact-types";

function getCompetitorContent(comp: CompetitorArtifact): string {
  if (comp.content != null && comp.content.trim()) return comp.content;
  return competitorToMarkdown(comp);
}

function buildCompetitorMarkdown(fields: ParsedCompetitor): string {
  const parts: string[] = [
    `## ${fields.name}`,
    fields.url ? `**URL:** ${fields.url}` : "",
    `**Positioning:** ${fields.positioning}`,
    fields.pricing ? `**Pricing:** ${fields.pricing}` : "",
  ].filter(Boolean);
  if (fields.strengths.length > 0) {
    parts.push(`**Strengths:**\n${fields.strengths.map((s) => `- ${s}`).join("\n")}`);
  }
  if (fields.weaknesses.length > 0) {
    parts.push(`**Weaknesses:**\n${fields.weaknesses.map((w) => `- ${w}`).join("\n")}`);
  }
  if (fields.featureGaps.length > 0) {
    parts.push(`**Feature Gaps:**\n${fields.featureGaps.map((g) => `- ${g}`).join("\n")}`);
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

export function CompetitorMatrixView({ projectId }: { projectId: string }) {
  const competitors = useCompetitors();
  const updateArtifact = useArtifactStore((s) => s.updateArtifact);
  const setAiPanelOpen = useWorkspaceContext((s) => s.setAiPanelOpen);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    useWorkspaceContext.getState().setActiveView("competitors");
  }, []);

  if (competitors.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-6 h-12 flex items-center">
          <h2 className="text-base font-semibold">Competitive Analysis</h2>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center max-w-sm">
            <Swords className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">No competitors analyzed</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ask Hannibal to analyze competitors in your market.
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

  const getCopyText = () => competitors.map((c) => getCompetitorContent(c)).join("\n\n---\n\n");

  const handleSave = (compId: string, fields: ParsedCompetitor) => {
    const content = buildCompetitorMarkdown(fields);
    updateArtifact(compId, { content, title: fields.name } as Partial<CompetitorArtifact>);
    setEditingId(null);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 h-12 flex items-center justify-between">
        <h2 className="text-base font-semibold">Competitive Analysis</h2>
        <div className="flex items-center gap-2">
          <CopyButton getText={getCopyText} />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto space-y-4">
            {competitors.map((comp) => {
              const parsed = parseCompetitorMarkdown(getCompetitorContent(comp));
              const isEditing = editingId === comp.id;

              if (isEditing) {
                return (
                  <EditCompetitorCard
                    key={comp.id}
                    comp={comp}
                    parsed={parsed}
                    onSave={(fields) => handleSave(comp.id, fields)}
                    onCancel={() => setEditingId(null)}
                  />
                );
              }

              return (
                <Card key={comp.id} className="gap-2">
                  <CardHeader className="pb-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {comp.title || parsed.name}
                          {parsed.url && (
                            <a
                              href={parsed.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {parsed.positioning}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {parsed.pricing && (
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            <DollarSign className="h-3 w-3 mr-0.5" />
                            {parsed.pricing}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => setEditingId(comp.id)}
                          aria-label="Edit competitor"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => navigator.clipboard.writeText(getCompetitorContent(comp))}
                          aria-label="Copy competitor as markdown"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => softDeleteArtifact(comp.id)}
                          aria-label="Delete competitor"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {parsed.strengths.length > 0 && (
                        <CompetitorList
                          icon={ThumbsUp}
                          title="Strengths"
                          items={parsed.strengths}
                          color="text-green-400"
                          dotColor="bg-green-400"
                        />
                      )}
                      {parsed.weaknesses.length > 0 && (
                        <CompetitorList
                          icon={ThumbsDown}
                          title="Weaknesses"
                          items={parsed.weaknesses}
                          color="text-red-400"
                          dotColor="bg-red-400"
                        />
                      )}
                      {parsed.featureGaps.length > 0 && (
                        <CompetitorList
                          icon={AlertCircle}
                          title="Feature Gaps"
                          items={parsed.featureGaps}
                          color="text-amber-400"
                          dotColor="bg-amber-400"
                        />
                      )}
                    </div>

                    {parsed.notes && (
                      <div className="mt-4">
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

function EditCompetitorCard({
  comp,
  parsed,
  onSave,
  onCancel,
}: {
  comp: CompetitorArtifact;
  parsed: ParsedCompetitor;
  onSave: (fields: ParsedCompetitor) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(comp.title || parsed.name);
  const [url, setUrl] = useState(parsed.url);
  const [positioning, setPositioning] = useState(parsed.positioning);
  const [pricing, setPricing] = useState(parsed.pricing);
  const [strengths, setStrengths] = useState(listToLines(parsed.strengths));
  const [weaknesses, setWeaknesses] = useState(listToLines(parsed.weaknesses));
  const [featureGaps, setFeatureGaps] = useState(listToLines(parsed.featureGaps));
  const [notes, setNotes] = useState(parsed.notes);

  const handleSave = () => {
    onSave({
      name,
      url,
      positioning,
      pricing,
      strengths: linesToList(strengths),
      weaknesses: linesToList(weaknesses),
      featureGaps: linesToList(featureGaps),
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
    <Card className="gap-2 ring-1 ring-primary/30">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-2 space-y-1.5">
            <div className="rounded-md border border-border/50 px-2.5 py-1.5">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="text-base font-semibold bg-transparent border-none outline-none w-full placeholder:text-muted-foreground"
                placeholder="Competitor name"
                autoFocus
              />
            </div>
            <div className="rounded-md border border-border/50 px-2.5 py-1">
              <input
                value={positioning}
                onChange={(e) => setPositioning(e.target.value)}
                onKeyDown={handleKeyDown}
                className="text-sm text-muted-foreground bg-transparent border-none outline-none w-full placeholder:text-muted-foreground"
                placeholder="Market positioning"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <EditField label="URL" icon={Globe}>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-sm bg-transparent border-none outline-none w-full placeholder:text-muted-foreground"
              placeholder="https://..."
            />
          </EditField>
          <EditField label="Pricing" icon={DollarSign}>
            <input
              value={pricing}
              onChange={(e) => setPricing(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-sm bg-transparent border-none outline-none w-full placeholder:text-muted-foreground"
              placeholder="e.g. Freemium, $29/mo"
            />
          </EditField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <EditListField
            label="Strengths"
            icon={ThumbsUp}
            color="text-green-400"
            value={strengths}
            onChange={setStrengths}
            onKeyDown={handleKeyDown}
            placeholder="One per line"
          />

          <EditListField
            label="Weaknesses"
            icon={ThumbsDown}
            color="text-red-400"
            value={weaknesses}
            onChange={setWeaknesses}
            onKeyDown={handleKeyDown}
            placeholder="One per line"
          />

          <EditListField
            label="Feature Gaps"
            icon={AlertCircle}
            color="text-amber-400"
            value={featureGaps}
            onChange={setFeatureGaps}
            onKeyDown={handleKeyDown}
            placeholder="One per line"
          />
        </div>

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

function CompetitorList({
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
      <div className={`flex items-center gap-1.5 text-xs font-medium ${color} mb-2`}>
        <Icon className="h-3 w-3" />
        {title}
      </div>
      <ul className="space-y-1.5 pl-3">
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
