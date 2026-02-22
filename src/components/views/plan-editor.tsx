"use client";

import { useEffect } from "react";
import {
  FileText,
  Target,
  Users,
  Lightbulb,
  Cpu,
  TrendingUp,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkspaceContext } from "@/stores/workspace-context";
import { usePlans } from "@/stores/artifact-store";

export function PlanEditorView({ projectId }: { projectId: string }) {
  const plans = usePlans();
  const setAiPanelOpen = useWorkspaceContext((s) => s.setAiPanelOpen);

  useEffect(() => {
    useWorkspaceContext.getState().setActiveView("plan");
  }, []);

  if (plans.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-6 py-[16px]">
          <h2 className="text-sm font-semibold">Implementation Plan</h2>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center max-w-sm">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">No plans yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ask Hannibal to create an implementation plan in the AI panel.
            </p>
            <button
              onClick={() => setAiPanelOpen(true)}
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Open AI Panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const plan = plans[plans.length - 1];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-[16px] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">{plan.title}</h2>
          <p className="text-xs text-muted-foreground">Implementation Plan</p>
        </div>
        {plans.length > 1 && (
          <Badge variant="secondary" className="text-xs">
            {plans.length} versions
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <PlanSection
            icon={Target}
            title="Problem Statement"
            color="text-red-400"
          >
            <p className="text-sm leading-relaxed">
              {plan.sections.problemStatement}
            </p>
          </PlanSection>

          <PlanSection
            icon={Users}
            title="Target Users"
            color="text-purple-400"
          >
            <div className="flex flex-wrap gap-2">
              {plan.sections.targetUsers.map((user, i) => (
                <Badge key={i} variant="secondary">
                  {user}
                </Badge>
              ))}
            </div>
          </PlanSection>

          <PlanSection
            icon={Lightbulb}
            title="Proposed Solution"
            color="text-yellow-400"
          >
            <p className="text-sm leading-relaxed">
              {plan.sections.proposedSolution}
            </p>
          </PlanSection>

          <PlanSection
            icon={Cpu}
            title="Technical Approach"
            color="text-blue-400"
          >
            <p className="text-sm leading-relaxed">
              {plan.sections.technicalApproach}
            </p>
          </PlanSection>

          <PlanSection
            icon={TrendingUp}
            title="Success Metrics"
            color="text-green-400"
          >
            <ul className="space-y-1.5">
              {plan.sections.successMetrics.map((metric, i) => (
                <li
                  key={i}
                  className="text-sm flex items-start gap-2"
                >
                  <span className="text-green-400 mt-1.5 h-1.5 w-1.5 rounded-full bg-green-400 shrink-0" />
                  {metric}
                </li>
              ))}
            </ul>
          </PlanSection>

          <PlanSection
            icon={AlertTriangle}
            title="Risks"
            color="text-orange-400"
          >
            <ul className="space-y-1.5">
              {plan.sections.risks.map((risk, i) => (
                <li
                  key={i}
                  className="text-sm flex items-start gap-2"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" />
                  {risk}
                </li>
              ))}
            </ul>
          </PlanSection>

          <PlanSection
            icon={Clock}
            title="Timeline"
            color="text-cyan-400"
          >
            <p className="text-sm leading-relaxed">
              {plan.sections.timeline}
            </p>
          </PlanSection>
        </div>
      </div>
    </div>
  );
}

function PlanSection({
  icon: Icon,
  title,
  color,
  children,
}: {
  icon: React.ElementType;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className={`h-4 w-4 ${color}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
