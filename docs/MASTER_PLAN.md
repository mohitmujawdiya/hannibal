# Hannibal — Master Plan

> "Cursor for PMs and Founders."
> An AI-native workspace where product managers and startup founders go from idea to shipped product — with AI that understands the full picture.

---

## Target Users

### Primary: Startup Founders (Solo / Small Team)
- Has an idea (or early customer discovery data) and needs to structure it
- Wearing the PM hat themselves — no dedicated PM on the team
- Needs to go from "I talked to 20 people" to a prioritized roadmap fast
- Values speed over process — wants AI to do the heavy lifting

### Secondary: Product Managers (Growth-Stage / Mid-Market)
- Managing an existing product with user feedback flowing in
- Juggles Notion + Linear + spreadsheets + Figma + Slack
- Wants one workspace where planning artifacts stay connected
- Values the feedback-to-feature loop and cross-artifact intelligence

### Why Both Work
The workflows are nearly identical — same tools, different entry points:
- **Founders**: Idea -> Research -> Validate -> Plan -> PRD -> Features -> Build -> Ship
- **PMs**: Feedback -> Research -> Plan -> PRD -> Features -> Prioritize -> Build -> Ship -> Measure

---

## Platform Architecture

Three-panel workspace with AI context bridge:
```
+----------+----------------------+--------------+
| Sidebar  | Main Content Area    | AI Panel     |
| (nav)    | (active view)        | (persistent) |
+----------+----------------------+--------------+
```

- **Sidebar**: Project switcher + view navigation
- **Main Content**: Active view (11 views planned, 8 built)
- **AI Panel**: Persistent chat with expert PM persona, context-aware of active view, generates artifacts
- **Context Bridge**: Zustand store connects all panels — AI knows what you're looking at
- **Three-Tier Context**: AI receives full content for active-view artifacts, summaries for others, with on-demand drill-down via tools

---

## Current State (What's Built)

### Infrastructure
- [x] Three-panel workspace shell with resizable panels
- [x] Project switcher dropdown (real DB, create/switch projects)
- [x] AI chat panel with streaming (GPT-4o via Vercel AI SDK v6)
- [x] Artifact generation + "Push to View" flow
- [x] tRPC v11 + Prisma 7 + PostgreSQL backend (12 models, 8 routers)
- [x] Zustand stores for UI state (workspace-context, artifact-store, project-store)
- [x] Context bridge connecting views <-> AI panel
- [x] Conversation persistence (chat history saved to DB, restored per project)
- [x] Three-tier artifact context (Tier 1: full content for active view, Tier 2: summaries, on-demand: readArtifact tools)
- [x] Expert prompt system (persona-driven quality criteria, flexible section structure per artifact type)
- [x] Project context loading (saved artifacts from DB injected into AI system prompt)
- [x] Parser extras catch-all (unrecognized AI-generated sections render instead of being silently dropped)
- [x] Web search integration (Tavily API with source citations)
- [x] Rate limiting (Upstash)
- [x] Clerk auth with dark theme styling

### Editor
- [x] MarkdownDoc component (react-markdown view + textarea edit mode, replaced Novel/Tiptap)
- [x] Used for Plan and PRD editing

### Views (8 of 11 complete)
- [x] **Overview / Dashboard** — project health, artifact coverage, RICE highlights, recent activity, roadmap pulse
- [x] **Plan Editor** — markdown-based with MarkdownDoc, soft delete + undo
- [x] **PRD Editor** — same architecture as Plan, linkable to Plan
- [x] **Feature Tree** — @xyflow/react + dagre layout, full CRUD, undo/redo, keyboard shortcuts
- [x] **Priority Matrix** — RICE scoring, ranked/grouped modes, AI suggestions with evidence-based rationales
- [x] **Personas** — card-based with structured fields (goals, frustrations, behaviors, decision-making context), inline editing, AI generation, extras catch-all
- [x] **Competitors** — card-based with structured fields (strengths, weaknesses, feature gaps, strategic trajectory), web research, AI generation, extras catch-all
- [x] **Roadmap** — dnd-timeline + dnd-kit, swim lanes, milestones, dependencies, import features from tree
- [ ] **Research Tracker** — stub only
- [ ] **Kanban Board** — placeholder (maps to Overview)
- [ ] **Feedback Inbox** — not started

### AI Architecture (Built)
The AI system has evolved beyond the original plan. Key patterns now in place:

1. **Expert Prompt System** — The AI acts as a senior PM (not a generic assistant). Each tool carries expert-level quality criteria: plans must have quantified problem statements and phased timelines with validation gates; PRDs must have Given/When/Then acceptance criteria; personas must include decision-making context with switching costs.

2. **Three-Tier Artifact Context** — The system prompt includes artifact state tiered by relevance to the active view:
   - Tier 1: Full serialized content for artifacts matching the active view (up to 8K chars)
   - Tier 2: One-line summaries for all other artifacts (type, title, counts)
   - On-demand: `readArtifact` / `readAllArtifacts` tools fetch full content when the AI needs cross-artifact context

3. **Flexible Section Structure** — Tool descriptions frame sections as "typical sections — include all that apply, skip or add as context demands." The AI adapts structure to the specific product rather than forcing a rigid template.

4. **Extras Catch-All** — Persona and competitor parsers capture unrecognized bold-labeled sections via `extractUnrecognizedSections()`, so new AI-generated sections render in the card UI instead of being silently dropped. Known fields keep structured pretty rendering; unknown extras get neutral text blocks.

5. **Conversation Persistence** — Chat history saved to DB per project, restored on return. Messages serialized via dedicated utility. Project context (all saved artifacts) loaded server-side and injected into the system prompt.

---

## The Plan

### Phase 1: Complete Core Views
*Finish the product planning toolkit — every view works end-to-end.*

#### 1A. Research Tracker
The market validation view. Founders use this to structure their customer discovery. PMs use it to validate new directions.

- **What it does**: TAM/SAM/SOM estimation, customer interview tracker, validation checklists, survey question generator, findings log
- **AI integration**: AI estimates market size from web research, suggests interview questions, summarizes findings, flags validation gaps
- **Artifact type**: `research`
- **Schema**: New `Research` model (type, title, content, findings, linked features)
- **Files**: Prisma migration, `researchRouter`, research view component

#### 1B. Kanban Board
The execution bridge. Features flow from the tree into lanes. This is where planning meets doing.

- **What it does**: Backlog / In Progress / Review / Done columns, drag-and-drop cards, filter by assignee/priority/status, feature detail panel
- **Data source**: Features from the feature tree (status field drives column placement)
- **AI integration**: AI suggests sprint scope based on priorities + velocity, flags blocked items, auto-assigns based on past patterns
- **No new model needed** — uses existing Feature model's `status` field
- **Files**: Kanban view component, minor feature router updates

#### 1C. Feedback Inbox
The input funnel. Raw signals come in here and feed the entire planning loop.

- **What it does**: Capture feedback from multiple sources (manual entry, paste from support tickets, interview notes). Tag, categorize, and link feedback to features/personas. Sentiment analysis. Voting/frequency tracking.
- **AI integration**: AI categorizes incoming feedback, suggests feature links, identifies patterns ("12 users mentioned slow onboarding"), generates insight summaries
- **Artifact type**: `feedback`
- **Schema**: New `Feedback` model (source, content, sentiment, category, linked features, linked personas, votes/frequency)
- **Files**: Prisma migration, `feedbackRouter`, feedback inbox view component

---

### Phase 2: Workflow Depth
*Add the connecting tissue that makes views work together, not just side-by-side.*

#### 2A. User Stories on Features
The bridge between personas and features. Every feature should answer "who is this for and why?"

- **What it does**: Structured user story field on each feature: "As a [persona], I want [action] so that [outcome]". Persona dropdown auto-populates from project personas. Acceptance criteria checklist. Story points estimate.
- **AI integration**: AI generates user stories from feature title + linked persona, suggests acceptance criteria from PRD context
- **No new model** — extends Feature model with `userStory`, `acceptanceCriteria`, `storyPoints` fields
- **Files**: Prisma migration, feature router update, feature tree node detail panel, kanban card detail

#### 2B. Release Notes / Changelog
The output side. When features ship, communicate what changed.

- **What it does**: Auto-populated from features moved to "Done" in kanban. Grouped by release/version. Markdown editor for polish. Audience toggles (internal team, users, stakeholders). Copy/export.
- **AI integration**: AI drafts release notes from feature descriptions + PRD context, adjusts tone per audience (technical for team, simple for users, strategic for stakeholders)
- **Artifact type**: `release`
- **Schema**: New `Release` model (version, title, content, audience, status, linked features, publishedAt)
- **Files**: Prisma migration, `releaseRouter`, release notes view or section within kanban

#### 2C. Version History *(pending)*
Snapshot and restore for Plans and PRDs. Safety net for iterative editing.

- **What it does**: Auto-snapshot before each save. History dropdown showing timestamps + diff preview. One-click restore. Compare versions side-by-side.
- **No new model** — `ArtifactVersion` type within existing artifact store, or a `Version` model in Prisma
- **Files**: Version store actions, history dropdown component, diff viewer

---

### Phase 3: Cross-Artifact AI Intelligence
*This is the moat. AI that reasons across all views simultaneously.*

#### 3A. Gap Detection
AI continuously scans for missing connections:
- "Feature X has no user story — which persona is it for?"
- "Persona 'Early Adopter' has no features addressing their top frustration"
- "3 roadmap items have no RICE score — prioritize before committing dates"
- "Your PRD mentions 'real-time sync' but no feature exists for it"
- "Competitor Y launched feature Z — you have nothing equivalent"

Surfaces as cards in the Overview dashboard and as proactive suggestions in the AI panel.

#### 3B. Feedback-to-Feature Loop
The killer cycle:
- Feedback comes into the inbox
- AI clusters it by theme and links to existing features (or suggests new ones)
- Priority matrix auto-adjusts RICE "Reach" based on feedback volume
- Roadmap highlights items with high user demand
- When features ship, AI identifies which feedback items are resolved

#### 3C. Consistency Checks
AI validates that artifacts don't contradict each other:
- Plan says "launch in Q2" but roadmap shows Q3
- PRD specifies 5 features but feature tree has 8
- Persona goals don't align with any feature's user story
- RICE scores suggest different priorities than roadmap ordering

#### 3D. Smart Suggestions
Context-aware AI that proactively helps:
- Viewing feature tree → "Based on your plan, you're missing an onboarding flow"
- Viewing roadmap → "This timeline is aggressive given your team size. Consider cutting X"
- Viewing personas → "Your competitor targets this segment but you don't have a persona for it"
- Viewing feedback → "This cluster of complaints maps to Feature Y, which is deprioritized"

---

### Phase 4: Founder Experience
*Make the "idea to plan" journey feel magical for first-time founders.*

#### 4A. Guided Onboarding
- "Start from an idea" wizard — describe your idea in plain text, AI generates initial plan + personas + competitor list
- "Import customer discovery" — paste interview notes or survey results, AI extracts personas + insights + feature ideas
- Progressive disclosure — don't show all 11 views on day one, unlock as artifacts are created

#### 4B. Validation Framework
- Problem-Solution fit checklist (auto-scored based on research + personas + feedback)
- MVP scope calculator — AI suggests minimum features for validation based on plan + priorities
- "Ready to build?" assessment — scores completeness across plan, PRD, features, personas

#### 4C. One-Page Export
- Generate a single investor-ready document: problem, market size, personas, solution, features, roadmap
- Export as PDF or shareable link
- Auto-updates as underlying artifacts change

---

### Phase 5: Wireframe Generation
*Go from feature descriptions to visual mockups — close the imagination gap.*

#### 5A. AI Wireframe Generator
- AI generates low-fidelity wireframes (HTML/SVG) from feature descriptions + user stories
- Multiple layout suggestions per feature (e.g., "list view vs. card view for this dashboard")
- Linked to features — each feature can have wireframe attachments
- **Integration opportunity**: Export to Figma via Figma API, or use Excalidraw (open-source) as the embedded canvas

#### 5B. Interactive Wireframe Editor
- Drag-and-drop editing of generated wireframes
- Component library (buttons, inputs, cards, navs, tables) for quick assembly
- Annotation mode — leave notes for developers on specific elements
- **Integration opportunity**: Embed Excalidraw React component for the canvas, keeping it lightweight vs. building a full editor from scratch

#### 5C. Wireframe-to-Spec Pipeline
- AI generates developer specs from wireframes + PRD (component breakdown, props, state)
- Export as PNG/SVG for design reviews or as HTML for developer reference
- Version wireframes alongside features (wireframe v1 → feedback → wireframe v2)

---

### Phase 6: Developer Handoff & Execution
*Bridge planning to building.*

#### 6A. Technical Spec Generation
- AI generates technical specs from PRD + feature tree + wireframes
- Includes API contracts, data models, component breakdown
- Links to specific features and user stories

#### 6B. MCP Server for IDE Sync
- Cursor / VS Code extension that reads Hannibal context
- Developer asks "what should this component do?" and gets answer from PRD + feature spec + wireframe
- Bi-directional: mark features as "in progress" from IDE
- **Integration opportunity**: Build as MCP server so it works with any MCP-compatible IDE (Cursor, Windsurf, Claude Code)

#### 6C. Sprint Planning
- AI suggests sprint scope from kanban backlog + velocity
- Capacity planning based on team size
- Sprint review summaries auto-generated

---

### Phase 7: Measure & Iterate
*Close the loop — learn from what shipped.*

#### 7A. Metrics Dashboard
- Define KPIs per feature (from PRD success metrics)
- Track actuals vs. targets (manual input or integrations)
- AI flags underperforming features

#### 7B. Retrospective Facilitator
- AI-guided retro based on sprint data + feedback
- Auto-captures decisions and action items
- Links action items back to features/plan

#### 7C. Stakeholder Reports
- Auto-generated weekly/monthly updates
- Progress against roadmap, key metrics, risks
- Audience-aware tone (board vs. team vs. users)

---

## View Map (Final State)

| # | View | Status | Purpose |
|---|------|--------|---------|
| 1 | Overview / Dashboard | Done | Project health, artifact coverage, RICE highlights, recent activity |
| 2 | Plan Editor | Done | Strategic planning (MarkdownDoc) |
| 3 | PRD Editor | Done | Detailed requirements (MarkdownDoc) |
| 4 | Feature Tree | Done | Hierarchical feature breakdown (@xyflow/react + dagre) |
| 5 | Priority Matrix | Done | RICE scoring and ranking with AI suggestions |
| 6 | Personas | Done | User archetypes with decision-making context |
| 7 | Competitors | Done | Market positioning with strategic trajectory |
| 8 | Roadmap | Done | Timeline planning (dnd-timeline, lanes, dependencies) |
| 9 | Research Tracker | Phase 1 | Market validation |
| 10 | Kanban Board | Phase 1 | Execution tracking |
| 11 | Feedback Inbox | Phase 1 | User signal collection |

User stories enhance the Feature Tree and Kanban views. Release notes and version history enhance existing views rather than adding new ones.

---

## Integration Strategy

*Build what's core, integrate what's commodity. For each view, evaluate whether an external tool does it better and offer a bridge.*

The principle: Hannibal owns the **AI intelligence layer and the cross-artifact connections**. For individual views, if a best-in-class tool exists and users already use it, integrate rather than compete.

### Evaluate Per View (During Build)
When building each view, answer these questions:
1. **Is there a dominant tool users already love for this?** (e.g., Linear for kanban, Figma for wireframes)
2. **Does building it in-house strengthen the AI context bridge?** (if yes, build it — data stays local for AI reasoning)
3. **Can we integrate and still maintain cross-artifact intelligence?** (if yes, offer both: native view + import/sync)

### Known Integration Opportunities

| View / Feature | Native (Build) | Integrate (Bridge) |
|---------------|----------------|-------------------|
| **Kanban** | Native board (features need to stay in our DB for AI) | Import from Linear/Jira, sync status back |
| **Feedback** | Native inbox for AI analysis | Import from Intercom, Zendesk, Canny, Typeform via API or CSV |
| **Research** | Native tracker | Import survey data from Typeform, Google Forms; web research via Tavily API (already integrated) |
| **Wireframes** | Lightweight Excalidraw-based editor | Export to Figma via API; import screenshots for AI analysis |
| **Release Notes** | Native drafting with AI | Publish to Notion, Slack, email via webhooks |
| **IDE Sync** | MCP server (native) | Works with Cursor, Windsurf, VS Code, Claude Code |
| **Metrics** | Manual input + KPI tracker | Pull from Mixpanel, Amplitude, PostHog via API |
| **Stakeholder Reports** | AI-generated | Export to PDF, Notion, Slack, email |

### Integration Principles
- **Always native-first**: The in-app view must work standalone. Integrations are additive.
- **Import > Sync**: Start with one-way import (CSV, paste, API pull). Bi-directional sync is Phase 7+ complexity.
- **AI needs the data local**: If the AI can't read it, it can't reason about it. Always store a copy in our DB even when importing.
- **Don't block on integrations**: Build the native view first, add integration points after. Users without those tools still get full value.

---

## The Differentiator

Every tool on the market does one or two of these views well. Notion does docs. Linear does kanban. Aha! does roadmaps. ProductBoard does feedback.

Hannibal does all of them in one workspace with an AI that understands the connections between them. That's the moat:

- **Not** "AI writes your PRD" (ChatGPT does that)
- **Not** "all-in-one PM tool" (Notion does that)
- **It's** "AI that knows your personas don't match your features, your roadmap contradicts your plan, and 15 users are asking for something you deprioritized"

Cross-artifact intelligence is what makes this worth switching for.
