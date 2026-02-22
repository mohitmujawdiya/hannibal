"use client";

import { useEffect } from "react";
import { FileText } from "lucide-react";
import { useWorkspaceContext } from "@/stores/workspace-context";
import { ViewPlaceholder } from "./view-placeholder";

export function PlanEditorView({ projectId }: { projectId: string }) {
  useEffect(() => {
    useWorkspaceContext.getState().setActiveView("plan");
  }, []);

  return (
    <ViewPlaceholder
      viewName="Implementation Plan"
      viewType="plan"
      description="Create and refine your product plan with AI assistance. Novel editor with slash commands and AI completions coming soon."
      icon={FileText}
    />
  );
}
