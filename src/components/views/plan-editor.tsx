"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Sparkles,
  Copy,
  Trash2,
  LayoutGrid,
  Target,
  Users,
  Lightbulb,
  Wrench,
  TrendingUp,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspaceContext } from "@/stores/workspace-context";
import { useArtifactStore, usePlans } from "@/stores/artifact-store";
import { MarkdownDoc } from "@/components/editor/markdown-doc";
import { planToMarkdown } from "@/lib/artifact-to-markdown";
import { parsePlanMarkdown } from "@/lib/markdown-to-artifact";
import type { PlanArtifact } from "@/lib/artifact-types";

function getPlanContent(plan: PlanArtifact): string {
  if (plan.content != null && plan.content.trim()) return plan.content;
  if (plan.sections) return planToMarkdown(plan);
  return "";
}

export function PlanEditorView({ projectId }: { projectId: string }) {
  const plans = usePlans();
  const updateArtifact = useArtifactStore((s) => s.updateArtifact);
  const removeArtifact = useArtifactStore((s) => s.removeArtifact);
  const setAiPanelOpen = useWorkspaceContext((s) => s.setAiPanelOpen);
  const [viewMode, setViewMode] = useState<"card" | "markdown">("card");

  useEffect(() => {
    useWorkspaceContext.getState().setActiveView("plan");
  }, []);

  const plan = plans.length > 0 ? plans[plans.length - 1] : null;
  useEffect(() => {
    if (!plan?.sections || (plan.content != null && plan.content.trim())) return;
    const content = planToMarkdown(plan);
    updateArtifact(plan.id, { content, sections: undefined } as Partial<PlanArtifact>);
  }, [plan?.id, plan?.sections, plan?.content, updateArtifact]);

  if (plans.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-6 py-[16px]">
          <h2 className="text-sm font-semibold">Implementation Plan</h2>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center max-w-sm">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">No plans yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ask Hannibal to create an implementation plan in the AI panel.
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

  const activePlan = plan!;
  const content = getPlanContent(activePlan);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-[16px] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">{activePlan.title}</h2>
          <p className="text-xs text-muted-foreground">Implementation Plan</p>
        </div>
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
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-destructive hover:text-destructive"
            onClick={() => removeArtifact(activePlan.id)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
          {plans.length > 1 && (
            <Badge variant="secondary" className="text-xs">
              {plans.length} versions
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {viewMode === "markdown" ? (
          <div className="max-w-3xl mx-auto">
            <MarkdownDoc
              value={content}
              onChange={(v) => updateArtifact(activePlan.id, { content: v } as Partial<PlanArtifact>)}
              placeholder="Describe the implementation plan..."
              minHeight="min-h-[400px]"
            />
          </div>
        ) : (
          <PlanCardLayout content={content} />
        )}
      </div>
    </div>
  );
}

function PlanCardLayout({ content }: { content: string }) {
  const parsed = parsePlanMarkdown(content);

  const sections: { icon: React.ElementType; title: string; color: string; content: string | string[]; type: "text" | "list" }[] = [
    { icon: Target, title: "Problem Statement", color: "text-red-400", content: parsed.problemStatement, type: "text" },
    { icon: Users, title: "Target Users", color: "text-blue-400", content: parsed.targetUsers, type: "list" },
    { icon: Lightbulb, title: "Proposed Solution", color: "text-green-400", content: parsed.proposedSolution, type: "text" },
    { icon: Wrench, title: "Technical Approach", color: "text-purple-400", content: parsed.technicalApproach, type: "text" },
    { icon: TrendingUp, title: "Success Metrics", color: "text-emerald-400", content: parsed.successMetrics, type: "list" },
    { icon: AlertTriangle, title: "Risks", color: "text-amber-400", content: parsed.risks, type: "list" },
    { icon: Clock, title: "Timeline", color: "text-cyan-400", content: parsed.timeline, type: "text" },
  ];

  const nonEmpty = sections.filter((s) =>
    s.type === "list" ? (s.content as string[]).length > 0 : (s.content as string).trim().length > 0
  );

  if (nonEmpty.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm py-12">
        No plan content to display. Switch to markdown view to add content.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {nonEmpty.map((section) => (
        <Card key={section.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <section.icon className={`h-4 w-4 ${section.color}`} />
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {section.type === "text" ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {section.content as string}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {(section.content as string[]).map((item, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${section.color.replace("text-", "bg-")} shrink-0`} />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
