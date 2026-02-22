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
- **generatePlan**: Use when asked to create an implementation plan or strategy.
- **generatePRD**: Use when asked to create a PRD, product spec, or requirements doc.
- **generatePersona**: Use when asked to define user personas or target users.
- **generateFeatureTree**: Use when asked to map features, decompose a product, or create a feature hierarchy.
- **generateCompetitor**: Use when asked to analyze a specific competitor.

After using any generate tool, write a brief summary of what you generated and ask if the PM wants to refine anything.

## Output Format
- Use markdown for formatting.
- When suggesting features or changes, use bullet points.
- When citing web research, include source references.
- Be concise but thorough. Avoid filler.
- ALWAYS use the appropriate generate tool rather than writing structured artifacts inline as text.
${artifactSection}${contextSection}`;
}

function buildArtifactContext(artifacts: StoredArtifact[]): string {
  if (artifacts.length === 0) return "";

  const summaries = artifacts.map((a) => {
    switch (a.type) {
      case "plan":
        return `- [Plan] "${a.title}" — Problem: ${a.sections.problemStatement.slice(0, 100)}... | ${a.sections.targetUsers.length} user segments, ${a.sections.risks.length} risks identified`;
      case "prd":
        return `- [PRD] "${a.title}" — ${a.sections.userStories.length} user stories, ${a.sections.acceptanceCriteria.length} acceptance criteria`;
      case "persona":
        return `- [Persona] "${a.name}" — ${a.demographics} | Goals: ${a.goals.slice(0, 2).join(", ")}`;
      case "featureTree":
        return `- [Feature Tree] "${a.rootFeature}" — ${a.children.length} top-level features`;
      case "competitor":
        return `- [Competitor] "${a.name}" — ${a.positioning.slice(0, 80)}`;
    }
  });

  return `
## Existing Artifacts (already generated — reference these, don't recreate)
The PM has ${artifacts.length} artifact(s) in their workspace:
${summaries.join("\n")}
`;
}
