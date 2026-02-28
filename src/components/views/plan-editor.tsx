"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  Sparkles,
  Trash2,
  LayoutGrid,
  Loader2,
  Plus,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { useWorkspaceContext } from "@/stores/workspace-context";
import { useProjectPlans } from "@/hooks/use-project-data";
import { useDebouncedMutation } from "@/hooks/use-debounced-mutation";
import { MarkdownDoc } from "@/components/editor/markdown-doc";
import { parseMarkdownSections } from "@/lib/parse-markdown-sections";
import { Skeleton } from "@/components/ui/skeleton";

export function PlanEditorView({ projectId }: { projectId: string }) {
  const { data: plans, isLoading, create, update, remove } = useProjectPlans(projectId);
  const requestAiFocus = useWorkspaceContext((s) => s.requestAiFocus);
  const [viewMode, setViewMode] = useState<"card" | "markdown">("card");

  useEffect(() => {
    useWorkspaceContext.getState().setActiveView("plan");
  }, []);

  const handleCreate = useCallback(async () => {
    await create({ title: "Untitled Plan", content: "# Untitled Plan\n\n" });
    setViewMode("markdown");
  }, [create]);

  const updateContent = useCallback(
    async (input: { id: string; content: string }) => {
      await update(input);
    },
    [update],
  );
  const { debouncedFn: debouncedUpdate, savingState } = useDebouncedMutation(updateContent);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-6 h-12 flex items-center">
          <h2 className="text-base font-semibold">Implementation Plan</h2>
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

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
              Create a blank plan or ask Hannibal to generate one.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button size="sm" onClick={requestAiFocus}>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Generate with AI
              </Button>
              <Button variant="outline" size="sm" onClick={handleCreate}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Start from Scratch
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activePlan = plans[0]; // list is ordered by updatedAt desc
  const content = activePlan.content;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">Implementation Plan</h2>
          {savingState === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          {savingState === "saved" && <span className="text-xs text-muted-foreground">Saved</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8" onClick={handleCreate}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            New
          </Button>
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
            onClick={() => remove(activePlan.id)}
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
              onChange={(v) => debouncedUpdate({ id: activePlan.id, content: v })}
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
