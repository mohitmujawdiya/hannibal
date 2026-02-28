import { tool, jsonSchema } from "ai";
import type { RoadmapTimeScale } from "@/lib/artifact-types";

const planTool = tool({
  description:
    "Generate an implementation plan as a senior product strategist who's taken products from 0-to-1. Every section should be specific enough that a team could estimate and begin work from it. No vague placeholders — if you lack specifics, call out what needs validation.",
  inputSchema: jsonSchema<{ title: string; content: string }>({
    type: "object",
    properties: {
      title: { type: "string", description: "Plan title" },
      content: {
        type: "string",
        description:
          "Full plan as markdown. The plan must be comprehensive and detailed — a team should be able to start work from it. Typical sections and quality criteria (include all that apply, skip or add sections as the context demands):\n\n**Problem Statement** — At least 3-4 sentences. Lead with user pain, not business opportunity. Quantify the cost of the status quo (time wasted, money lost, opportunities missed). Name who feels this pain most acutely.\n\n**Target Users** — At least 2-3 distinct user segments. Define by behavior, context, and need — not demographics. Each segment should imply different product decisions.\n\n**Proposed Solution** — At least 2-3 paragraphs. Start with the core insight (why THIS approach), then walk through user flows not feature lists. Show how it resolves the pain from the problem statement.\n\n**Technical Approach** — At least 3-4 key technical decisions. Identify the hardest technical problems. Call out what to prototype first. Note build-vs-buy decisions and key technology choices with rationale.\n\n**Success Metrics** — At least 4-5 metrics. Each needs: current baseline (or 'unknown — measure in week 1'), target value, and timeframe. No vanity metrics — every metric should inform a go/no-go decision.\n\n**Risks** — At least 3-4 risks spanning market, technical, and execution. Each needs: likelihood (high/medium/low), impact (high/medium/low), and a concrete mitigation (not 'monitor closely').\n\n**Timeline** — At least 3 phases with milestones. Each phase has a validation gate — what must be true to proceed. Show dependencies between phases. Include what can be parallelized.",
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
    "Generate a Product Requirements Document as a staff technical PM who writes specs engineers ship from. Every requirement should be specific enough that two engineers would independently build the same thing.",
  inputSchema: jsonSchema<{ title: string; content: string }>({
    type: "object",
    properties: {
      title: { type: "string", description: "PRD title" },
      content: {
        type: "string",
        description:
          "Full PRD as markdown. The PRD must be comprehensive enough that an engineering team could start building from it. Typical sections and quality criteria (include all that apply, skip or add sections as the context demands):\n\n**Overview** — Two paragraphs max. First paragraph: the problem and who has it. Second paragraph: how the solution works at a high level. No mission statements.\n\n**User Stories** — At least 5-8 user stories. Format: 'As a [specific role], I want [concrete action] so that [measurable outcome]'. Every story must pass the 'so what' test — if the outcome doesn't matter to the user, rewrite it. Group by user flow, not by component.\n\n**Acceptance Criteria** — At least 3-5 criteria per user story. Given/When/Then or checkbox format. Every criterion must be binary pass/fail — no subjective language ('should feel fast'). Cover: happy path, error states, edge cases, and performance requirements.\n\n**Technical Constraints** — At least 3-4 constraints. Only constraints that affect product decisions (not implementation details). Include: platform requirements, performance budgets, data privacy/compliance, integration requirements, backwards compatibility.\n\n**Out of Scope** — At least 3-4 items. Name the temptations — features the team will want to add but shouldn't. For each, briefly explain why it's deferred (not enough data, dependency not ready, v2 candidate).\n\n**Success Metrics** — At least 4-5 metrics tied directly to user stories. Include at least one metric checkable in the first week after launch. Format: metric name, current baseline, target, measurement method.\n\n**Dependencies** — At least 2-3 dependencies. Upstream teams, APIs, design assets, legal/compliance approvals. Each with: owner, current status, and what's blocked if it slips.",
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
    "Generate a user persona as a UX researcher building from behavioral patterns. A useful persona changes how the team makes product decisions — if removing the persona wouldn't change any decision, it's not specific enough.",
  inputSchema: jsonSchema<{ title: string; content: string }>({
    type: "object",
    properties: {
      title: { type: "string", description: "Persona name" },
      content: {
        type: "string",
        description:
          "Full persona as markdown. IMPORTANT: The ## heading MUST be the persona's actual name (same as title), NOT the literal word 'Name'. Every section must be specific enough that it would change a product decision — no generic filler.\n\n## {persona's actual name}\n**Demographics:** age, occupation, location, company size, team structure, budget authority\n**Tech Proficiency:** specific tools and platforms they use daily (name real products, not 'various apps')\n> \"A representative quote that reveals their core frustration or aspiration — make it sound like a real person said it in an interview\"\n\n**Goals:**\n- Minimum 4 goals. Frame as measurable outcomes, NOT vague aspirations.\n- BAD: 'Maintain a healthy lifestyle' (too vague to inform any decision)\n- GOOD: 'Reduce injury risk during exercise by getting age-appropriate intensity recommendations based on health conditions'\n\n**Frustrations:**\n- Minimum 3 frustrations. Each MUST include the specific workaround they currently use and the cost of that workaround.\n- BAD: 'Finds it hard to relate to fitness apps designed for younger users' (no workaround, no cost)\n- GOOD: 'Spends 20+ minutes before each workout Googling \"safe exercises for bad knees\" because no app filters by physical limitations — often gives up and skips the workout entirely'\n\n**Behaviors:**\n- Minimum 3 behaviors. Each must be an observable pattern that directly implies a UX decision.\n- BAD: 'Prefers short workouts' (preference, not behavior; implies nothing specific)\n- GOOD: 'Opens the app only during the 6:30-7am window before work — any onboarding or setup that takes more than 30 seconds means they close the app and don't come back that day'\n\n**Decision-Making Context:**\n- **Trigger event:** The specific moment that prompts them to seek a solution (be concrete)\n- **Evaluation criteria:** How they compare options — name specific factors and their relative weight\n- **Decision authority:** Who else influences the decision and how\n- **Switching cost:** What specifically they'd lose or need to migrate",
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
        "Contextual description — adapt to the feature's role. For parent/group features: strategic summary explaining WHY this capability matters and what user outcome it enables. For leaf features: acceptance criteria with edge cases — an engineer should know what to build. For infra features: technical requirements with performance budgets. Avoid vague descriptions like 'handles user management' — be specific about what the feature does and why it matters. Supports markdown.",
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
              "Contextual description. Avoid vague descriptions like 'manages X' — be specific about what the feature does, who benefits, and what success looks like. Supports markdown.",
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
                    "Leaf feature description. Include acceptance criteria and edge cases — an engineer should know exactly what to build and test. Supports markdown.",
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
    "Generate a feature tree / hierarchy. Apply MECE decomposition — no overlaps, no gaps. Group by user capability, not technical component. Sibling nodes should be at the same abstraction level. Aim for 2-3 levels deep. ALWAYS include a description for every feature node — adapt the content to the feature's role (strategic summary for groups, acceptance criteria for leaves, technical notes for infra).",
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
    "Generate a competitor analysis for ONE single competitor as a market analyst focused on strategic positioning. Focus on where the competitor is heading and where they're structurally unable to go — not surface-level feature checklists. IMPORTANT: Generate exactly ONE competitor per call. If the user asks about multiple competitors, call this tool separately for each one.",
  inputSchema: jsonSchema<{ title: string; content: string }>({
    type: "object",
    properties: {
      title: { type: "string", description: "Competitor name" },
      content: {
        type: "string",
        description:
          "Full competitor analysis as markdown. Every insight must be specific and actionable — no generic observations.\n\n## {Competitor Name}\n**URL:** website\n**Positioning:** Stated positioning vs. revealed positioning (where they actually win deals). Note any gap between marketing and reality.\n**Pricing:** Pricing model and what the pricing structure signals about their strategy (e.g. per-seat = betting on team adoption, usage-based = betting on expansion).\n\n**Strengths:**\n- Minimum 3 strengths. Focus on durable advantages — network effects, data moats, ecosystem lock-in, brand trust.\n- BAD: 'Large user base' (vague, unactionable)\n- GOOD: 'Network effect from 2M+ shared workout templates — new users get immediate value from community content, making it hard for competitors to replicate the library'\n\n**Weaknesses:**\n- Minimum 3 weaknesses. Structural constraints that are hard to fix — architecture limitations, business model conflicts, technical debt.\n- BAD: 'UI could be better' (subjective, fixable)\n- GOOD: 'Revenue model depends on premium subscriptions, creating a conflict with making the free tier good enough to drive viral adoption'\n\n**Feature Gaps:**\n- Minimum 2 gaps. Only gaps that matter to YOUR target user. For each, note whether structural (hard for them to build) or timing (they'll likely build it, estimate when).\n\n**Strategic Trajectory:**\n- Recent product launches, acquisitions, hiring patterns, funding. What these signals reveal about direction and structural constraints on where they can and can't go.",
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
    "Suggest RICE priority scores for features in the feature tree. Each score should be defensible — if challenged, the rationale should reference market data, user behavior, technical complexity, or competitive position. Provide scores for each leaf feature (or key features if the tree is large). Reach: 1-10, Impact: 0.25/0.5/1/2/3, Confidence: 50/80/100, Effort: person-weeks.",
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
              description: "2-4 sentences. Reference specific evidence — market data, user behavior, technical complexity, or competitive position. Explain the most controversial score (the one most likely to be challenged).",
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
    "Refine or generate a description for a specific feature in the feature tree. An engineer should read it and know exactly what to build, test, and ship. Match the feature by title and parent path.",
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
          "The new/refined description. Supports markdown. Structure by feature type:\n- **Leaf (user-facing):** Acceptance criteria with edge cases, error states, and performance expectations. An engineer should know what to build and what tests to write.\n- **Parent/group:** Strategic framing — why this capability matters, what user outcome it enables, how children relate to each other.\n- **Infrastructure:** Technical requirements with performance budgets, SLAs, and integration points. Include what 'done' looks like in measurable terms.",
      },
    },
    required: ["featureTitle", "parentPath", "description"],
  }),
  execute: async (params) => ({
    refinedDescription: params,
    status: "suggested",
  }),
});

type RoadmapLaneInput = { id: string; name: string; color: string };
type RoadmapItemInput = {
  id: string;
  title: string;
  description?: string;
  laneId: string;
  startDate: string;
  endDate: string;
  status: string;
  type: string;
};

const roadmapTool = tool({
  description:
    "Generate a roadmap as a program lead who sequences by dependencies and risk. Front-load items that reduce uncertainty or unblock other work. Include realistic buffers between dependent items.",
  inputSchema: jsonSchema<{
    title: string;
    timeScale: string;
    lanes: RoadmapLaneInput[];
    items: RoadmapItemInput[];
  }>({
    type: "object",
    properties: {
      title: { type: "string", description: "Roadmap title" },
      timeScale: {
        type: "string",
        description: "Time scale: 'weekly', 'monthly', or 'quarterly'",
        enum: ["weekly", "monthly", "quarterly"],
      },
      lanes: {
        type: "array",
        description: "Swim lanes (categories like Engineering, Design, Marketing). Use 2-5 lanes.",
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "Unique lane ID (e.g. 'lane-1')" },
            name: { type: "string", description: "Lane display name" },
            color: { type: "string", description: "Hex color (e.g. '#3b82f6')" },
          },
          required: ["id", "name", "color"],
        },
      },
      items: {
        type: "array",
        description: "Roadmap items. Sequencing principles: de-risk first (front-load items that reduce uncertainty), respect dependencies (nothing starts before its prerequisite ends), parallelize across lanes where possible, use milestones as decision points (not just completions), and include 20-30% buffer between dependent items. Each item belongs to a lane and spans a date range.",
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "Unique item ID (e.g. 'ri-1')" },
            title: { type: "string", description: "Item title" },
            description: { type: "string", description: "Optional description" },
            laneId: { type: "string", description: "Lane ID this item belongs to" },
            startDate: { type: "string", description: "Start date YYYY-MM-DD" },
            endDate: {
              type: "string",
              description: "End date YYYY-MM-DD. For milestones, use same as startDate.",
            },
            status: {
              type: "string",
              description: "Status: not_started, in_progress, review, or done",
              enum: ["not_started", "in_progress", "review", "done"],
            },
            type: {
              type: "string",
              description: "Item type: feature, goal, or milestone",
              enum: ["feature", "goal", "milestone"],
            },
          },
          required: ["id", "title", "laneId", "startDate", "endDate", "status", "type"],
        },
      },
    },
    required: ["title", "timeScale", "lanes", "items"],
  }),
  execute: async (params) => ({
    artifact: {
      type: "roadmap" as const,
      title: params.title,
      timeScale: params.timeScale as RoadmapTimeScale,
      lanes: params.lanes,
      items: params.items.map((item) => ({
        ...item,
        status: item.status as "not_started" | "in_progress" | "review" | "done",
        type: item.type as "feature" | "goal" | "milestone",
      })),
    },
    status: "generated",
  }),
});

type RoadmapOperation = {
  action: "add" | "update" | "remove";
  item: {
    id?: string;
    title?: string;
    description?: string;
    laneId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    type?: string;
  };
};

const updateRoadmapTool = tool({
  description:
    "Suggest changes to the existing roadmap. Use when the PM asks to update, add, remove, or reschedule items on their roadmap. Returns operations that the PM can apply.",
  inputSchema: jsonSchema<{ operations: RoadmapOperation[] }>({
    type: "object",
    properties: {
      operations: {
        type: "array",
        description: "List of operations to apply to the roadmap",
        items: {
          type: "object",
          properties: {
            action: {
              type: "string",
              description: "Action: add (new item), update (modify existing), remove (delete item)",
              enum: ["add", "update", "remove"],
            },
            item: {
              type: "object",
              description:
                "Item data. For 'add': provide all fields. For 'update': provide id + changed fields. For 'remove': provide id or title.",
              properties: {
                id: { type: "string", description: "Item ID (for update/remove)" },
                title: { type: "string" },
                description: { type: "string" },
                laneId: { type: "string" },
                startDate: { type: "string", description: "YYYY-MM-DD" },
                endDate: { type: "string", description: "YYYY-MM-DD" },
                status: {
                  type: "string",
                  enum: ["not_started", "in_progress", "review", "done"],
                },
                type: { type: "string", enum: ["feature", "goal", "milestone"] },
              },
            },
          },
          required: ["action", "item"],
        },
      },
    },
    required: ["operations"],
  }),
  execute: async (params) => ({
    roadmapOperations: params.operations,
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
  generateRoadmap: roadmapTool,
  updateRoadmap: updateRoadmapTool,
};
