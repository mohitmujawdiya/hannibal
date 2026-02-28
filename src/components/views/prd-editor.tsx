"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ClipboardList,
  Sparkles,
  Trash2,
  FileText,
  LayoutGrid,
  Loader2,
  Plus,
  ArrowLeft,
  Clock,
  Pencil,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { useWorkspaceContext } from "@/stores/workspace-context";
import { useProjectPrds } from "@/hooks/use-project-data";
import { useDebouncedMutation } from "@/hooks/use-debounced-mutation";
import { MarkdownDoc } from "@/components/editor/markdown-doc";
import { parseMarkdownSections } from "@/lib/parse-markdown-sections";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-muted text-muted-foreground" },
  IN_REVIEW: { label: "In Review", className: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400" },
  APPROVED: { label: "Approved", className: "bg-green-500/15 text-green-600 dark:text-green-400" },
};

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

function getContentSummary(content: string): string {
  const stripped = content
    .replace(/^#\s+.*$/m, "")
    .replace(/[#*_`~\[\]]/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
  if (stripped.length <= 150) return stripped;
  return stripped.slice(0, 150).trimEnd() + "...";
}

export function PrdEditorView({ projectId }: { projectId: string }) {
  const { data: prds, isLoading, isFetching, create, update, remove } = useProjectPrds(projectId);
  const requestAiFocus = useWorkspaceContext((s) => s.requestAiFocus);
  const selectedEntity = useWorkspaceContext((s) => s.selectedEntity);
  const setSelectedEntity = useWorkspaceContext((s) => s.setSelectedEntity);
  const aiEdit = useWorkspaceContext((s) => s.aiEdit);
  const [selectedPrdId, setSelectedPrdId] = useState<string | null>(() => {
    const entity = useWorkspaceContext.getState().selectedEntity;
    if (entity?.type === "prd") return entity.id;
    const edit = useWorkspaceContext.getState().aiEdit;
    if (edit?.documentType === "prd") return edit.documentId;
    return null;
  });
  const [viewMode, setViewMode] = useState<"card" | "markdown">("card");

  useEffect(() => {
    // Only set activeView — don't clear selectedEntity (it may have been set by artifact push)
    useWorkspaceContext.setState({ activeView: "prd" });
  }, []);

  // Handle navigation from AI push (selectedEntity has prd ID)
  useEffect(() => {
    if (selectedEntity?.type === "prd" && selectedEntity.id) {
      setSelectedPrdId(selectedEntity.id);
    }
  }, [selectedEntity]);

  // Auto-navigate to the PRD being edited by AI
  useEffect(() => {
    if (aiEdit?.documentType === "prd" && aiEdit.documentId && !aiEdit.isComplete) {
      setSelectedPrdId(aiEdit.documentId);
      setViewMode("card");
    }
  }, [aiEdit?.documentType, aiEdit?.documentId, aiEdit?.isComplete]);

  // Update context bridge when in detail mode
  useEffect(() => {
    if (selectedPrdId) {
      setSelectedEntity({ type: "prd", id: selectedPrdId });
    } else {
      setSelectedEntity(null);
    }
  }, [selectedPrdId, setSelectedEntity]);

  const handleCreate = useCallback(async () => {
    const newPrd = await create({ title: "Untitled PRD", content: "# Untitled PRD\n\n" });
    setSelectedPrdId(newPrd.id);
    setViewMode("markdown");
  }, [create]);

  const handleDelete = useCallback(
    (id: string) => {
      remove(id);
      if (selectedPrdId === id) {
        setSelectedPrdId(null);
      }
    },
    [remove, selectedPrdId],
  );

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
          <h2 className="text-base font-semibold">PRDs</h2>
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // Detail mode — editing a specific PRD
  if (selectedPrdId) {
    const activePrd = prds.find((p) => p.id === selectedPrdId);
    if (!activePrd) {
      if (isFetching) {
        // Query is still refetching (e.g. after AI push) — wait for it
        return (
          <div className="flex h-full flex-col">
            <div className="border-b border-border px-6 h-12 flex items-center">
              <h2 className="text-base font-semibold">PRDs</h2>
            </div>
            <div className="flex-1 p-6 space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        );
      }
      // Query settled and PRD not found — it was deleted
      setSelectedPrdId(null);
      return null;
    }
    const content = activePrd.content;
    const isAiEditing =
      aiEdit?.documentType === "prd" &&
      aiEdit.documentId === selectedPrdId &&
      !aiEdit.isComplete;
    const displayContent = isAiEditing ? (aiEdit.streamingContent || content) : content;
    const effectiveViewMode = isAiEditing ? "card" : viewMode;

    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => setSelectedPrdId(null)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-base font-semibold truncate max-w-[300px]">{activePrd.title}</h2>
            {isAiEditing && (
              <div className="flex items-center gap-1.5 text-xs text-primary">
                <Pencil className="h-3 w-3 animate-pulse" />
                <span>AI is editing...</span>
              </div>
            )}
            {!isAiEditing && savingState === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            {!isAiEditing && savingState === "saved" && <span className="text-xs text-muted-foreground">Saved</span>}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border border-border">
              <Button
                variant={effectiveViewMode === "card" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 rounded-r-none"
                onClick={() => setViewMode("card")}
                disabled={isAiEditing}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={effectiveViewMode === "markdown" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 rounded-l-none"
                onClick={() => setViewMode("markdown")}
                disabled={isAiEditing}
              >
                <FileText className="h-3.5 w-3.5" />
              </Button>
            </div>
            <CopyButton getText={() => displayContent} />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-destructive hover:text-destructive"
              onClick={() => handleDelete(activePrd.id)}
              disabled={isAiEditing}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {effectiveViewMode === "markdown" ? (
            <div className="max-w-3xl mx-auto">
              <MarkdownDoc
                value={displayContent}
                onChange={(v) => debouncedUpdate({ id: activePrd.id, content: v })}
                placeholder="Product requirements..."
                minHeight="min-h-[400px]"
                readOnly={isAiEditing}
              />
            </div>
          ) : (
            <SectionCardLayout content={displayContent} />
          )}
        </div>
      </div>
    );
  }

  // List mode — card grid
  if (prds.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-6 h-12 flex items-center">
          <h2 className="text-base font-semibold">PRDs</h2>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center max-w-sm">
            <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">No PRDs yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a blank PRD or ask Hannibal to generate one.
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

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 h-12 flex items-center justify-between">
        <h2 className="text-base font-semibold">PRDs</h2>
        <Button variant="ghost" size="sm" className="h-8" onClick={handleCreate}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          New PRD
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {prds.map((prd) => {
            const statusCfg = STATUS_CONFIG[prd.status] ?? STATUS_CONFIG.DRAFT;
            return (
              <Card
                key={prd.id}
                className="cursor-pointer transition-colors hover:border-foreground/20 hover:bg-accent/50"
                onClick={() => setSelectedPrdId(prd.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
                      {prd.title}
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className={cn("text-[10px] shrink-0", statusCfg.className)}
                    >
                      {statusCfg.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
                    {getContentSummary(prd.content)}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(prd.updatedAt)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SectionCardLayout({ content }: { content: string }) {
  const sections = parseMarkdownSections(content);

  if (sections.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm py-12">
        No PRD content to display. Switch to markdown view to add content.
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
