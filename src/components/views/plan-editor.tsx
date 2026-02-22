"use client";

import { useEffect } from "react";
import { FileText, Sparkles, Copy, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspaceContext } from "@/stores/workspace-context";
import { useArtifactStore, usePlans } from "@/stores/artifact-store";
import { MarkdownDoc } from "@/components/editor/markdown-doc";
import { planToMarkdown } from "@/lib/artifact-to-markdown";
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

  useEffect(() => {
    useWorkspaceContext.getState().setActiveView("plan");
  }, []);

  // Must run unconditionally (Rules of Hooks)
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
    navigator.clipboard.writeText(planToMarkdown(activePlan));
  };

  const toolbarActions = (
    <>
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
    </>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-[16px]">
        <h2 className="text-sm font-semibold">{activePlan.title}</h2>
        <p className="text-xs text-muted-foreground">Implementation Plan</p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          <MarkdownDoc
            value={content}
            onChange={(v) => updateArtifact(activePlan.id, { content: v } as Partial<PlanArtifact>)}
            placeholder="Describe the implementation plan..."
            minHeight="min-h-[400px]"
            toolbarActions={toolbarActions}
          />
        </div>
      </div>
    </div>
  );
}
