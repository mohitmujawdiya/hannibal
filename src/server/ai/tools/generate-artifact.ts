import { defineTool } from "@/lib/schema";

type PlanParams = {
  title: string;
  problemStatement: string;
  targetUsers: string[];
  proposedSolution: string;
  technicalApproach: string;
  successMetrics: string[];
  risks: string[];
  timeline: string;
};

const planTool = defineTool<PlanParams, unknown>({
  description:
    "Generate an implementation plan. Use when the PM asks to create a plan, strategy, or outline for solving a problem.",
  schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Plan title" },
      problemStatement: { type: "string", description: "Clear problem definition" },
      targetUsers: { type: "array", items: { type: "string" }, description: "Target user segments" },
      proposedSolution: { type: "string", description: "High-level solution description" },
      technicalApproach: { type: "string", description: "Technical strategy overview" },
      successMetrics: { type: "array", items: { type: "string" }, description: "Measurable success criteria" },
      risks: { type: "array", items: { type: "string" }, description: "Key risks and mitigations" },
      timeline: { type: "string", description: "Estimated timeline overview" },
    },
    required: ["title", "problemStatement", "targetUsers", "proposedSolution", "technicalApproach", "successMetrics", "risks", "timeline"],
  },
  execute: async (params) => ({
    artifact: {
      type: "plan" as const,
      title: params.title,
      sections: {
        problemStatement: params.problemStatement,
        targetUsers: params.targetUsers,
        proposedSolution: params.proposedSolution,
        technicalApproach: params.technicalApproach,
        successMetrics: params.successMetrics,
        risks: params.risks,
        timeline: params.timeline,
      },
    },
    status: "generated",
  }),
});

type PrdParams = {
  title: string;
  overview: string;
  userStories: string[];
  acceptanceCriteria: string[];
  technicalConstraints: string[];
  outOfScope: string[];
  successMetrics: string[];
  dependencies: string[];
};

const prdTool = defineTool<PrdParams, unknown>({
  description:
    "Generate a Product Requirements Document. Use when the PM asks for a PRD, product spec, or requirements.",
  schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "PRD title" },
      overview: { type: "string", description: "Product overview" },
      userStories: { type: "array", items: { type: "string" }, description: "User stories" },
      acceptanceCriteria: { type: "array", items: { type: "string" }, description: "Acceptance criteria" },
      technicalConstraints: { type: "array", items: { type: "string" }, description: "Technical constraints" },
      outOfScope: { type: "array", items: { type: "string" }, description: "Out of scope items" },
      successMetrics: { type: "array", items: { type: "string" }, description: "Success metrics" },
      dependencies: { type: "array", items: { type: "string" }, description: "Dependencies" },
    },
    required: ["title", "overview", "userStories", "acceptanceCriteria", "technicalConstraints", "outOfScope", "successMetrics", "dependencies"],
  },
  execute: async (params) => ({
    artifact: {
      type: "prd" as const,
      title: params.title,
      sections: {
        overview: params.overview,
        userStories: params.userStories,
        acceptanceCriteria: params.acceptanceCriteria,
        technicalConstraints: params.technicalConstraints,
        outOfScope: params.outOfScope,
        successMetrics: params.successMetrics,
        dependencies: params.dependencies,
      },
    },
    status: "generated",
  }),
});

type PersonaParams = {
  name: string;
  demographics: string;
  goals: string[];
  frustrations: string[];
  behaviors: string[];
  techProficiency: string;
  quote: string;
};

const personaTool = defineTool<PersonaParams, unknown>({
  description:
    "Generate a user persona. Use when the PM asks to define target users or user personas.",
  schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Persona name" },
      demographics: { type: "string", description: "Age, occupation, location" },
      goals: { type: "array", items: { type: "string" }, description: "Goals" },
      frustrations: { type: "array", items: { type: "string" }, description: "Pain points" },
      behaviors: { type: "array", items: { type: "string" }, description: "Behavioral patterns" },
      techProficiency: { type: "string", description: "Technical skill level" },
      quote: { type: "string", description: "A representative quote" },
    },
    required: ["name", "demographics", "goals", "frustrations", "behaviors", "techProficiency", "quote"],
  },
  execute: async (params) => ({
    artifact: { type: "persona" as const, ...params },
    status: "generated",
  }),
});

type FeatureTreeParams = {
  rootFeature: string;
  children: { title: string; description?: string; children?: { title: string; description?: string }[] }[];
};

const featureTreeTool = defineTool<FeatureTreeParams, unknown>({
  description:
    "Generate a feature tree / hierarchy. Use when the PM asks to map out features or decompose a product.",
  schema: {
    type: "object",
    properties: {
      rootFeature: { type: "string", description: "Root product name" },
      children: {
        type: "array",
        description: "Top-level feature categories",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            children: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                },
                required: ["title"],
              },
            },
          },
          required: ["title"],
        },
      },
    },
    required: ["rootFeature", "children"],
  },
  execute: async (params) => ({
    artifact: { type: "featureTree" as const, ...params },
    status: "generated",
  }),
});

type CompetitorParams = {
  name: string;
  url?: string;
  positioning: string;
  strengths: string[];
  weaknesses: string[];
  pricing?: string;
  featureGaps: string[];
};

const competitorTool = defineTool<CompetitorParams, unknown>({
  description:
    "Generate a competitor analysis. Use when the PM asks to analyze competitors or the competitive landscape.",
  schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Competitor name" },
      url: { type: "string", description: "Website URL" },
      positioning: { type: "string", description: "Market positioning" },
      strengths: { type: "array", items: { type: "string" }, description: "Key strengths" },
      weaknesses: { type: "array", items: { type: "string" }, description: "Key weaknesses" },
      pricing: { type: "string", description: "Pricing model" },
      featureGaps: { type: "array", items: { type: "string" }, description: "Feature gaps (opportunities)" },
    },
    required: ["name", "positioning", "strengths", "weaknesses", "featureGaps"],
  },
  execute: async (params) => ({
    artifact: { type: "competitor" as const, ...params },
    status: "generated",
  }),
});

export const artifactTools = {
  generatePlan: planTool,
  generatePRD: prdTool,
  generatePersona: personaTool,
  generateFeatureTree: featureTreeTool,
  generateCompetitor: competitorTool,
};
