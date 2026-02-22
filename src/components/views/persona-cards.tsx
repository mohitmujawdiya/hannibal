"use client";

import { useEffect } from "react";
import { Users } from "lucide-react";
import { useWorkspaceContext } from "@/stores/workspace-context";
import { ViewPlaceholder } from "./view-placeholder";

export function PersonaCardsView({ projectId }: { projectId: string }) {
  useEffect(() => {
    useWorkspaceContext.getState().setActiveView("personas");
  }, []);

  return (
    <ViewPlaceholder
      viewName="User Personas"
      viewType="personas"
      description="AI-generated user personas with demographics, goals, frustrations, and journey maps. Linked to features in your tree."
      icon={Users}
    />
  );
}
