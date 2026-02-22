"use client";

import { useState } from "react";
import {
  FileText,
  ClipboardList,
  Users,
  GitBranch,
  Swords,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Artifact } from "@/lib/artifact-types";
import { useWorkspaceContext, type ViewType } from "@/stores/workspace-context";
import { useArtifactStore } from "@/stores/artifact-store";

const artifactMeta: Record<
  Artifact["type"],
  { icon: React.ElementType; label: string; view: ViewType; color: string }
> = {
  plan: { icon: FileText, label: "Implementation Plan", view: "plan", color: "text-blue-400" },
  prd: { icon: ClipboardList, label: "PRD", view: "prd", color: "text-green-400" },
  persona: { icon: Users, label: "User Persona", view: "personas", color: "text-purple-400" },
  featureTree: { icon: GitBranch, label: "Feature Tree", view: "features", color: "text-orange-400" },
  competitor: { icon: Swords, label: "Competitor Analysis", view: "competitors", color: "text-red-400" },
};

export function ArtifactCard({ artifact }: { artifact: Artifact }) {
  const [expanded, setExpanded] = useState(false);
  const [pushed, setPushed] = useState(false);
  const setActiveView = useWorkspaceContext((s) => s.setActiveView);
  const addArtifact = useArtifactStore((s) => s.addArtifact);
  const meta = artifactMeta[artifact.type];
  const Icon = meta.icon;

  const title = getArtifactTitle(artifact);

  return (
    <Card className="bg-muted/50 border-border/50 overflow-hidden">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", meta.color)} />
            <div className="min-w-0">
              <Badge variant="outline" className="text-[10px] mb-1">
                {meta.label}
              </Badge>
              <CardTitle className="text-sm font-medium leading-tight truncate">
                {title}
              </CardTitle>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 p-0.5 rounded hover:bg-accent transition-colors"
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </CardHeader>

      {expanded && (
        <div className="px-3 pb-3">
          <ArtifactPreview artifact={artifact} />
          <div className="mt-2">
            <Button
              size="sm"
              variant={pushed ? "outline" : "secondary"}
              className="h-7 text-xs w-full justify-center"
              onClick={() => {
                if (!pushed) {
                  addArtifact(artifact);
                  setPushed(true);
                }
                setActiveView(meta.view);
              }}
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {pushed ? `View in ${meta.label}` : `Push to ${meta.label}`}
              </span>
            </Button>
          </div>
        </div>
      )}

      {!expanded && (
        <CardDescription className="px-3 pb-3 text-xs line-clamp-2">
          {getArtifactSummary(artifact)}
        </CardDescription>
      )}
    </Card>
  );
}

function ArtifactPreview({ artifact }: { artifact: Artifact }) {
  switch (artifact.type) {
    case "plan":
      if (artifact.content) {
        return (
          <div className="text-xs prose prose-sm dark:prose-invert max-w-none line-clamp-6 whitespace-pre-wrap">
            {artifact.content.slice(0, 400)}
            {artifact.content.length > 400 ? "…" : ""}
          </div>
        );
      }
      if (artifact.sections) {
        return (
          <div className="space-y-2 text-xs">
            <Section label="Problem" content={artifact.sections.problemStatement} />
            <Section label="Solution" content={artifact.sections.proposedSolution} />
            <ListSection label="Target Users" items={artifact.sections.targetUsers} />
            <ListSection label="Success Metrics" items={artifact.sections.successMetrics} />
            <ListSection label="Risks" items={artifact.sections.risks} />
            <Section label="Timeline" content={artifact.sections.timeline} />
          </div>
        );
      }
      return null;
    case "prd":
      if (artifact.content) {
        return (
          <div className="text-xs prose prose-sm dark:prose-invert max-w-none line-clamp-6 whitespace-pre-wrap">
            {artifact.content.slice(0, 400)}
            {artifact.content.length > 400 ? "…" : ""}
          </div>
        );
      }
      if (artifact.sections) {
        return (
          <div className="space-y-2 text-xs">
            <Section label="Overview" content={artifact.sections.overview} />
            <ListSection label="User Stories" items={artifact.sections.userStories} />
            <ListSection label="Acceptance Criteria" items={artifact.sections.acceptanceCriteria} />
            <ListSection label="Out of Scope" items={artifact.sections.outOfScope} />
          </div>
        );
      }
      return null;
    case "persona":
      return (
        <div className="space-y-2 text-xs">
          <Section label="Demographics" content={artifact.demographics} />
          <ListSection label="Goals" items={artifact.goals} />
          <ListSection label="Frustrations" items={artifact.frustrations} />
          <ListSection label="Behaviors" items={artifact.behaviors} />
          <p className="italic text-muted-foreground">"{artifact.quote}"</p>
        </div>
      );
    case "featureTree":
      return (
        <div className="text-xs space-y-1">
          <p className="font-medium">{artifact.rootFeature}</p>
          <FeatureTreePreview nodes={artifact.children} depth={0} />
        </div>
      );
    case "competitor":
      return (
        <div className="space-y-2 text-xs">
          <Section label="Positioning" content={artifact.positioning} />
          <ListSection label="Strengths" items={artifact.strengths} />
          <ListSection label="Weaknesses" items={artifact.weaknesses} />
          {artifact.pricing && <Section label="Pricing" content={artifact.pricing} />}
          <ListSection label="Feature Gaps" items={artifact.featureGaps} />
        </div>
      );
  }
}

function Section({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <span className="font-medium text-muted-foreground">{label}: </span>
      <span className="text-foreground">{content}</span>
    </div>
  );
}

function ListSection({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <span className="font-medium text-muted-foreground">{label}:</span>
      <ul className="ml-3 mt-0.5 space-y-0.5">
        {items.map((item, i) => (
          <li key={i} className="list-disc text-foreground">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeatureTreePreview({
  nodes,
  depth,
}: {
  nodes: { title: string; description?: string; children?: unknown[] }[];
  depth: number;
}) {
  if (depth > 2) return null;
  return (
    <ul className={cn("space-y-0.5", depth > 0 ? "ml-3" : "ml-2")}>
      {nodes.map((node, i) => (
        <li key={i}>
          <span className="text-foreground">
            {"└ "}
            {node.title}
          </span>
          {node.children && node.children.length > 0 && (
            <FeatureTreePreview
              nodes={
                node.children as {
                  title: string;
                  description?: string;
                  children?: unknown[];
                }[]
              }
              depth={depth + 1}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

function getArtifactTitle(artifact: Artifact): string {
  switch (artifact.type) {
    case "plan":
    case "prd":
      return artifact.title;
    case "persona":
      return artifact.name;
    case "featureTree":
      return artifact.rootFeature;
    case "competitor":
      return artifact.name;
  }
}

function getArtifactSummary(artifact: Artifact): string {
  switch (artifact.type) {
    case "plan":
      if (artifact.content) return artifact.content.slice(0, 120);
      if (artifact.sections) return artifact.sections.problemStatement.slice(0, 120);
      return "";
    case "prd":
      if (artifact.content) return artifact.content.slice(0, 120);
      if (artifact.sections) return artifact.sections.overview.slice(0, 120);
      return "";
    case "persona":
      return `${artifact.demographics} — "${artifact.quote}"`.slice(0, 120);
    case "featureTree":
      return `${artifact.children.length} top-level features`;
    case "competitor":
      return artifact.positioning.slice(0, 120);
  }
}
