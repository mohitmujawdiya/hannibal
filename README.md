# Hannibal

AI-native product management platform. Think "Cursor for PMs" — an LLM co-pilot that assists through the entire product lifecycle, from problem discovery to roadmap planning.

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
| Database | PostgreSQL, Prisma 7 (12 models) |
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

- **Sidebar:** Project list + view switcher. Collapsible (`Cmd+B`).
- **Main Content:** Renders the active view (plan, PRD, features, roadmap, etc.).
- **AI Panel:** Persistent chat with context-aware AI. Collapsible (`Cmd+L`).
- **Context Bridge:** Zustand store `useWorkspaceContext` connects all three panels — views write context, AI reads it.

### AI System

```
User message
  → chat route (src/app/api/chat/route.ts)
    → load project artifacts from DB (project-context service)
    → merge with client-side unpushed artifacts
    → build system prompt (identity + view context + tiered artifact state)
    → streamText with tools
      → generatePlan / generatePRD / generatePersona / ...
      → readArtifact / readAllArtifacts (on-demand full content)
      → webSearch (Tavily)
    → stream response + tool results to client
  → artifact card rendered in AI panel
    → "Push to View" saves to DB via tRPC
```

**Three-tier artifact context** — The system prompt includes artifact state tiered by relevance:
- **Tier 1:** Artifacts matching the active view get full serialized content (up to 8K chars)
- **Tier 2:** Other artifacts get one-line summaries (type, title, counts)
- **On demand:** `readArtifact` / `readAllArtifacts` tools fetch full content when the AI needs cross-artifact context

**Expert prompt pattern** — Tool descriptions use expert personas (e.g., "senior product strategist who's shipped 0-to-1") with per-section quality criteria. Sections are framed as "typical sections — include all that apply, skip or add as context demands" so the AI adapts structure to the specific product.

### Artifact Data Flow

Artifacts follow two paths depending on type:

| Artifact | Storage | Rendering | Editing |
|----------|---------|-----------|---------|
| Plan | Markdown (`content` column) | Raw markdown via MarkdownDoc | Textarea in MarkdownDoc |
| PRD | Markdown (`content` column) | Raw markdown via MarkdownDoc | Textarea in MarkdownDoc |
| Persona | Markdown (`content` column) | Parsed into structured fields → card UI | Per-field form inputs |
| Competitor | Markdown (`content` column) | Parsed into structured fields → card UI | Per-field form inputs |
| Feature Tree | Structured JSON (children array) | @xyflow/react nodes + dagre layout | Direct node editing in React Flow |
| Roadmap | Structured JSON (lanes/items) | dnd-timeline Gantt chart | Drag-and-drop + edit dialogs |

For persona/competitor cards, markdown is parsed via regex into typed fields (`parsePersonaMarkdown`, `parseCompetitorMarkdown`). An **extras catch-all** (`extractUnrecognizedSections`) captures any bold-labeled sections the parser doesn't explicitly handle, so new AI-generated sections render instead of being silently dropped.

### Database Schema

12 models in Prisma, PostgreSQL:

| Model | Role |
|-------|------|
| Project | Top-level container (one per product) |
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

### State Management

- **Zustand** for UI-only state: active view, selections, panel visibility, draft text
  - `workspace-context.ts` — context bridge between panels
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
│   └── (workspace)/              # Workspace layout with dynamic project routes
├── components/
│   ├── ai/                       # Artifact cards rendered in AI panel chat
│   │   └── artifact-card.tsx     # Artifact preview + "Push to View" button
│   ├── editor/
│   │   └── markdown-doc.tsx      # Markdown viewer/editor (react-markdown + textarea)
│   ├── ui/                       # shadcn/ui primitives (button, card, dialog, etc.)
│   ├── views/                    # Main content views
│   │   ├── overview.tsx          # Project dashboard
│   │   ├── plan-editor.tsx       # Implementation plans (MarkdownDoc)
│   │   ├── prd-editor.tsx        # Product requirements docs (MarkdownDoc)
│   │   ├── feature-tree.tsx      # React Flow feature hierarchy
│   │   ├── priority-matrix.tsx   # RICE scoring & prioritization
│   │   ├── roadmap.tsx           # Interactive timeline roadmap
│   │   ├── persona-cards.tsx     # User persona cards (parsed markdown)
│   │   ├── competitor-matrix.tsx # Competitive analysis cards (parsed markdown)
│   │   ├── research-tracker.tsx  # Market research
│   │   ├── dashboard/            # Overview dashboard widgets
│   │   └── roadmap/              # Roadmap timeline sub-components (bars, lanes, milestones)
│   └── workspace/                # Shell components
│       ├── workspace-shell.tsx   # Three-panel layout
│       ├── sidebar.tsx           # Navigation + project list
│       ├── ai-panel.tsx          # Persistent AI chat panel
│       ├── main-content.tsx      # Active view renderer
│       └── project-switcher.tsx  # Project dropdown
├── hooks/
│   ├── use-conversation.ts       # Chat persistence lifecycle
│   ├── use-project-data.ts       # Typed hooks for project artifacts (plans, PRDs, etc.)
│   └── use-debounced-mutation.ts # Debounced tRPC mutations
├── lib/
│   ├── artifact-types.ts         # Artifact type definitions
│   ├── markdown-to-artifact.ts   # Markdown → structured data parsers (with extras catch-all)
│   ├── chat-serialization.ts     # Chat message serialize/deserialize
│   ├── rice-scoring.ts           # RICE score calculation
│   ├── feature-tree-to-flow.ts   # Feature tree → @xyflow nodes/edges
│   ├── roadmap-utils.ts          # dnd-timeline adapters
│   ├── rate-limit.ts             # Upstash rate limiting
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
│   │       ├── read-artifact.ts         # readArtifact + readAllArtifacts tools
│   │       └── web-search.ts            # Tavily web search tool
│   ├── routers/
│   │   ├── _app.ts              # Router merge
│   │   ├── project.ts
│   │   ├── plan.ts
│   │   ├── prd.ts
│   │   ├── feature.ts
│   │   ├── persona.ts
│   │   ├── competitor.ts
│   │   ├── roadmap.ts
│   │   └── conversation.ts
│   └── services/
│       ├── project-context.ts   # Load saved artifacts from DB for AI context
│       ├── feature-sync.ts      # Sync feature tree from AI to DB
│       ├── roadmap-sync.ts      # Sync roadmap from AI to DB
│       ├── artifact.ts          # Artifact CRUD helpers
│       └── auth.ts              # Auth utilities
└── stores/
    ├── workspace-context.ts     # Context bridge (active view, selections, panels)
    ├── artifact-store.ts        # Unpushed artifacts (localStorage persistence)
    └── project-store.ts         # Project-level UI state
```

## Roadmap

- [ ] Version history for plans and PRDs
- [ ] Bi-directional IDE integration (context sync with code editors)
- [ ] Multi-user collaboration
- [ ] Desktop app (Tauri v2)
