"use client";

import { useEffect } from "react";
import {
  ClipboardList,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Link2,
  Users,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkspaceContext } from "@/stores/workspace-context";
import { usePrds } from "@/stores/artifact-store";

export function PrdEditorView({ projectId }: { projectId: string }) {
  const prds = usePrds();
  const setAiPanelOpen = useWorkspaceContext((s) => s.setAiPanelOpen);

  useEffect(() => {
    useWorkspaceContext.getState().setActiveView("prd");
  }, []);

  if (prds.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-6 py-[16px]">
          <h2 className="text-sm font-semibold">Product Requirements</h2>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center max-w-sm">
            <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">No PRDs yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ask Hannibal to generate a PRD for your product.
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

  const prd = prds[prds.length - 1];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-[16px] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">{prd.title}</h2>
          <p className="text-xs text-muted-foreground">
            Product Requirements Document
          </p>
        </div>
        {prds.length > 1 && (
          <Badge variant="secondary" className="text-xs">
            {prds.length} versions
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <PrdSection icon={FileText} title="Overview" color="text-blue-400">
            <p className="text-sm leading-relaxed">
              {prd.sections.overview}
            </p>
          </PrdSection>

          <PrdSection icon={Users} title="User Stories" color="text-purple-400">
            <ul className="space-y-2">
              {prd.sections.userStories.map((story, i) => (
                <li
                  key={i}
                  className="text-sm bg-muted/50 rounded-lg px-3 py-2"
                >
                  {story}
                </li>
              ))}
            </ul>
          </PrdSection>

          <PrdSection
            icon={CheckCircle2}
            title="Acceptance Criteria"
            color="text-green-400"
          >
            <ul className="space-y-1.5">
              {prd.sections.acceptanceCriteria.map((criteria, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400 mt-0.5 shrink-0" />
                  {criteria}
                </li>
              ))}
            </ul>
          </PrdSection>

          <PrdSection
            icon={AlertTriangle}
            title="Technical Constraints"
            color="text-orange-400"
          >
            <ul className="space-y-1.5">
              {prd.sections.technicalConstraints.map((constraint, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" />
                  {constraint}
                </li>
              ))}
            </ul>
          </PrdSection>

          <PrdSection
            icon={XCircle}
            title="Out of Scope"
            color="text-red-400"
          >
            <ul className="space-y-1.5">
              {prd.sections.outOfScope.map((item, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <XCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </PrdSection>

          <PrdSection
            icon={TrendingUp}
            title="Success Metrics"
            color="text-green-400"
          >
            <ul className="space-y-1.5">
              {prd.sections.successMetrics.map((metric, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-400 shrink-0" />
                  {metric}
                </li>
              ))}
            </ul>
          </PrdSection>

          <PrdSection
            icon={Link2}
            title="Dependencies"
            color="text-cyan-400"
          >
            <div className="flex flex-wrap gap-2">
              {prd.sections.dependencies.map((dep, i) => (
                <Badge key={i} variant="secondary">
                  {dep}
                </Badge>
              ))}
            </div>
          </PrdSection>
        </div>
      </div>
    </div>
  );
}

function PrdSection({
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
