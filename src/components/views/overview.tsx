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
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkspaceContext, type ViewType } from "@/stores/workspace-context";
import { useArtifactStore } from "@/stores/artifact-store";

const quickActions: {
  view: ViewType;
  title: string;
  description: string;
  icon: React.ElementType;
  artifactType?: string;
}[] = [
  {
    view: "plan",
    title: "Implementation Plan",
    description: "Create or refine your product plan with AI",
    icon: FileText,
    artifactType: "plan",
  },
  {
    view: "prd",
    title: "PRD",
    description: "Generate product requirements from your plan",
    icon: ClipboardList,
    artifactType: "prd",
  },
  {
    view: "features",
    title: "Feature Tree",
    description: "Map out your product's feature hierarchy",
    icon: GitBranch,
    artifactType: "featureTree",
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
    artifactType: "persona",
  },
  {
    view: "competitors",
    title: "Competitors",
    description: "Analyze the competitive landscape",
    icon: Swords,
    artifactType: "competitor",
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
  const artifacts = useArtifactStore((s) => s.artifacts);

  useEffect(() => {
    useWorkspaceContext.getState().setActiveView("overview");
  }, []);

  const artifactCounts = artifacts.reduce<Record<string, number>>(
    (acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 h-11 flex items-center">
        <h2 className="text-sm font-semibold">Overview</h2>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back
            </h1>
            <p className="text-muted-foreground mt-1">
              {artifacts.length > 0 ? (
                <>
                  You have{" "}
                  <span className="text-foreground font-medium">
                    {artifacts.length} artifact
                    {artifacts.length !== 1 ? "s" : ""}
                  </span>{" "}
                  generated. Continue building or explore a view below.
                </>
              ) : (
                <>
                  Start by describing your product idea in the AI panel, or jump
                  into any view below.
                </>
              )}
            </p>
          </div>

          {artifacts.length > 0 && (
            <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>AI-generated artifacts:</span>
              {Object.entries(artifactCounts).map(([type, count]) => (
                <Badge key={type} variant="secondary" className="text-[10px]">
                  {count} {type}
                </Badge>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const count = action.artifactType
                ? artifactCounts[action.artifactType] || 0
                : 0;
              return (
                <Card
                  key={action.view}
                  className="group cursor-pointer transition-colors hover:bg-accent/50"
                  onClick={() => setActiveView(action.view)}
                >
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between">
                      <Icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <div className="flex items-center gap-1.5">
                        {count > 0 && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-0.5 text-green-400" />
                            {count}
                          </Badge>
                        )}
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
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
    </div>
  );
}
