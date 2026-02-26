import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";
import type {
  Artifact,
  PlanArtifact,
  PrdArtifact,
  PersonaArtifact,
  FeatureTreeArtifact,
  CompetitorArtifact,
  RoadmapArtifact,
} from "@/lib/artifact-types";
import { personaToMarkdown, competitorToMarkdown, featureTreeToContentMarkdown } from "@/lib/artifact-to-markdown";

type StoredArtifact = Artifact & { id: string; createdAt: number };

type ArtifactStore = {
  artifacts: StoredArtifact[];
  addArtifact: (artifact: Artifact) => string;
  addArtifactRaw: (artifact: StoredArtifact) => void;
  removeArtifact: (id: string) => void;
  updateArtifact: (id: string, artifact: Partial<Artifact>) => void;
};

let counter = 0;

export const useArtifactStore = create<ArtifactStore>()(
  persist(
    (set) => ({
      artifacts: [],

      addArtifact: (artifact) => {
        const id = `artifact-${Date.now()}-${++counter}`;
        set((s) => ({
          artifacts: [...s.artifacts, { ...artifact, id, createdAt: Date.now() }],
        }));
        return id;
      },

      addArtifactRaw: (artifact) =>
        set((s) => ({ artifacts: [...s.artifacts, artifact] })),

      removeArtifact: (id) =>
        set((s) => ({ artifacts: s.artifacts.filter((a) => a.id !== id) })),

      updateArtifact: (id, partial) =>
        set((s) => ({
          artifacts: s.artifacts.map((a) =>
            a.id === id ? ({ ...a, ...partial } as StoredArtifact) : a
          ),
        })),
    }),
    {
      name: "hannibal:artifacts",
      version: 3,
      partialize: (state) => ({ artifacts: state.artifacts }),
      migrate: (persisted, version) => {
        const state = persisted as { artifacts: StoredArtifact[] };
        if (version < 2) {
          state.artifacts = state.artifacts.map((a) => {
            if (a.type === "persona" && !a.content) {
              const legacy = a as StoredArtifact & PersonaArtifact;
              return {
                ...a,
                title: legacy.name ?? legacy.title ?? "Persona",
                content: personaToMarkdown(legacy),
              } as StoredArtifact;
            }
            if (a.type === "competitor" && !a.content) {
              const legacy = a as StoredArtifact & CompetitorArtifact;
              return {
                ...a,
                title: legacy.name ?? legacy.title ?? "Competitor",
                content: competitorToMarkdown(legacy),
              } as StoredArtifact;
            }
            return a;
          });
        }
        if (version < 3) {
          state.artifacts = state.artifacts.map((a) => {
            if (a.type === "featureTree" && !a.content) {
              const tree = a as StoredArtifact & FeatureTreeArtifact;
              return {
                ...a,
                content: featureTreeToContentMarkdown(tree.rootFeature, tree.children),
              } as StoredArtifact;
            }
            return a;
          });
        }
        return state;
      },
    },
  ),
);

export type { StoredArtifact };

export const usePlans = () =>
  useArtifactStore(
    useShallow((s) =>
      s.artifacts.filter(
        (a): a is StoredArtifact & PlanArtifact => a.type === "plan"
      )
    )
  );

export const usePrds = () =>
  useArtifactStore(
    useShallow((s) =>
      s.artifacts.filter(
        (a): a is StoredArtifact & PrdArtifact => a.type === "prd"
      )
    )
  );

export const usePersonas = () =>
  useArtifactStore(
    useShallow((s) =>
      s.artifacts.filter(
        (a): a is StoredArtifact & PersonaArtifact => a.type === "persona"
      )
    )
  );

export const useFeatureTrees = () =>
  useArtifactStore(
    useShallow((s) =>
      s.artifacts.filter(
        (a): a is StoredArtifact & FeatureTreeArtifact =>
          a.type === "featureTree"
      )
    )
  );

export const useCompetitors = () =>
  useArtifactStore(
    useShallow((s) =>
      s.artifacts.filter(
        (a): a is StoredArtifact & CompetitorArtifact =>
          a.type === "competitor"
      )
    )
  );

export const useRoadmaps = () =>
  useArtifactStore(
    useShallow((s) =>
      s.artifacts.filter(
        (a): a is StoredArtifact & RoadmapArtifact =>
          a.type === "roadmap"
      )
    )
  );

function getArtifactLabel(a: StoredArtifact): string {
  if (a.type === "featureTree") return a.rootFeature;
  return a.title || "Untitled";
}

export function softDeleteArtifact(id: string) {
  const store = useArtifactStore.getState();
  const artifact = store.artifacts.find((a) => a.id === id);
  if (!artifact) return;

  store.removeArtifact(id);

  toast("Artifact deleted", {
    description: getArtifactLabel(artifact),
    action: {
      label: "Undo",
      onClick: () => {
        useArtifactStore.getState().addArtifactRaw(artifact);
      },
    },
    duration: 5000,
  });
}
