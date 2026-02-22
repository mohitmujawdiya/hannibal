"use client";

import { useEffect } from "react";
import { GitBranch } from "lucide-react";
import { useWorkspaceContext } from "@/stores/workspace-context";
import { ViewPlaceholder } from "./view-placeholder";

export function FeatureTreeView({ projectId }: { projectId: string }) {
  useEffect(() => {
    useWorkspaceContext.getState().setActiveView("features");
  }, []);

  return (
    <ViewPlaceholder
      viewName="Feature Tree"
      viewType="features"
      description="Interactive feature hierarchy built with React Flow. AI can auto-generate the tree from your plan and suggest missing features."
      icon={GitBranch}
    />
  );
}
