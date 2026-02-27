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
| Visualization | React Flow + dagre (feature tree), dnd-timeline (roadmap) |
| AI | Vercel AI SDK v6, OpenAI GPT-4o, Tavily (web search) |
| API | tRPC v11 (type-safe end-to-end) |
| Database | PostgreSQL, Prisma 7 |
| Auth | Clerk |
| State | Zustand (client UI state), TanStack Query (server state) |

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
│   ├── api/chat/              # AI chat endpoint (streaming, tool calls)
│   ├── api/trpc/              # tRPC API handler
│   └── (workspace)/           # Workspace layout with dynamic project routes
├── components/
│   ├── ai/                    # Artifact cards rendered in chat
│   ├── editor/                # MarkdownDoc editor (react-markdown + textarea)
│   ├── ui/                    # shadcn/ui primitives
│   ├── views/                 # Main content views
│   │   ├── overview.tsx       # Project dashboard
│   │   ├── plan-editor.tsx    # Implementation plans
│   │   ├── prd-editor.tsx     # Product requirements docs
│   │   ├── feature-tree.tsx   # React Flow feature hierarchy
│   │   ├── priority-matrix.tsx # RICE scoring & prioritization
│   │   ├── roadmap.tsx        # Interactive timeline roadmap
│   │   ├── persona-cards.tsx  # User personas
│   │   ├── competitor-matrix.tsx # Competitive analysis
│   │   └── research-tracker.tsx  # Market research
│   └── workspace/             # Shell, sidebar, AI panel, main content
├── lib/                       # Utilities & helpers
├── server/
│   ├── ai/
│   │   ├── prompts/           # Dynamic system prompt with artifact context
│   │   └── tools/             # AI tool definitions (web search, artifact gen)
│   ├── routers/               # tRPC routers (project, feature, plan, prd, etc.)
│   └── services/              # Business logic
└── stores/
    ├── artifact-store.ts      # Generated artifacts (localStorage persistence)
    ├── project-store.ts       # Project-level UI state
    └── workspace-context.ts   # Context bridge (active view, selections, panels)
```

## Roadmap

- [ ] Version history for plans and PRDs
- [ ] Bi-directional IDE integration (context sync with code editors)
- [ ] Multi-user collaboration
- [ ] Desktop app (Tauri v2)
