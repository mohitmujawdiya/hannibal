"use client";

import { useEffect } from "react";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspaceContext } from "@/stores/workspace-context";
import { useArtifactStore, useCompetitors } from "@/stores/artifact-store";
import { competitorToMarkdown } from "@/lib/artifact-to-markdown";

export function CompetitorMatrixView({ projectId }: { projectId: string }) {
  const competitors = useCompetitors();
  const removeArtifact = useArtifactStore((s) => s.removeArtifact);
  const setAiPanelOpen = useWorkspaceContext((s) => s.setAiPanelOpen);

  useEffect(() => {
    useWorkspaceContext.getState().setActiveView("competitors");
  }, []);

  if (competitors.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-6 py-[16px]">
          <h2 className="text-sm font-semibold">Competitive Analysis</h2>
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

  const handleCopy = () => {
    const markdown = competitors.map((c) => competitorToMarkdown(c)).join("\n\n---\n\n");
    navigator.clipboard.writeText(markdown);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-[16px] flex items-center justify-between">
        <h2 className="text-sm font-semibold">Competitive Analysis</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5 mr-1" />
            Copy
          </Button>
          <Badge variant="secondary" className="text-xs">
            {competitors.length} competitor{competitors.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          {competitors.map((comp) => (
            <Card key={comp.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {comp.name}
                      {comp.url && (
                        <a
                          href={comp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {comp.positioning}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeArtifact(comp.id)}
                      aria-label="Delete competitor"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    {comp.pricing && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        <DollarSign className="h-3 w-3 mr-0.5" />
                        {comp.pricing}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <CompetitorList
                    icon={ThumbsUp}
                    title="Strengths"
                    items={comp.strengths}
                    color="text-green-400"
                    dotColor="bg-green-400"
                  />
                  <CompetitorList
                    icon={ThumbsDown}
                    title="Weaknesses"
                    items={comp.weaknesses}
                    color="text-red-400"
                    dotColor="bg-red-400"
                  />
                  <CompetitorList
                    icon={AlertCircle}
                    title="Feature Gaps"
                    items={comp.featureGaps}
                    color="text-amber-400"
                    dotColor="bg-amber-400"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
      <ul className="space-y-1.5">
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
