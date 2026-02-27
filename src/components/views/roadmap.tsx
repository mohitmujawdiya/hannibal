"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Map, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspaceContext } from "@/stores/workspace-context";
import { useProjectRoadmap } from "@/hooks/use-project-data";
import { useDebouncedMutation } from "@/hooks/use-debounced-mutation";
import { artifactToSyncInput } from "@/lib/transforms/roadmap";
import { roadmapToMarkdown } from "@/lib/artifact-to-markdown";
import { Skeleton } from "@/components/ui/skeleton";
import { RoadmapToolbar } from "./roadmap/roadmap-toolbar";
import { RoadmapTimeline } from "./roadmap/roadmap-timeline";
import { RoadmapItemDialog } from "./roadmap/roadmap-item-dialog";
import { ImportFeaturesDialog } from "./roadmap/import-features-dialog";
import { computeInitialRange, rangeForScale, bestTimeScale } from "@/lib/roadmap-utils";
import type { Range } from "dnd-timeline";
import type {
  RoadmapItem,
  RoadmapArtifact,
  RoadmapTimeScale,
} from "@/lib/artifact-types";

export function RoadmapView({ projectId }: { projectId: string }) {
  const setActiveView = useWorkspaceContext((s) => s.setActiveView);
  const setAiPanelOpen = useWorkspaceContext((s) => s.setAiPanelOpen);
  const aiPanelOpen = useWorkspaceContext((s) => s.aiPanelOpen);
  const setSelectedEntity = useWorkspaceContext((s) => s.setSelectedEntity);
  const { roadmap: dbRoadmap, isLoading, syncRoadmap, remove } = useProjectRoadmap(projectId);

  useEffect(() => {
    setActiveView("roadmap");
    return () => setSelectedEntity(null);
  }, [setActiveView, setSelectedEntity]);

  // Local state for responsive editing
  const [localRoadmap, setLocalRoadmap] = useState<(RoadmapArtifact & { id: string }) | null>(null);
  const hasPendingEdits = useRef(false);

  useEffect(() => {
    if (dbRoadmap && !hasPendingEdits.current) {
      setLocalRoadmap(dbRoadmap);
    }
  }, [dbRoadmap]);

  const roadmap = localRoadmap ?? dbRoadmap;

  // Auto-pick the best time scale based on item spread
  const [range, setRange] = useState<Range>(() => {
    if (!roadmap) return computeInitialRange([], "weekly");
    const scale = bestTimeScale(roadmap.items);
    return computeInitialRange(roadmap.items, scale);
  });

  // Re-compute range & scale when roadmap first appears
  const roadmapId = roadmap?.id;
  useEffect(() => {
    if (roadmap) {
      const scale = bestTimeScale(roadmap.items);
      setRange(computeInitialRange(roadmap.items, scale));
    }
    // Only when the roadmap identity changes, not on every item edit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmapId]);

  // Dialog state
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const syncAsync = useCallback(
    async (rm: RoadmapArtifact & { id: string }) => {
      const input = artifactToSyncInput(rm);
      await syncRoadmap({ roadmapId: rm.id, ...input });
      hasPendingEdits.current = false;
    },
    [syncRoadmap],
  );
  const { debouncedFn: debouncedSync } = useDebouncedMutation(syncAsync, 300);

  const handleUpdate = useCallback(
    (partial: Partial<RoadmapArtifact>) => {
      if (!roadmap) return;
      const merged: RoadmapArtifact & { id: string } = { ...roadmap, ...partial };
      hasPendingEdits.current = true;
      setLocalRoadmap(merged);
      debouncedSync(merged);
    },
    [roadmap, debouncedSync],
  );

  const handleTimeScaleChange = useCallback(
    (timeScale: RoadmapTimeScale) => {
      handleUpdate({ timeScale });
      const center = (range.start + range.end) / 2;
      setRange(rangeForScale(timeScale, center));
    },
    [handleUpdate, range],
  );

  const handleItemClick = useCallback((item: RoadmapItem) => {
    setSelectedEntity({
      type: "roadmapItem",
      id: item.id,
      data: {
        title: item.title,
        description: item.description,
        startDate: item.startDate,
        endDate: item.endDate,
        status: item.status,
        type: item.type,
      },
    });
    setEditingItem(item);
    setItemDialogOpen(true);
  }, [setSelectedEntity]);

  const handleAddItem = useCallback(() => {
    setEditingItem(null);
    setItemDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback((open: boolean) => {
    setItemDialogOpen(open);
    if (!open) setSelectedEntity(null);
  }, [setSelectedEntity]);

  const handleSaveItem = useCallback(
    (item: RoadmapItem) => {
      if (!roadmap) return;
      const exists = roadmap.items.some((it) => it.id === item.id);
      const newItems = exists
        ? roadmap.items.map((it) => (it.id === item.id ? item : it))
        : [...roadmap.items, item];
      handleUpdate({ items: newItems });
    },
    [roadmap, handleUpdate],
  );

  const handleDeleteItem = useCallback(
    (id: string) => {
      if (!roadmap) return;
      handleUpdate({ items: roadmap.items.filter((it) => it.id !== id) });
    },
    [roadmap, handleUpdate],
  );

  const handleImport = useCallback(
    (newItems: RoadmapItem[]) => {
      if (!roadmap) return;
      handleUpdate({ items: [...roadmap.items, ...newItems] });
    },
    [roadmap, handleUpdate],
  );

  const getMarkdown = useCallback(() => {
    if (!roadmap) return "";
    return roadmapToMarkdown(roadmap);
  }, [roadmap]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-6 h-12 flex items-center">
          <h2 className="text-base font-semibold">Roadmap</h2>
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Empty state
  if (!roadmap) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-6 h-12 flex items-center">
          <h2 className="text-base font-semibold">Roadmap</h2>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center max-w-sm">
            <Map className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">Roadmap</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Plan your timeline with swim lanes, milestones, and feature bars.
              Ask the AI to generate a roadmap, or create one manually.
            </p>
            {!aiPanelOpen && (
              <Button variant="outline" size="sm" onClick={() => setAiPanelOpen(true)}>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Open AI Panel
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <RoadmapToolbar
        title={roadmap.title}
        range={range}
        onTimeScaleChange={handleTimeScaleChange}
        onAddItem={handleAddItem}
        onImportFeatures={() => setImportDialogOpen(true)}
        onDelete={() => remove(roadmap.id)}
        getMarkdown={getMarkdown}
      />

      <div className="flex-1 min-h-0 overflow-auto px-4 py-5">
        <RoadmapTimeline
          artifact={roadmap}
          range={range}
          onRangeChanged={setRange}
          onUpdate={handleUpdate}
          onItemClick={handleItemClick}
        />
      </div>

      <RoadmapItemDialog
        open={itemDialogOpen}
        onOpenChange={handleDialogClose}
        item={editingItem}
        lanes={roadmap.lanes}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
      />

      <ImportFeaturesDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        lanes={roadmap.lanes}
        existingItems={roadmap.items}
        onImport={handleImport}
        projectId={projectId}
      />
    </div>
  );
}
