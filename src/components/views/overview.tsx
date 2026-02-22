"use client";

import { useEffect } from "react";
import {
  FileText,
  ClipboardList,
  GitBranch,
  Map,
  BarChart3,
  Users,
  Swords,
  Search,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useWorkspaceContext, type ViewType } from "@/stores/workspace-context";

const quickActions: {
  view: ViewType;
  title: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    view: "plan",
    title: "Implementation Plan",
    description: "Create or refine your product plan with AI",
    icon: FileText,
  },
  {
    view: "prd",
    title: "PRD",
    description: "Generate product requirements from your plan",
    icon: ClipboardList,
  },
  {
    view: "features",
    title: "Feature Tree",
    description: "Map out your product's feature hierarchy",
    icon: GitBranch,
  },
  {
    view: "roadmap",
    title: "Roadmap",
    description: "Plan your timeline and milestones",
    icon: Map,
  },
  {
    view: "priorities",
    title: "Priorities",
    description: "Score and rank features with RICE framework",
    icon: BarChart3,
  },
  {
    view: "personas",
    title: "Personas",
    description: "Define your target users and their journeys",
    icon: Users,
  },
  {
    view: "competitors",
    title: "Competitors",
    description: "Analyze the competitive landscape",
    icon: Swords,
  },
  {
    view: "research",
    title: "Market Research",
    description: "Validate your ideas with market data",
    icon: Search,
  },
];

export function OverviewView({ projectId }: { projectId: string }) {
  const setActiveView = useWorkspaceContext((s) => s.setActiveView);

  useEffect(() => {
    useWorkspaceContext.getState().setActiveView("overview");
  }, []);

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground mt-1">
            Start by describing your product idea in the AI panel, or jump into
            any view below.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.view}
                className="group cursor-pointer transition-colors hover:bg-accent/50"
                onClick={() => setActiveView(action.view)}
              >
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between">
                    <Icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <CardTitle className="text-sm font-medium mt-2">
                    {action.title}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {action.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
