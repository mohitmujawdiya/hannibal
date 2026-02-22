"use client";

import { useEffect } from "react";
import { ClipboardList } from "lucide-react";
import { useWorkspaceContext } from "@/stores/workspace-context";
import { ViewPlaceholder } from "./view-placeholder";

export function PrdEditorView({ projectId }: { projectId: string }) {
  useEffect(() => {
    useWorkspaceContext.getState().setActiveView("prd");
  }, []);

  return (
    <ViewPlaceholder
      viewName="Product Requirements"
      viewType="prd"
      description="AI-generated PRDs from your approved plan. Rich text editing with acceptance criteria, user stories, and technical constraints."
      icon={ClipboardList}
    />
  );
}
