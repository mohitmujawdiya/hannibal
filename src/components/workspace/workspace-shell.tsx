"use client";

import { useEffect } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable-panels";
import { Sidebar } from "./sidebar";
import { MainContent } from "./main-content";
import { AiPanel } from "./ai-panel";
import { useWorkspaceContext } from "@/stores/workspace-context";

type WorkspaceShellProps = {
  projectId: string;
  projectName?: string;
};

export function WorkspaceShell({ projectId, projectName }: WorkspaceShellProps) {
  const sidebarOpen = useWorkspaceContext((s) => s.sidebarOpen);
  const aiPanelOpen = useWorkspaceContext((s) => s.aiPanelOpen);
  const toggleSidebar = useWorkspaceContext((s) => s.toggleSidebar);
  const toggleAiPanel = useWorkspaceContext((s) => s.toggleAiPanel);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.metaKey && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      }
      if (e.metaKey && e.key === "l") {
        e.preventDefault();
        toggleAiPanel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar, toggleAiPanel]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <ResizablePanelGroup orientation="horizontal">
        {sidebarOpen && (
          <>
            <ResizablePanel
              defaultSize="15%"
              minSize="12%"
              maxSize="22%"
            >
              <Sidebar projectId={projectId} projectName={projectName} />
            </ResizablePanel>
            <ResizableHandle />
          </>
        )}

        <ResizablePanel
          defaultSize={aiPanelOpen ? "55%" : "85%"}
          minSize="30%"
        >
          <MainContent projectId={projectId} />
        </ResizablePanel>

        {aiPanelOpen && (
          <>
            <ResizableHandle />
            <ResizablePanel
              defaultSize="30%"
              minSize="18%"
              maxSize="45%"
            >
              <AiPanel projectId={projectId} />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
