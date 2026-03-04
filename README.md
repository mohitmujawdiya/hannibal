# Hannibal

AI-native product management platform. Think "Cursor for PMs" — an LLM co-pilot that assists through the entire product lifecycle, from problem discovery to roadmap planning.

**[Try the demo](https://hannibal-gamma.vercel.app/demo)** — no sign-up required.

## What it does

Hannibal provides a three-panel workspace (sidebar, main content, persistent AI chat) where a PM can:

- **Plan** — Generate implementation plans with problem statements, target users, solutions, risks, and timelines.
- **Specify** — Create PRDs with user stories, acceptance criteria, technical constraints, and scoping.
- **Map features** — Build hierarchical feature trees with React Flow, decomposing a product into manageable pieces.
- **Prioritize** — Score features using RICE (Reach, Impact, Confidence, Effort) and visualize them in a priority matrix.
- **Roadmap** — Build interactive timeline roadmaps with drag-and-drop lanes, milestones, and dependencies.
- **Understand users** — Generate detailed user personas with demographics, goals, frustrations, and behaviors.
- **Analyze competition** — Research and structure competitor analyses with strengths, weaknesses, and feature gaps.
- **Research** — Ask the AI to research markets, competitors, or trends using web search (Tavily) grounded in real data.

All artifacts are generated via AI tool calls, rendered as interactive cards in the chat, and pushed to dedicated views in the workspace. The AI is context-aware — it knows which view you're on, what artifacts exist, and references past decisions.

## Tech stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4, shadcn/ui, react-resizable-panels |
| Editor | MarkdownDoc (react-markdown + textarea edit mode) |
| Visualization | @xyflow/react + dagre (feature tree), dnd-timeline + dnd-kit (roadmap) |
| AI | Vercel AI SDK v6, OpenAI GPT-4o, Tavily (web search) |
| API | tRPC v11 (type-safe end-to-end) |
| Database | PostgreSQL, Prisma 7 (13 models) |
| Auth | Clerk |
| State | Zustand 5 (client UI state), TanStack Query 5 (server state via tRPC) |

## Architecture

### Workspace Layout

```
┌──────────┬──────────────────────┬──────────────┐
│ Sidebar  │ Main Content Area    │ AI Panel     │
│ (nav)    │ (active view)        │ (persistent) │
└──────────┴──────────────────────┴──────────────┘
```

- **Sidebar:** Project list + view switcher (founder flow order). Collapsible (`Cmd+B`).
- **Main Content:** Renders the active view (plan, PRD, features, roadmap, etc.).
- **AI Panel:** Persistent chat with context-aware AI. Collapsible (`Cmd+L`).
- **Context Bridge:** Zustand store `useWorkspaceContext` connects all three panels — views write context, AI reads it.
- **Clean URLs:** Projects use slugs (`/my-project/plan`) with bidirectional view-URL sync.

### AI System

```
User message
  → chat route (src/app/api/chat/route.ts)
    → load project artifacts from DB (project-context service)
    → merge with client-side unpushed artifacts
    → build system prompt (identity + view context + tiered artifact state)
    → streamText with tools
      → askFollowUp (strategic clarification before generating)
      → generatePlan / generatePRD / generatePersona / ...
      → editPlan / editPRD (in-place editing of saved docs)
      → readArtifact / readAllArtifacts (on-demand full content)
      → webSearch (Tavily)
    → stream response + tool results to client
  → artifact card rendered in AI panel
    → "Push to View" saves to DB via tRPC
```

**Follow-up questions** — Before generating artifacts, the AI asks strategic clarifying questions (2-4 options) using a human-in-the-loop tool. Users click their choice inline in the chat, and the AI adapts its output accordingly.

**AI editing** — The AI can edit existing saved plans and PRDs in-place via `editPlan`/`editPRD` tools, streaming the updated content live into the detail view with an animated indicator.

**Three-tier artifact context** — The system prompt includes artifact state tiered by relevance:
- **Tier 1:** Artifacts matching the active view get full serialized content (up to 8K chars)
- **Tier 2:** Other artifacts get one-line summaries (type, title, counts)
- **On demand:** `readArtifact` / `readAllArtifacts` tools fetch full content when the AI needs cross-artifact context

**Expert prompt pattern** — Tool descriptions use expert personas (e.g., "senior product strategist who's shipped 0-to-1") with per-section quality criteria. Sections are framed as "typical sections — include all that apply, skip or add as context demands" so the AI adapts structure to the specific product.

### Artifact Data Flow

Artifacts follow two paths depending on type:

| Artifact | Storage | Rendering | Editing |
|----------|---------|-----------|---------|
| Plan | Markdown (`content` column) | List view (card grid) + detail view (section cards or raw markdown) | Textarea in MarkdownDoc, or AI edit in-place |
| PRD | Markdown (`content` column) | List view (card grid) + detail view (section cards or raw markdown) | Textarea in MarkdownDoc, or AI edit in-place |
| Persona | Markdown (`content` column) | Parsed into structured fields → card UI | Per-field form inputs |
| Competitor | Markdown (`content` column) | Parsed into structured fields → card UI | Per-field form inputs |
| Feature Tree | Structured JSON (children array) | @xyflow/react nodes + dagre layout | Direct node editing in React Flow |
| Roadmap | Structured JSON (lanes/items) | dnd-timeline Gantt chart | Drag-and-drop + edit dialogs |

Plan and PRD editors support multiple documents per project — the list view shows cards with title, status badge, prose preview, and timestamp. The detail view toggles between section-card mode (markdown parsed into collapsible sections) and raw markdown mode.

For persona/competitor cards, markdown is parsed via regex into typed fields (`parsePersonaMarkdown`, `parseCompetitorMarkdown`). An **extras catch-all** (`extractUnrecognizedSections`) captures any bold-labeled sections the parser doesn't explicitly handle, so new AI-generated sections render instead of being silently dropped.

### Database Schema

13 models in Prisma, PostgreSQL:

| Model | Role |
|-------|------|
| Project | Top-level container (one per product, unique slug) |
| Conversation | Chat session per project |
| Message | Messages in conversation (user/assistant/system) |
| Plan | Implementation plan (markdown content, status, version) |
| PRD | Product requirements doc (markdown content, status, version) |
| Feature | Feature tree node (self-referential parent/child, RICE scores) |
| Persona | User persona (markdown content) |
| Competitor | Competitor analysis (markdown content) |
| Roadmap | Timeline container (title, time scale) |
| RoadmapLane | Swim lane in roadmap |
| RoadmapItem | Task/milestone (dates, status, type, feature link) |
| RoadmapDependency | Dependency between roadmap items |
| WaitlistEntry | Email waitlist for landing page signups |

### State Management

- **Zustand** for UI-only state: active view, selections, panel visibility, AI edit state, draft text
  - `workspace-context.ts` — context bridge between panels (includes `AiEditState` for live AI editing and `requestAiFocus` for empty-state CTAs)
  - `artifact-store.ts` — unpushed artifacts (localStorage persistence)
  - `project-store.ts` — project-level UI state
- **TanStack Query** (via tRPC) for all server data — no server state in Zustand
- **Conversation persistence** — chat history saved to DB via `conversation` router, serialized via `chat-serialization.ts`

## Getting started

### Prerequisites

- Node.js 18+
- pnpm
- Docker (for PostgreSQL)
- OpenAI API key
- Tavily API key (for web search)
- Clerk publishable + secret keys

### Setup

```bash
git clone https://github.com/mohitmujawdiya/hannibal.git
cd hannibal
pnpm install
```

Copy `.env.example` to `.env` and add your keys:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hannibal?schema=public"
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

Start the database and run migrations:

```bash
docker compose up -d
pnpm prisma migrate dev
```

### Demo mode (optional)

Seed a sample project accessible at `/demo` without sign-up:

```bash
pnpm tsx prisma/seed-demo.ts
```

This creates a pre-populated project (plan, PRD, features, personas, competitors, roadmap) using the `DEMO_USER_ID` and `DEMO_PROJECT_SLUG` env vars. Demo visitors get a cookie-based auth fallback with stricter rate limiting (10 AI messages/hour).

### Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
├── app/
│   ├── api/chat/                 # AI chat endpoint (streaming, tool calls, project context)
│   ├── api/trpc/                 # tRPC API handler
│   ├── api/waitlist/             # Email waitlist endpoint
│   ├── api/admin/invite/         # Admin invitation endpoint (Clerk)
│   ├── admin/waitlist/           # Admin waitlist management page
│   ├── (demo)/demo/              # Demo mode (no auth, cookie-based, pre-seeded project)
│   └── (workspace)/[projectSlug]/ # Workspace layout with slug-based project routes
├── components/
│   ├── ai/                       # AI panel sub-components
│   │   ├── artifact-card.tsx     # Artifact preview + "Push to View" button
│   │   └── follow-up-card.tsx    # AI follow-up question cards (clickable options)
│   ├── admin/
│   │   └── waitlist-table.tsx    # Admin waitlist management table
│   ├── editor/
│   │   └── markdown-doc.tsx      # Markdown viewer/editor (react-markdown + textarea)
│   ├── landing/                  # Public landing page components
│   │   ├── hero-section.tsx
│   │   ├── feature-cards.tsx
│   │   ├── how-it-works.tsx
│   │   ├── signup-form.tsx
│   │   ├── landing-navbar.tsx
│   │   └── landing-footer.tsx
│   ├── ui/                       # shadcn/ui primitives (button, card, dialog, etc.)
│   ├── views/                    # Main content views
│   │   ├── overview.tsx          # Project dashboard
│   │   ├── plan-editor.tsx       # Plans (multi-doc list + detail with section cards)
│   │   ├── prd-editor.tsx        # PRDs (multi-doc list + detail with section cards)
│   │   ├── feature-tree.tsx      # React Flow feature hierarchy
│   │   ├── priority-matrix.tsx   # RICE scoring & prioritization
│   │   ├── roadmap.tsx           # Interactive timeline roadmap
│   │   ├── persona-cards.tsx     # User persona cards (parsed markdown)
│   │   ├── competitor-matrix.tsx # Competitive analysis cards (parsed markdown)
│   │   ├── research-tracker.tsx  # Market research
│   │   ├── dashboard/            # Overview dashboard widgets
│   │   └── roadmap/              # Roadmap timeline sub-components (bars, lanes, milestones)
│   └── workspace/                # Shell components
│       ├── workspace-shell.tsx   # Three-panel layout (+ demo banner)
│       ├── sidebar.tsx           # Navigation + project list
│       ├── ai-panel.tsx          # Persistent AI chat panel
│       ├── main-content.tsx      # Active view renderer
│       ├── view-sync.tsx         # Initial view hydration from URL
│       └── project-switcher.tsx  # Project dropdown
├── hooks/
│   ├── use-conversation.ts       # Chat persistence lifecycle
│   ├── use-project-data.ts       # Typed hooks for project artifacts (plans, PRDs, etc.)
│   ├── use-view-url-sync.ts      # Bidirectional view ↔ URL sync
│   └── use-debounced-mutation.ts # Debounced tRPC mutations
├── lib/
│   ├── artifact-types.ts         # Artifact type definitions
│   ├── markdown-to-artifact.ts   # Markdown → structured data parsers (with extras catch-all)
│   ├── chat-serialization.ts     # Chat message serialize/deserialize
│   ├── slug.ts                   # Project slug generation (kebab-case, collision-safe)
│   ├── rice-scoring.ts           # RICE score calculation
│   ├── feature-tree-to-flow.ts   # Feature tree → @xyflow nodes/edges
│   ├── roadmap-utils.ts          # dnd-timeline adapters
│   ├── rate-limit.ts             # Upstash rate limiting (normal + demo)
│   └── transforms/               # Artifact ↔ markdown serializers
│       ├── plan.ts
│       ├── prd.ts
│       ├── persona.ts
│       ├── competitor.ts
│       ├── feature-tree.ts
│       └── roadmap.ts
├── server/
│   ├── ai/
│   │   ├── prompts/
│   │   │   ├── system.ts               # Dynamic system prompt builder (identity + context + tiers)
│   │   │   └── artifact-serializers.ts  # Artifact → prompt text (full + summary)
│   │   └── tools/
│   │       ├── generate-artifact.ts     # All generate tools (plan, PRD, persona, etc.)
│   │       ├── edit-artifact.ts         # AI in-place editing (editPlan, editPRD)
│   │       ├── read-artifact.ts         # readArtifact + readAllArtifacts tools
│   │       ├── ask-follow-up.ts         # Human-in-the-loop follow-up questions
│   │       └── web-search.ts            # Tavily web search tool
│   ├── routers/
│   │   ├── _app.ts              # Router merge
│   │   ├── project.ts           # Project CRUD (slug-aware)
│   │   ├── plan.ts              # Plans (+ hardDelete)
│   │   ├── prd.ts               # PRDs (+ hardDelete)
│   │   ├── feature.ts           # Features (+ hardDelete)
│   │   ├── persona.ts           # Personas (+ hardDelete)
│   │   ├── competitor.ts        # Competitors (+ hardDelete)
│   │   ├── roadmap.ts           # Roadmaps (+ hardDelete)
│   │   └── conversation.ts
│   └── services/
│       ├── project-context.ts   # Load saved artifacts from DB for AI context
│       ├── feature-sync.ts      # Sync feature tree from AI to DB
│       ├── roadmap-sync.ts      # Sync roadmap from AI to DB
│       ├── artifact.ts          # Artifact CRUD helpers
│       └── auth.ts              # Auth utilities
└── stores/
    ├── workspace-context.ts     # Context bridge (active view, selections, panels, AI edit state)
    ├── artifact-store.ts        # Unpushed artifacts (localStorage persistence)
    └── project-store.ts         # Project-level UI state
```

## Roadmap

- [ ] Version history for plans and PRDs
- [ ] Bi-directional IDE integration (context sync with code editors)
- [ ] Multi-user collaboration
- [ ] Desktop app (Tauri v2)
