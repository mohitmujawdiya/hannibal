import { tool, jsonSchema } from "ai";

const planTool = tool({
  description:
    "Generate an implementation plan. Use when the PM asks to create a plan, strategy, or outline for solving a problem.",
  inputSchema: jsonSchema<{
    title: string;
    problemStatement: string;
    targetUsers: string[];
    proposedSolution: string;
    technicalApproach: string;
    successMetrics: string[];
    risks: string[];
    timeline: string;
  }>({
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
  }),
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

const prdTool = tool({
  description:
    "Generate a Product Requirements Document. Use when the PM asks for a PRD, product spec, or requirements.",
  inputSchema: jsonSchema<{
    title: string;
    overview: string;
    userStories: string[];
    acceptanceCriteria: string[];
    technicalConstraints: string[];
    outOfScope: string[];
    successMetrics: string[];
    dependencies: string[];
  }>({
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
  }),
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

const personaTool = tool({
  description:
    "Generate a user persona. Use when the PM asks to define target users or user personas.",
  inputSchema: jsonSchema<{
    name: string;
    demographics: string;
    goals: string[];
    frustrations: string[];
    behaviors: string[];
    techProficiency: string;
    quote: string;
  }>({
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
  }),
  execute: async (params) => ({
    artifact: { type: "persona" as const, ...params },
    status: "generated",
  }),
});

const featureTreeTool = tool({
  description:
    "Generate a feature tree / hierarchy. Use when the PM asks to map out features or decompose a product.",
  inputSchema: jsonSchema<{
    rootFeature: string;
    children: { title: string; description?: string; children?: { title: string; description?: string }[] }[];
  }>({
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
  }),
  execute: async (params) => ({
    artifact: { type: "featureTree" as const, ...params },
    status: "generated",
  }),
});

const competitorTool = tool({
  description:
    "Generate a competitor analysis. Use when the PM asks to analyze competitors or the competitive landscape.",
  inputSchema: jsonSchema<{
    name: string;
    url?: string;
    positioning: string;
    strengths: string[];
    weaknesses: string[];
    pricing?: string;
    featureGaps: string[];
  }>({
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
  }),
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
