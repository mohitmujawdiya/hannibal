"use client";

import { useEffect } from "react";
import { ClipboardList, Sparkles, Copy, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspaceContext } from "@/stores/workspace-context";
import { useArtifactStore, usePrds } from "@/stores/artifact-store";
import { MarkdownDoc } from "@/components/editor/markdown-doc";
import { prdToMarkdown } from "@/lib/artifact-to-markdown";
import type { PrdArtifact } from "@/lib/artifact-types";

function getPrdContent(prd: PrdArtifact): string {
  if (prd.content != null && prd.content.trim()) return prd.content;
  if (prd.sections) return prdToMarkdown(prd);
  return "";
}

export function PrdEditorView({ projectId }: { projectId: string }) {
  const prds = usePrds();
  const updateArtifact = useArtifactStore((s) => s.updateArtifact);
  const removeArtifact = useArtifactStore((s) => s.removeArtifact);
  const setAiPanelOpen = useWorkspaceContext((s) => s.setAiPanelOpen);

  useEffect(() => {
    useWorkspaceContext.getState().setActiveView("prd");
  }, []);

  // Must run unconditionally (Rules of Hooks)
  const prd = prds.length > 0 ? prds[prds.length - 1] : null;
  useEffect(() => {
    if (!prd?.sections || (prd.content != null && prd.content.trim())) return;
    const content = prdToMarkdown(prd);
    updateArtifact(prd.id, { content, sections: undefined } as Partial<PrdArtifact>);
  }, [prd?.id, prd?.sections, prd?.content, updateArtifact]);

  if (prds.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-6 py-[16px]">
          <h2 className="text-sm font-semibold">Product Requirements</h2>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center max-w-sm">
            <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">No PRDs yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ask Hannibal to generate a PRD for your product.
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

  const activePrd = prd!;
  const content = getPrdContent(activePrd);

  const handleCopy = () => {
    navigator.clipboard.writeText(prdToMarkdown(activePrd));
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
        onClick={() => removeArtifact(activePrd.id)}
      >
        <Trash2 className="h-3.5 w-3.5 mr-1" />
        Delete
      </Button>
      {prds.length > 1 && (
        <Badge variant="secondary" className="text-xs">
          {prds.length} versions
        </Badge>
      )}
    </>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-[16px]">
        <h2 className="text-sm font-semibold">{activePrd.title}</h2>
        <p className="text-xs text-muted-foreground">Product Requirements Document</p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          <MarkdownDoc
            value={content}
            onChange={(v) => updateArtifact(activePrd.id, { content: v } as Partial<PrdArtifact>)}
            placeholder="Product requirements..."
            minHeight="min-h-[400px]"
            toolbarActions={toolbarActions}
          />
        </div>
      </div>
    </div>
  );
}
