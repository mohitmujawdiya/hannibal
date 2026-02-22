import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type {
  Artifact,
  PlanArtifact,
  PrdArtifact,
  PersonaArtifact,
  FeatureTreeArtifact,
  CompetitorArtifact,
} from "@/lib/artifact-types";

type StoredArtifact = Artifact & { id: string; createdAt: number };

type ArtifactStore = {
  artifacts: StoredArtifact[];
  addArtifact: (artifact: Artifact) => string;
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
      partialize: (state) => ({ artifacts: state.artifacts }),
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
