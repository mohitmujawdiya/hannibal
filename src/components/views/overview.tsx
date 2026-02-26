"use client";

import { useCallback, useEffect } from "react";
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
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useWorkspaceContext, type ViewType } from "@/stores/workspace-context";
import { useArtifactStore } from "@/stores/artifact-store";
import { useDashboardData } from "./dashboard/use-dashboard-data";
import { ProjectHealth } from "./dashboard/project-health";
import { AttentionNeeded } from "./dashboard/attention-needed";
import { NextUp } from "./dashboard/next-up";
import { RecentActivity } from "./dashboard/recent-activity";
import { RoadmapPulse } from "./dashboard/roadmap-pulse";

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
    artifactType: "roadmap",
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

function OnboardingCards({
  onNavigate,
}: {
  onNavigate: (view: ViewType) => void;
}) {
  return (
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
              onClick={() => onNavigate(action.view)}
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
  );
}

function Dashboard({ onNavigate }: { onNavigate: (view: ViewType) => void }) {
  const data = useDashboardData();

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <ProjectHealth
        coverage={data.coverage}
        coverageCount={data.coverageCount}
        coverageTotal={data.coverageTotal}
        featuresScoredCount={data.featuresScoredCount}
        featuresTotalCount={data.featuresTotalCount}
        onNavigate={onNavigate}
      />

      <div className="columns-1 md:columns-2 gap-4 space-y-4">
        <div className="break-inside-avoid">
          <AttentionNeeded
            items={data.attentionItems}
            onNavigate={onNavigate}
          />
        </div>
        <div className="break-inside-avoid">
          <NextUp priorities={data.topPriorities} onNavigate={onNavigate} />
        </div>
        <div className="break-inside-avoid">
          <RecentActivity
            artifacts={data.recentArtifacts}
            onNavigate={onNavigate}
          />
        </div>
        <div className="break-inside-avoid">
          <RoadmapPulse
            overdueItems={data.overdueItems}
            upcomingItems={data.upcomingItems}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </div>
  );
}

export function OverviewView({ projectId }: { projectId: string }) {
  const setActiveView = useWorkspaceContext((s) => s.setActiveView);
  const artifacts = useArtifactStore((s) => s.artifacts);

  useEffect(() => {
    useWorkspaceContext.getState().setActiveView("overview");
  }, []);

  const handleNavigate = useCallback(
    (view: ViewType) => {
      setActiveView(view);
    },
    [setActiveView],
  );

  const hasArtifacts = artifacts.length > 0;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 h-12 flex items-center">
        <h2 className="text-base font-semibold">
          {hasArtifacts ? "Dashboard" : "Overview"}
        </h2>
      </div>

      <div className="flex-1 overflow-auto p-8">
        {hasArtifacts ? (
          <Dashboard onNavigate={handleNavigate} />
        ) : (
          <OnboardingCards onNavigate={handleNavigate} />
        )}
      </div>
    </div>
  );
}
