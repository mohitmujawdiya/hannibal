"use client";

import { useEffect } from "react";
import { Swords } from "lucide-react";
import { useWorkspaceContext } from "@/stores/workspace-context";
import { ViewPlaceholder } from "./view-placeholder";

export function CompetitorMatrixView({ projectId }: { projectId: string }) {
  useEffect(() => {
    useWorkspaceContext.getState().setActiveView("competitors");
  }, []);

  return (
    <ViewPlaceholder
      viewName="Competitive Analysis"
      viewType="competitors"
      description="AI-powered competitor research with feature comparison matrix. Auto-refresh to track competitor changes."
      icon={Swords}
    />
  );
}
