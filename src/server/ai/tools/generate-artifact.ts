import { tool, jsonSchema } from "ai";

const planTool = tool({
  description:
    "Generate an implementation plan. Use when the PM asks to create a plan, strategy, or outline for solving a problem. Output structured markdown with ## headings for each section.",
  inputSchema: jsonSchema<{ title: string; content: string }>({
    type: "object",
    properties: {
      title: { type: "string", description: "Plan title" },
      content: {
        type: "string",
        description:
          "Full plan as markdown. Use ## Problem Statement, ## Target Users (- bullets), ## Proposed Solution, ## Technical Approach, ## Success Metrics (- bullets), ## Risks (- bullets), ## Timeline.",
      },
    },
    required: ["title", "content"],
  }),
  execute: async (params) => ({
    artifact: {
      type: "plan" as const,
      title: params.title,
      content: params.content,
    },
    status: "generated",
  }),
});

const prdTool = tool({
  description:
    "Generate a Product Requirements Document. Use when the PM asks for a PRD, product spec, or requirements. Output structured markdown with ## headings for each section.",
  inputSchema: jsonSchema<{ title: string; content: string }>({
    type: "object",
    properties: {
      title: { type: "string", description: "PRD title" },
      content: {
        type: "string",
        description:
          "Full PRD as markdown. Use ## Overview, ## User Stories (- bullets), ## Acceptance Criteria (- bullets), ## Technical Constraints (- bullets), ## Out of Scope (- bullets), ## Success Metrics (- bullets), ## Dependencies (- bullets).",
      },
    },
    required: ["title", "content"],
  }),
  execute: async (params) => ({
    artifact: {
      type: "prd" as const,
      title: params.title,
      content: params.content,
    },
    status: "generated",
  }),
});

const personaTool = tool({
  description:
    "Generate a user persona. Use when the PM asks to define target users or user personas. Output structured markdown.",
  inputSchema: jsonSchema<{ title: string; content: string }>({
    type: "object",
    properties: {
      title: { type: "string", description: "Persona name" },
      content: {
        type: "string",
        description:
          "Full persona as markdown. Use this exact format:\n## Name\n**Demographics:** age, occupation, location\n**Tech Proficiency:** level\n> \"A representative quote\"\n\n**Goals:**\n- goal1\n- goal2\n\n**Frustrations:**\n- frustration1\n\n**Behaviors:**\n- behavior1",
      },
    },
    required: ["title", "content"],
  }),
  execute: async (params) => ({
    artifact: {
      type: "persona" as const,
      title: params.title,
      content: params.content,
    },
    status: "generated",
  }),
});

const featureNodeSchema = {
  type: "object" as const,
  properties: {
    title: { type: "string" as const },
    description: {
      type: "string" as const,
      description:
        "Contextual description — adapt to the feature: strategic summary for groups, acceptance criteria/edge cases for leaf features, technical constraints for infra features. Supports markdown.",
    },
    children: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          title: { type: "string" as const },
          description: {
            type: "string" as const,
            description:
              "Contextual description for this feature. Supports markdown.",
          },
          children: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                title: { type: "string" as const },
                description: {
                  type: "string" as const,
                  description:
                    "Contextual description for this leaf feature. Supports markdown.",
                },
              },
              required: ["title", "description"],
            },
          },
        },
        required: ["title", "description"],
      },
    },
  },
  required: ["title", "description"],
};

const featureTreeTool = tool({
  description:
    "Generate a feature tree / hierarchy. Use when the PM asks to map out features or decompose a product. ALWAYS include a description for every feature node — adapt the content to the feature's role (strategic summary for groups, acceptance criteria for leaves, technical notes for infra).",
  inputSchema: jsonSchema<{
    rootFeature: string;
    children: { title: string; description: string; children?: { title: string; description: string; children?: { title: string; description: string }[] }[] }[];
  }>({
    type: "object",
    properties: {
      rootFeature: { type: "string", description: "Root product name" },
      children: {
        type: "array",
        description: "Top-level feature categories",
        items: featureNodeSchema,
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
    "Generate a competitor analysis. Use when the PM asks to analyze competitors or the competitive landscape. Output structured markdown.",
  inputSchema: jsonSchema<{ title: string; content: string }>({
    type: "object",
    properties: {
      title: { type: "string", description: "Competitor name" },
      content: {
        type: "string",
        description:
          "Full competitor analysis as markdown. Use this exact format:\n## Name\n**URL:** https://example.com\n**Positioning:** market positioning\n**Pricing:** pricing model\n\n**Strengths:**\n- strength1\n\n**Weaknesses:**\n- weakness1\n\n**Feature Gaps:**\n- gap1",
      },
    },
    required: ["title", "content"],
  }),
  execute: async (params) => ({
    artifact: {
      type: "competitor" as const,
      title: params.title,
      content: params.content,
    },
    status: "generated",
  }),
});

type ScoredFeature = {
  featureTitle: string;
  parentPath: string[];
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  rationale: string;
};

const suggestPrioritiesTool = tool({
  description:
    "Suggest RICE priority scores for features in the feature tree. Use when the PM asks to score, prioritize, or rank features. Provide scores for each leaf feature (or key features if the tree is large). Reach: 1-10, Impact: 0.25/0.5/1/2/3, Confidence: 50/80/100, Effort: person-weeks.",
  inputSchema: jsonSchema<{ scores: ScoredFeature[] }>({
    type: "object",
    properties: {
      scores: {
        type: "array",
        description: "RICE scores for each feature",
        items: {
          type: "object",
          properties: {
            featureTitle: {
              type: "string",
              description: "Exact title of the feature node",
            },
            parentPath: {
              type: "array",
              items: { type: "string" },
              description:
                "Parent feature titles from root to immediate parent (empty for top-level)",
            },
            reach: {
              type: "number",
              description: "Reach score 1-10 (how many users affected)",
              minimum: 1,
              maximum: 10,
            },
            impact: {
              type: "number",
              description:
                "Impact score: 0.25 (minimal), 0.5 (low), 1 (medium), 2 (high), 3 (massive)",
              enum: [0.25, 0.5, 1, 2, 3],
            },
            confidence: {
              type: "number",
              description: "Confidence percentage: 50, 80, or 100",
              enum: [50, 80, 100],
            },
            effort: {
              type: "number",
              description: "Effort in person-weeks (minimum 0.5)",
              minimum: 0.5,
            },
            rationale: {
              type: "string",
              description: "Brief justification for the scores",
            },
          },
          required: [
            "featureTitle",
            "parentPath",
            "reach",
            "impact",
            "confidence",
            "effort",
            "rationale",
          ],
        },
      },
    },
    required: ["scores"],
  }),
  execute: async (params) => ({
    priorityScores: params.scores,
    status: "suggested",
  }),
});

const refineFeatureDescriptionTool = tool({
  description:
    "Refine or generate a description for a specific feature in the feature tree. Use when the PM asks to improve, rewrite, or add detail to a particular feature's description. Adapt the content to the feature's role in the tree.",
  inputSchema: jsonSchema<{
    featureTitle: string;
    parentPath: string[];
    description: string;
  }>({
    type: "object",
    properties: {
      featureTitle: {
        type: "string",
        description: "Exact title of the feature to update",
      },
      parentPath: {
        type: "array",
        items: { type: "string" },
        description:
          "Parent feature titles from root to immediate parent (empty for top-level)",
      },
      description: {
        type: "string",
        description:
          "The new/refined description. Supports markdown. Adapt to the feature: acceptance criteria for user-facing features, technical notes for infra, strategic context for groups.",
      },
    },
    required: ["featureTitle", "parentPath", "description"],
  }),
  execute: async (params) => ({
    refinedDescription: params,
    status: "suggested",
  }),
});

export const artifactTools = {
  generatePlan: planTool,
  generatePRD: prdTool,
  generatePersona: personaTool,
  generateFeatureTree: featureTreeTool,
  generateCompetitor: competitorTool,
  suggestPriorities: suggestPrioritiesTool,
  refineFeatureDescription: refineFeatureDescriptionTool,
};
