"use client";

import { useEffect } from "react";
import { Map } from "lucide-react";
import { useWorkspaceContext } from "@/stores/workspace-context";
import { ViewPlaceholder } from "./view-placeholder";

export function RoadmapView({ projectId }: { projectId: string }) {
  useEffect(() => {
    useWorkspaceContext.getState().setActiveView("roadmap");
  }, []);

  return (
    <ViewPlaceholder
      viewName="Roadmap"
      viewType="roadmap"
      description="Timeline-based roadmap with quarterly lanes, milestones, and dependency arrows. Drag features from the tree onto the timeline."
      icon={Map}
    />
  );
}
