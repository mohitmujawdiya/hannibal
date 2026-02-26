import { useMemo } from "react";

import type { ViewType } from "@/stores/workspace-context";
import type { StoredArtifact } from "@/stores/artifact-store";
import {
  usePlans,
  usePrds,
  useFeatureTrees,
  usePersonas,
  useCompetitors,
  useRoadmaps,
} from "@/stores/artifact-store";
import { flattenTree, computeRiceScore } from "@/lib/rice-scoring";
import {
  parsePersonaMarkdown,
  parseCompetitorMarkdown,
  parseRoadmapMarkdown,
} from "@/lib/markdown-to-artifact";

export type ArtifactCoverage = {
  plan: boolean;
  prd: boolean;
  featureTree: boolean;
  personas: boolean;
  competitors: boolean;
  roadmap: boolean;
};

export type AttentionItem = {
  type: string;
  label: string;
  count: number;
  navigateTo: ViewType;
};

export type TopPriority = {
  title: string;
  parentPath: string[];
  riceScore: number;
};

export type RecentArtifact = {
  id: string;
  type: string;
  title: string;
  createdAt: number;
};

export type RoadmapDeadline = {
  title: string;
  endDate: string;
  status: string;
};

export type DashboardData = {
  coverage: ArtifactCoverage;
  coverageCount: number;
  coverageTotal: number;
  featuresScoredCount: number;
  featuresTotalCount: number;
  attentionItems: AttentionItem[];
  topPriorities: TopPriority[];
  recentArtifacts: RecentArtifact[];
  overdueItems: RoadmapDeadline[];
  upcomingItems: RoadmapDeadline[];
  hasArtifacts: boolean;
};

export function useDashboardData(): DashboardData {
  const plans = usePlans();
  const prds = usePrds();
  const trees = useFeatureTrees();
  const personas = usePersonas();
  const competitors = useCompetitors();
  const roadmaps = useRoadmaps();

  return useMemo(() => {
    const coverage: ArtifactCoverage = {
      plan: plans.length > 0,
      prd: prds.length > 0,
      featureTree: trees.length > 0,
      personas: personas.length > 0,
      competitors: competitors.length > 0,
      roadmap: roadmaps.length > 0,
    };

    const coverageCount = Object.values(coverage).filter(Boolean).length;
    const coverageTotal = Object.keys(coverage).length;

    // Feature scoring
    const lastTree = trees.length > 0 ? trees[trees.length - 1] : null;
    const flatFeatures = lastTree ? flattenTree(lastTree.children) : [];
    const leaves = flatFeatures.filter((f) => f.isLeaf);
    const featuresScoredCount = leaves.filter(
      (f) => f.riceScore != null,
    ).length;
    const featuresTotalCount = leaves.length;

    // Attention items
    const attentionItems: AttentionItem[] = [];

    const unscoredCount = featuresTotalCount - featuresScoredCount;
    if (unscoredCount > 0) {
      attentionItems.push({
        type: "features",
        label: `feature${unscoredCount !== 1 ? "s" : ""} without RICE scores`,
        count: unscoredCount,
        navigateTo: "priorities",
      });
    }

    const thinPlans = plans.filter(
      (p) => (p.content?.trim().length ?? 0) < 50,
    );
    if (thinPlans.length > 0) {
      attentionItems.push({
        type: "plan",
        label: `plan${thinPlans.length !== 1 ? "s" : ""} with minimal content`,
        count: thinPlans.length,
        navigateTo: "plan",
      });
    }

    const thinPrds = prds.filter(
      (p) => (p.content?.trim().length ?? 0) < 50,
    );
    if (thinPrds.length > 0) {
      attentionItems.push({
        type: "prd",
        label: `PRD${thinPrds.length !== 1 ? "s" : ""} with minimal content`,
        count: thinPrds.length,
        navigateTo: "prd",
      });
    }

    const incompletePersonas = personas.filter((p) => {
      if (!p.content) return true;
      const parsed = parsePersonaMarkdown(p.content);
      return parsed.goals.length === 0 || parsed.frustrations.length === 0;
    });
    if (incompletePersonas.length > 0) {
      attentionItems.push({
        type: "persona",
        label: `persona${incompletePersonas.length !== 1 ? "s" : ""} missing goals or frustrations`,
        count: incompletePersonas.length,
        navigateTo: "personas",
      });
    }

    const incompleteCompetitors = competitors.filter((c) => {
      if (!c.content) return true;
      const parsed = parseCompetitorMarkdown(c.content);
      return parsed.strengths.length === 0 || parsed.weaknesses.length === 0;
    });
    if (incompleteCompetitors.length > 0) {
      attentionItems.push({
        type: "competitor",
        label: `competitor${incompleteCompetitors.length !== 1 ? "s" : ""} missing strengths or weaknesses`,
        count: incompleteCompetitors.length,
        navigateTo: "competitors",
      });
    }

    // Top priorities
    const scoredLeaves = leaves
      .filter((f) => f.riceScore != null)
      .sort((a, b) => b.riceScore! - a.riceScore!)
      .slice(0, 5);

    const topPriorities: TopPriority[] = scoredLeaves.map((f) => ({
      title: f.node.title,
      parentPath: f.parentTitles,
      riceScore: f.riceScore!,
    }));

    // Recent artifacts
    const allArtifacts: StoredArtifact[] = [
      ...plans,
      ...prds,
      ...trees,
      ...personas,
      ...competitors,
      ...roadmaps,
    ];

    const recentArtifacts: RecentArtifact[] = allArtifacts
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 3)
      .map((a) => ({
        id: a.id,
        type: a.type,
        title: a.type === "featureTree" ? a.rootFeature : a.title,
        createdAt: a.createdAt,
      }));

    // Roadmap pulse
    const lastRoadmap =
      roadmaps.length > 0 ? roadmaps[roadmaps.length - 1] : null;
    let overdueItems: RoadmapDeadline[] = [];
    let upcomingItems: RoadmapDeadline[] = [];

    if (lastRoadmap) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const twoWeeksOut = new Date(today);
      twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);

      const todayStr = today.toISOString().slice(0, 10);
      const twoWeeksStr = twoWeeksOut.toISOString().slice(0, 10);

      for (const item of lastRoadmap.items) {
        if (item.status === "done") continue;
        if (item.endDate < todayStr) {
          overdueItems.push({
            title: item.title,
            endDate: item.endDate,
            status: item.status,
          });
        } else if (item.endDate <= twoWeeksStr) {
          upcomingItems.push({
            title: item.title,
            endDate: item.endDate,
            status: item.status,
          });
        }
      }

      overdueItems.sort((a, b) => a.endDate.localeCompare(b.endDate));
      upcomingItems.sort((a, b) => a.endDate.localeCompare(b.endDate));
    }

    return {
      coverage,
      coverageCount,
      coverageTotal,
      featuresScoredCount,
      featuresTotalCount,
      attentionItems,
      topPriorities,
      recentArtifacts,
      overdueItems,
      upcomingItems,
      hasArtifacts: allArtifacts.length > 0,
    };
  }, [plans, prds, trees, personas, competitors, roadmaps]);
}
