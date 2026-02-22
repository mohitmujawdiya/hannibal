import { create } from "zustand";

export type ViewType =
  | "overview"
  | "plan"
  | "prd"
  | "features"
  | "roadmap"
  | "priorities"
  | "personas"
  | "competitors"
  | "research"
  | "kanban";

export type SelectedEntity = {
  type: "feature" | "plan" | "prd" | "persona" | "competitor" | "roadmapItem";
  id: string;
  data?: unknown;
} | null;

type WorkspaceContextState = {
  activeView: ViewType;
  selectedEntity: SelectedEntity;
  highlightedText: string | null;
  sidebarOpen: boolean;
  aiPanelOpen: boolean;
  setActiveView: (view: ViewType) => void;
  setSelectedEntity: (entity: SelectedEntity) => void;
  setHighlightedText: (text: string | null) => void;
  toggleSidebar: () => void;
  toggleAiPanel: () => void;
  setSidebarOpen: (open: boolean) => void;
  setAiPanelOpen: (open: boolean) => void;
};

export const useWorkspaceContext = create<WorkspaceContextState>((set) => ({
  activeView: "overview",
  selectedEntity: null,
  highlightedText: null,
  sidebarOpen: true,
  aiPanelOpen: true,
  setActiveView: (view) => set({ activeView: view, selectedEntity: null }),
  setSelectedEntity: (entity) => set({ selectedEntity: entity }),
  setHighlightedText: (text) => set({ highlightedText: text }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setAiPanelOpen: (open) => set({ aiPanelOpen: open }),
}));
