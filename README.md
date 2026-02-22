# Hannibal

AI-native product management platform. Think Cursor, but for PMs — an LLM co-pilot that assists through the entire product lifecycle, from problem discovery to user feedback analysis.

## What it does

Hannibal provides a three-panel workspace (sidebar, main content, persistent AI chat) where a PM can:

- **Research** — Ask the AI to research markets, competitors, or trends. It uses web search (Tavily) to ground responses in real data.
- **Plan** — Generate implementation plans with problem statements, target users, solutions, risks, and timelines.
- **Specify** — Create PRDs with user stories, acceptance criteria, technical constraints, and scoping.
- **Understand users** — Generate detailed user personas with demographics, goals, frustrations, and behaviors.
- **Map features** — Build hierarchical feature trees to decompose a product into manageable pieces.
- **Analyze competition** — Research and structure competitor analyses with strengths, weaknesses, and feature gaps.

All artifacts are generated via AI tool calls, rendered as interactive cards in the chat, and pushed to dedicated views in the workspace. The AI is context-aware — it knows which view you're on, what artifacts exist, and references past decisions.

## Tech stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS, shadcn/ui, react-resizable-panels |
| AI | Vercel AI SDK v6, OpenAI GPT-4o, Tavily (web search) |
| State | Zustand (client), TanStack Query (server) |
| Persistence | localStorage (chat + artifacts) — DB-backed tier planned |
| Database (planned) | PostgreSQL, Prisma, pgvector |
| Auth (planned) | Clerk |

## Getting started

### Prerequisites

- Node.js 18+
- pnpm
- OpenAI API key
- Tavily API key (for web search)

### Setup

```bash
git clone https://github.com/mohitmujawdiya/hannibal.git
cd hannibal
pnpm install
```

Copy `.env.example` to `.env` and add your keys:

```
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
```

### Run

```bash
pnpm dev
```

Open [http://localhost:3000/demo-1](http://localhost:3000/demo-1).

## Project structure

```
src/
├── app/
│   ├── api/chat/          # AI chat API route (streaming, multi-step tool calls)
│   └── (workspace)/       # Workspace layout with dynamic project routes
├── components/
│   ├── ai/                # Artifact cards rendered in chat
│   ├── ui/                # shadcn/ui primitives
│   ├── views/             # Main content views (plan, PRD, personas, etc.)
│   └── workspace/         # Shell, sidebar, AI panel, main content
├── lib/
│   ├── artifact-types.ts  # TypeScript types for all artifact schemas
│   ├── chat-persistence.ts # ChatStore adapter (localStorage now, DB later)
│   └── schema.ts          # AI SDK schema helpers
├── server/ai/
│   ├── prompts/           # Dynamic system prompt with artifact context
│   └── tools/             # AI tool definitions (web search, artifact generators)
└── stores/
    ├── artifact-store.ts  # Zustand store with localStorage persistence
    └── workspace-context.ts # UI state (active view, panels, selections)
```

## Roadmap

- [ ] Rich text editing (Novel/Tiptap) for PRDs and plans
- [ ] React Flow for interactive feature tree visualization
- [ ] Kanban board with dnd-kit for development tracking
- [ ] Database-backed persistence (Prisma + PostgreSQL)
- [ ] Auth and multi-user support (Clerk)
- [ ] RICE prioritization scoring
- [ ] Roadmap timeline view
- [ ] IDE integration (bi-directional context sync)
- [ ] Desktop app (Tauri v2)
