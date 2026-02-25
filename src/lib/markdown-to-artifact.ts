// Markdown → structured data parsers (inverse of artifact-to-markdown.ts serializers)

// ─── Parsing utilities ───────────────────────────────────────────────

/** Extract the body text under a ## heading, up to the next ## heading or end of string. */
function extractSection(md: string, heading: string): string {
  const parts = md.split(/^##\s+/m);
  for (const part of parts) {
    const firstNewline = part.indexOf("\n");
    const sectionTitle = (firstNewline === -1 ? part : part.slice(0, firstNewline)).trim();
    if (sectionTitle.toLowerCase() === heading.toLowerCase()) {
      return firstNewline === -1 ? "" : part.slice(firstNewline).trim();
    }
  }
  return "";
}

/** Extract bullet list items (lines starting with - ) from a section. */
function extractBulletList(md: string, heading: string): string[] {
  const section = extractSection(md, heading);
  if (!section) return [];
  return parseBulletLines(section);
}

/** Extract **Key:** value from a bold-field line. */
function extractBoldField(md: string, key: string): string {
  const pattern = new RegExp(`^\\*\\*${escapeRegex(key)}:\\*\\*\\s*(.+)$`, "m");
  const match = md.match(pattern);
  return match ? match[1].trim() : "";
}

/** Extract bullet items from a bold-labeled list: **Label:**\n- item1\n- item2 */
function extractBoldList(md: string, label: string): string[] {
  const pattern = new RegExp(
    `\\*\\*${escapeRegex(label)}:\\*\\*\\s*\\n([\\s\\S]*?)(?=\\n\\*\\*[A-Z]|\\n##\\s)`,
    "m"
  );
  const match = md.match(pattern);
  if (!match) {
    // Try matching to end of string (last section)
    const fallback = new RegExp(
      `\\*\\*${escapeRegex(label)}:\\*\\*\\s*\\n([\\s\\S]*)`,
      "m"
    );
    const fb = md.match(fallback);
    if (!fb) return [];
    return parseBulletLines(fb[1]);
  }
  return parseBulletLines(match[1]);
}

/** Extract first blockquote line (> text). */
function extractBlockquote(md: string): string {
  const match = md.match(/^>\s*"?(.+?)"?\s*$/m);
  return match ? match[1].trim() : "";
}

/** Extract # Title from the first H1 heading. */
function extractH1Title(md: string): string {
  const match = md.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "";
}

/** Extract ## Title from the first H2 heading. */
function extractH2Title(md: string): string {
  const match = md.match(/^##\s+(.+)$/m);
  return match ? match[1].trim() : "";
}

function parseBulletLines(text: string): string[] {
  return text
    .split("\n")
    .filter((line) => /^\s*-\s/.test(line))
    .map((line) => line.replace(/^\s*-\s+/, "").trim())
    .filter(Boolean);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Extract paragraph text (non-bullet, non-heading lines) from a section. */
function extractParagraphText(section: string): string {
  return section
    .split("\n")
    .filter((line) => !/^\s*-\s/.test(line) && !/^##?\s/.test(line))
    .join("\n")
    .trim();
}

// ─── Plan parser ─────────────────────────────────────────────────────

export type ParsedPlan = {
  title: string;
  problemStatement: string;
  targetUsers: string[];
  proposedSolution: string;
  technicalApproach: string;
  successMetrics: string[];
  risks: string[];
  timeline: string;
};

export function parsePlanMarkdown(content: string): ParsedPlan {
  return {
    title: extractH1Title(content),
    problemStatement: extractParagraphText(extractSection(content, "Problem Statement")),
    targetUsers: extractBulletList(content, "Target Users"),
    proposedSolution: extractParagraphText(extractSection(content, "Proposed Solution")),
    technicalApproach: extractParagraphText(extractSection(content, "Technical Approach")),
    successMetrics: extractBulletList(content, "Success Metrics"),
    risks: extractBulletList(content, "Risks"),
    timeline: extractParagraphText(extractSection(content, "Timeline")),
  };
}

// ─── PRD parser ──────────────────────────────────────────────────────

export type ParsedPrd = {
  title: string;
  overview: string;
  userStories: string[];
  acceptanceCriteria: string[];
  technicalConstraints: string[];
  outOfScope: string[];
  successMetrics: string[];
  dependencies: string[];
};

export function parsePrdMarkdown(content: string): ParsedPrd {
  return {
    title: extractH1Title(content),
    overview: extractParagraphText(extractSection(content, "Overview")),
    userStories: extractBulletList(content, "User Stories"),
    acceptanceCriteria: extractBulletList(content, "Acceptance Criteria"),
    technicalConstraints: extractBulletList(content, "Technical Constraints"),
    outOfScope: extractBulletList(content, "Out of Scope"),
    successMetrics: extractBulletList(content, "Success Metrics"),
    dependencies: extractBulletList(content, "Dependencies"),
  };
}

// ─── Persona parser ──────────────────────────────────────────────────

export type ParsedPersona = {
  name: string;
  demographics: string;
  techProficiency: string;
  quote: string;
  goals: string[];
  frustrations: string[];
  behaviors: string[];
};

export function parsePersonaMarkdown(content: string): ParsedPersona {
  return {
    name: extractH2Title(content),
    demographics: extractBoldField(content, "Demographics"),
    techProficiency: extractBoldField(content, "Tech Proficiency"),
    quote: extractBlockquote(content),
    goals: extractBoldList(content, "Goals"),
    frustrations: extractBoldList(content, "Frustrations"),
    behaviors: extractBoldList(content, "Behaviors"),
  };
}

// ─── Competitor parser ───────────────────────────────────────────────

export type ParsedCompetitor = {
  name: string;
  url: string;
  positioning: string;
  pricing: string;
  strengths: string[];
  weaknesses: string[];
  featureGaps: string[];
};

export function parseCompetitorMarkdown(content: string): ParsedCompetitor {
  return {
    name: extractH2Title(content),
    url: extractBoldField(content, "URL"),
    positioning: extractBoldField(content, "Positioning"),
    pricing: extractBoldField(content, "Pricing"),
    strengths: extractBoldList(content, "Strengths"),
    weaknesses: extractBoldList(content, "Weaknesses"),
    featureGaps: extractBoldList(content, "Feature Gaps"),
  };
}
