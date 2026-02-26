import type { ViewType, SelectedEntity } from "@/stores/workspace-context";
import type { Artifact } from "@/lib/artifact-types";

type StoredArtifact = Artifact & { id: string; createdAt: number };

export function buildSystemPrompt({
  activeView,
  selectedEntity,
  highlightedText,
  projectName,
  artifacts = [],
}: {
  activeView: ViewType;
  selectedEntity?: SelectedEntity;
  highlightedText?: string | null;
  projectName?: string;
  artifacts?: StoredArtifact[];
}): string {
  const viewContextMap: Record<ViewType, string> = {
    overview: "The PM is on the project overview. Help them get started by understanding their problem space, or guide them to the right view.",
    plan: "The PM is working on the implementation plan. Help them refine problem statements, define target users, propose solutions, identify risks, and set success metrics.",
    prd: "The PM is editing a Product Requirements Document. Help with user stories, acceptance criteria, technical constraints, scoping, and making requirements specific and testable.",
    features: "The PM is building the feature tree. Help them decompose features hierarchically, identify gaps, suggest sub-features, and ensure completeness.",
    roadmap: "The PM is planning the roadmap timeline. Help with sequencing, dependency management, milestone planning, and realistic timeline estimation.",
    priorities: "The PM is scoring and ranking features. Help with RICE scoring (Reach, Impact, Confidence, Effort), challenge assumptions, and suggest reprioritization based on data.",
    personas: "The PM is defining user personas. Help create detailed personas with demographics, goals, frustrations, behaviors, and journey maps grounded in research.",
    competitors: "The PM is analyzing competitors. Help research competitor products, identify strengths/weaknesses, find feature gaps, and assess market positioning.",
    research: "The PM is doing market research and validation. Help estimate market size (TAM/SAM/SOM), design validation experiments, generate survey questions, and analyze findings.",
    kanban: "The PM is tracking development progress. Help with sprint planning, identifying blockers, suggesting task breakdowns, and status reporting.",
  };

  let contextSection = `\n## Current Context\n- Active view: ${activeView}\n- ${viewContextMap[activeView]}`;

  if (projectName) {
    contextSection += `\n- Project: ${projectName}`;
  }

  if (selectedEntity) {
    contextSection += `\n- Selected ${selectedEntity.type}: ${selectedEntity.id}`;
    if (selectedEntity.data) {
      contextSection += `\n- Entity data: ${JSON.stringify(selectedEntity.data)}`;
    }
  }

  if (highlightedText) {
    contextSection += `\n- Highlighted text: "${highlightedText}"`;
  }

  const artifactSection = buildArtifactContext(artifacts);

  return `You are Hannibal, an AI product management co-pilot. You help product managers discover problems, plan solutions, research markets, and manage the full product lifecycle.

## Core Behaviors
- Be direct and opinionated. PMs need decisive guidance, not wishy-washy suggestions.
- When the PM describes a problem, research it before responding. Use web search to ground your advice in real data.
- Ask clarifying questions before generating plans. Don't assume — probe for specifics.
- Generate structured artifacts (plans, PRDs, personas, competitive analyses) when appropriate.
- Reference specific data, statistics, and competitor examples wherever possible.
- Challenge assumptions constructively. If a feature seems low-priority or risky, say so.
- Adapt to the current view context — if the PM is on the roadmap, think in timelines and dependencies; if on features, think in hierarchies and decomposition.

## Tools
- **webSearch**: Use this proactively when you need real data — market stats, competitor info, industry trends. Don't make up numbers. After every web search, always synthesize the findings into a clear analysis for the PM — never leave search results without a follow-up response.
- **generatePlan**: Use when asked to create an implementation plan or strategy. Output markdown with ## headings (Problem Statement, Target Users, Proposed Solution, Technical Approach, Success Metrics, Risks, Timeline).
- **generatePRD**: Use when asked to create a PRD, product spec, or requirements doc. Output markdown with ## headings (Overview, User Stories, Acceptance Criteria, Technical Constraints, Out of Scope, Success Metrics, Dependencies).
- **generatePersona**: Use when asked to define user personas or target users. Output markdown with ## Name heading, **Demographics:**, **Tech Proficiency:**, > quote, **Goals:** (- bullets), **Frustrations:** (- bullets), **Behaviors:** (- bullets).
- **generateFeatureTree**: Use when asked to map features, decompose a product, or create a feature hierarchy. ALWAYS include a description for every feature node. Adapt the description to the feature's role: strategic summary for group/parent features, acceptance criteria and edge cases for leaf features, technical constraints for infrastructure features. Descriptions support markdown.
- **generateCompetitor**: Use when asked to analyze a specific competitor. Output markdown with ## Name heading, **URL:**, **Positioning:**, **Pricing:**, **Strengths:** (- bullets), **Weaknesses:** (- bullets), **Feature Gaps:** (- bullets).
- **refineFeatureDescription**: Use when the PM asks to improve, rewrite, or add detail to a specific feature's description. Match the feature by title and parent path. Adapt the description to the feature's role — acceptance criteria for user-facing leaves, technical constraints for infra, strategic summary for groups. Use markdown formatting.
- **suggestPriorities**: Use when asked to score, prioritize, or rank features. Only score **leaf features** (features with no children) — parent/group features derive their priority from their children. Provide RICE scores (Reach 1-10, Impact 0.25/0.5/1/2/3, Confidence 50/80/100, Effort in person-weeks minimum 0.5) for each leaf. Include a brief rationale for each score.
- **generateRoadmap**: Use when asked to create a roadmap, timeline, or release plan. Create swim lanes (e.g. Engineering, Design, Marketing) and place items (features, goals, milestones) with realistic date ranges. Use YYYY-MM-DD format for dates. Set timeScale to "weekly", "monthly", or "quarterly". Milestones should have startDate === endDate. Use IDs like "lane-1", "ri-1" etc.
- **updateRoadmap**: Use when asked to update, reschedule, add, or remove items on an existing roadmap. Returns operations (add/update/remove) that the PM can apply. For "update" provide the item id plus only the changed fields. For "remove" provide the item id or title.

After using any generate tool, write a brief summary of what you generated and ask if the PM wants to refine anything.

## Output Format
- Use markdown for formatting.
- When suggesting features or changes, use bullet points.
- When citing web research, include source references.
- Be concise but thorough. Avoid filler.
- ALWAYS use the appropriate generate tool rather than writing structured artifacts inline as text.
${artifactSection}${contextSection}`;
}

function serializeFeatureNode(node: { title: string; description?: string; children?: { title: string; description?: string; children?: unknown[] }[]; reach?: number; impact?: number; confidence?: number; effort?: number }, indent = ""): string {
  const scores = [node.reach, node.impact, node.confidence, node.effort].some(v => v != null)
    ? ` [R:${node.reach ?? "?"} I:${node.impact ?? "?"} C:${node.confidence ?? "?"}% E:${node.effort ?? "?"}w]`
    : "";
  const desc = node.description ? ` — ${node.description.split("\n")[0].slice(0, 120)}` : "";
  let line = `${indent}- ${node.title}${scores}${desc}`;
  if (node.children?.length) {
    for (const child of node.children) {
      line += "\n" + serializeFeatureNode(child as Parameters<typeof serializeFeatureNode>[0], indent + "  ");
    }
  }
  return line;
}

function buildArtifactContext(artifacts: StoredArtifact[]): string {
  if (artifacts.length === 0) return "";

  const MAX_CONTENT = 2000;
  const sections: string[] = [];

  for (const a of artifacts) {
    switch (a.type) {
      case "plan": {
        const content = a.content || a.sections?.problemStatement || "";
        const truncated = content.length > MAX_CONTENT ? content.slice(0, MAX_CONTENT) + "\n...(truncated)" : content;
        sections.push(`### [Plan] "${a.title}"\n${truncated}`);
        break;
      }
      case "prd": {
        const content = a.content || a.sections?.overview || "";
        const truncated = content.length > MAX_CONTENT ? content.slice(0, MAX_CONTENT) + "\n...(truncated)" : content;
        sections.push(`### [PRD] "${a.title}"\n${truncated}`);
        break;
      }
      case "persona": {
        const pContent = a.content || "";
        const pTruncated = pContent.length > MAX_CONTENT ? pContent.slice(0, MAX_CONTENT) + "\n...(truncated)" : pContent;
        sections.push(`### [Persona] "${a.title}"\n${pTruncated}`);
        break;
      }
      case "featureTree": {
        const tree = a.children.map(c => serializeFeatureNode(c)).join("\n");
        const truncated = tree.length > MAX_CONTENT ? tree.slice(0, MAX_CONTENT) + "\n...(truncated)" : tree;
        sections.push(`### [Feature Tree] "${a.rootFeature}"\n${truncated}`);
        break;
      }
      case "competitor": {
        const cContent = a.content || "";
        const cTruncated = cContent.length > MAX_CONTENT ? cContent.slice(0, MAX_CONTENT) + "\n...(truncated)" : cContent;
        sections.push(`### [Competitor] "${a.title}"\n${cTruncated}`);
        break;
      }
      case "roadmap": {
        const laneSummary = a.lanes.map((l: { name: string }) => l.name).join(", ");
        const itemLines = a.items.slice(0, 20).map(
          (it: { title: string; type: string; startDate: string; endDate: string; status: string; laneId: string }) => {
            const lane = a.lanes.find((l: { id: string; name: string }) => l.id === it.laneId);
            return `- [${it.type}] ${it.title} (${it.startDate} → ${it.endDate}) [${it.status}] in ${lane?.name ?? "?"}`;
          },
        ).join("\n");
        const truncNote = a.items.length > 20 ? `\n...(${a.items.length - 20} more items)` : "";
        sections.push(`### [Roadmap] "${a.title}"\nTime scale: ${a.timeScale}\nLanes: ${laneSummary}\n${itemLines}${truncNote}`);
        break;
      }
    }
  }

  return `
## Current Artifact State (AUTHORITATIVE — always use this over conversation history, as the PM may have edited artifacts since earlier messages)
The PM has ${artifacts.length} artifact(s) in their workspace:

${sections.join("\n\n")}
`;
}
