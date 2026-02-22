"use client";

import { useEffect } from "react";
import { BarChart3 } from "lucide-react";
import { useWorkspaceContext } from "@/stores/workspace-context";
import { ViewPlaceholder } from "./view-placeholder";

export function PriorityMatrixView({ projectId }: { projectId: string }) {
  useEffect(() => {
    useWorkspaceContext.getState().setActiveView("priorities");
  }, []);

  return (
    <ViewPlaceholder
      viewName="Priorities"
      viewType="priorities"
      description="RICE scoring framework with AI-suggested scores. Sort and filter features by reach, impact, confidence, and effort."
      icon={BarChart3}
    />
  );
}
