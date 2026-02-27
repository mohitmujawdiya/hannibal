"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Sparkles,
  Trash2,
  LayoutGrid,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { useWorkspaceContext } from "@/stores/workspace-context";
import { useArtifactStore, usePlans, softDeleteArtifact } from "@/stores/artifact-store";
import { MarkdownDoc } from "@/components/editor/markdown-doc";
import { planToMarkdown } from "@/lib/artifact-to-markdown";
import { parseMarkdownSections } from "@/lib/parse-markdown-sections";
import type { PlanArtifact } from "@/lib/artifact-types";

function getPlanContent(plan: PlanArtifact): string {
  if (plan.content != null && plan.content.trim()) return plan.content;
  if (plan.sections) return planToMarkdown(plan);
  return "";
}

export function PlanEditorView({ projectId }: { projectId: string }) {
  const plans = usePlans();
  const updateArtifact = useArtifactStore((s) => s.updateArtifact);
  const setAiPanelOpen = useWorkspaceContext((s) => s.setAiPanelOpen);
  const aiPanelOpen = useWorkspaceContext((s) => s.aiPanelOpen);
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
        <div className="border-b border-border px-6 h-12 flex items-center">
          <h2 className="text-base font-semibold">Implementation Plan</h2>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center max-w-sm">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">No plans yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ask Hannibal to create an implementation plan in the AI panel.
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

  const activePlan = plan!;
  const content = getPlanContent(activePlan);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 h-12 flex items-center justify-between">
        <h2 className="text-base font-semibold">Implementation Plan</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-border">
            <Button
              variant={viewMode === "card" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 rounded-r-none"
              onClick={() => setViewMode("card")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "markdown" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 rounded-l-none"
              onClick={() => setViewMode("markdown")}
            >
              <FileText className="h-3.5 w-3.5" />
            </Button>
          </div>
          <CopyButton getText={() => content} />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-destructive hover:text-destructive"
            onClick={() => softDeleteArtifact(activePlan.id)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
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
          <SectionCardLayout content={content} />
        )}
      </div>
    </div>
  );
}

function SectionCardLayout({ content }: { content: string }) {
  const sections = parseMarkdownSections(content);

  if (sections.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm py-12">
        No plan content to display. Switch to markdown view to add content.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {sections.map((section) => (
        <Card key={section.title} className="gap-2">
          <CardHeader className="pb-0">
            <CardTitle className="text-base flex items-center gap-2">
              <section.icon className={`h-4 w-4 ${section.color}`} />
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`prose prose-sm dark:prose-invert max-w-none text-sm text-foreground [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-0.5 [&_ul]:pl-3 [&_ol]:pl-3 ${section.color} [&_li]:marker:text-current [&_p]:text-foreground [&_li]:text-foreground`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {section.body}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
