"use client";

import { useEffect, useState } from "react";
import {
  GitBranch,
  ChevronRight,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useWorkspaceContext } from "@/stores/workspace-context";
import { useFeatureTrees } from "@/stores/artifact-store";
import type { FeatureNode } from "@/lib/artifact-types";

export function FeatureTreeView({ projectId }: { projectId: string }) {
  const trees = useFeatureTrees();
  const setAiPanelOpen = useWorkspaceContext((s) => s.setAiPanelOpen);

  useEffect(() => {
    useWorkspaceContext.getState().setActiveView("features");
  }, []);

  if (trees.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-6 py-[16px]">
          <h2 className="text-sm font-semibold">Feature Tree</h2>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center max-w-sm">
            <GitBranch className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">No feature trees yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ask Hannibal to map out features for your product.
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

  const tree = trees[trees.length - 1];
  const totalFeatures = countFeatures(tree.children);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-[16px] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">{tree.rootFeature}</h2>
          <p className="text-xs text-muted-foreground">Feature Tree</p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {totalFeatures} feature{totalFeatures !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-1">
            {tree.children.map((node, i) => (
              <TreeNode key={i} node={node} depth={0} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TreeNode({ node, depth }: { node: FeatureNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children && node.children.length > 0;

  const depthColors = [
    "border-l-blue-400",
    "border-l-purple-400",
    "border-l-green-400",
    "border-l-orange-400",
  ];

  return (
    <div>
      <button
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={cn(
          "w-full flex items-start gap-2 rounded-lg px-3 py-2 text-left transition-colors",
          "hover:bg-accent/50",
          hasChildren && "cursor-pointer",
          depth > 0 && `border-l-2 ${depthColors[depth % depthColors.length]} ml-${depth * 4}`
        )}
        style={{ marginLeft: depth > 0 ? depth * 16 : 0 }}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          )
        ) : (
          <GitBranch className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0 ml-0.5" />
        )}
        <div className="min-w-0">
          <span className={cn("text-sm font-medium", depth === 0 && "text-base")}>
            {node.title}
          </span>
          {node.description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {node.description}
            </p>
          )}
        </div>
        {hasChildren && (
          <Badge variant="outline" className="text-[10px] ml-auto shrink-0">
            {node.children!.length}
          </Badge>
        )}
      </button>

      {expanded && hasChildren && (
        <div className="mt-0.5 space-y-0.5">
          {node.children!.map((child, i) => (
            <TreeNode key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function countFeatures(nodes: FeatureNode[]): number {
  return nodes.reduce((count, node) => {
    return count + 1 + (node.children ? countFeatures(node.children) : 0);
  }, 0);
}
