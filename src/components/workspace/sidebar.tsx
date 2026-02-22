"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  GitBranch,
  Map,
  BarChart3,
  Users,
  Swords,
  Search,
  Settings,
  Plus,
  ChevronDown,
  Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  type ViewType,
  useWorkspaceContext,
} from "@/stores/workspace-context";

type SidebarProps = {
  projectId: string;
  projectName?: string;
};

const viewItems: { id: ViewType; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "plan", label: "Plan", icon: FileText },
  { id: "prd", label: "PRD", icon: ClipboardList },
  { id: "features", label: "Features", icon: GitBranch },
  { id: "roadmap", label: "Roadmap", icon: Map },
  { id: "priorities", label: "Priorities", icon: BarChart3 },
  { id: "personas", label: "Personas", icon: Users },
  { id: "competitors", label: "Competitors", icon: Swords },
  { id: "research", label: "Research", icon: Search },
];

const demoProjects = [
  { id: "demo-1", name: "Fitness App" },
  { id: "demo-2", name: "SaaS Dashboard" },
  { id: "demo-3", name: "E-commerce Revamp" },
];

export function Sidebar({ projectId, projectName }: SidebarProps) {
  const activeView = useWorkspaceContext((s) => s.activeView);
  const setActiveView = useWorkspaceContext((s) => s.setActiveView);
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
          H
        </div>
        <span className="text-sm font-semibold tracking-tight">Hannibal</span>
      </div>

      <ScrollArea className="flex-1 px-2">
        {/* Projects */}
        <div className="mb-1">
          <button
            onClick={() => setProjectsExpanded(!projectsExpanded)}
            className="flex w-full items-center gap-1 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                !projectsExpanded && "-rotate-90"
              )}
            />
            Projects
          </button>
          {projectsExpanded && (
            <div className="space-y-0.5">
              {demoProjects.map((project) => (
                <button
                  key={project.id}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    project.id === projectId
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                  )}
                >
                  <Folder className="h-3.5 w-3.5" />
                  {project.name}
                </button>
              ))}
              <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Plus className="h-3 w-3" />
                New project
              </button>
            </div>
          )}
        </div>

        <Separator className="my-2" />

        {/* Views */}
        <div className="mb-1">
          <span className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Views
          </span>
          <div className="mt-1 space-y-0.5">
            {viewItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    activeView === item.id
                      ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </ScrollArea>

      {/* Bottom */}
      <Separator />
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="h-6 w-6 rounded-full bg-muted" />
        <Button variant="ghost" size="icon" className="ml-auto h-7 w-7">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
