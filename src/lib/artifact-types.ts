export type ArtifactType = "plan" | "prd" | "persona" | "featureTree" | "competitor";

/** Legacy sections format — used only for migration from persisted data */
export type PlanSections = {
  problemStatement: string;
  targetUsers: string[];
  proposedSolution: string;
  technicalApproach: string;
  successMetrics: string[];
  risks: string[];
  timeline: string;
};

export type PlanArtifact = {
  type: "plan";
  title: string;
  /** Markdown content. Legacy artifacts may have sections instead. */
  content?: string;
  /** @deprecated Migrated to content. Present only in legacy persisted artifacts. */
  sections?: PlanSections;
};

/** Legacy sections format — used only for migration from persisted data */
export type PrdSections = {
  overview: string;
  userStories: string[];
  acceptanceCriteria: string[];
  technicalConstraints: string[];
  outOfScope: string[];
  successMetrics: string[];
  dependencies: string[];
};

export type PrdArtifact = {
  type: "prd";
  title: string;
  /** Markdown content. Legacy artifacts may have sections instead. */
  content?: string;
  /** @deprecated Migrated to content. Present only in legacy persisted artifacts. */
  sections?: PrdSections;
};

export type PersonaArtifact = {
  type: "persona";
  name: string;
  demographics: string;
  goals: string[];
  frustrations: string[];
  behaviors: string[];
  techProficiency: string;
  quote: string;
};

export type FeatureTreeArtifact = {
  type: "featureTree";
  rootFeature: string;
  children: FeatureNode[];
};

export type FeatureNode = {
  title: string;
  description?: string;
  children?: FeatureNode[];
  reach?: number;
  impact?: number;
  confidence?: number;
  effort?: number;
};

export type CompetitorArtifact = {
  type: "competitor";
  name: string;
  url?: string;
  positioning: string;
  strengths: string[];
  weaknesses: string[];
  pricing?: string;
  featureGaps: string[];
};

export type Artifact =
  | PlanArtifact
  | PrdArtifact
  | PersonaArtifact
  | FeatureTreeArtifact
  | CompetitorArtifact;
