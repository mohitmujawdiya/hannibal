# Hannibal — AI-Native Product Management Platform

## Product
"Cursor for PMs." An AI-native workspace where product managers create plans, PRDs, feature trees, roadmaps, personas, and competitive analysis — with AI assistance throughout.

## Tech Stack
- Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- Novel (AI-native Tiptap editor) for rich text surfaces (plans, PRDs)
- React Flow for feature tree visualization
- dnd-kit for drag-and-drop (kanban)
- react-resizable-panels for the workspace layout
- tRPC for type-safe API, Prisma + PostgreSQL for data
- Vercel AI SDK (OpenAI GPT-4o) for AI streaming and tool calling
- Zustand for client state, TanStack Query for server state
- Clerk for auth

## Workspace Layout (Three-Panel)
```
┌──────────┬──────────────────────┬──────────────┐
│ Sidebar  │ Main Content Area    │ AI Panel     │
│ (nav)    │ (active view)        │ (persistent) │
└──────────┴──────────────────────┴──────────────┘
```
- Sidebar: project list + view switcher. Collapsible (Cmd+B).
- Main Content: renders the active view. Views mount/unmount but preserve state via Zustand.
- AI Panel: persistent chat. Context-aware of the active view. Collapsible (Cmd+L).
- Panels use react-resizable-panels. Cmd+K opens command palette.

## Context Bridge
Zustand store `useWorkspaceContext` connects all three panels:
- Exposes: activeView, selectedEntity, highlightedText, projectId
- Views write to it; AI Panel reads from it for context-aware responses
- AI Panel writes artifacts back, which views consume

## Folder Structure
- `src/app/(workspace)/[projectId]/layout.tsx` — workspace shell
- `src/components/workspace/` — shell components (sidebar, ai-panel, main-content)
- `src/components/views/` — main content views (plan-editor, feature-tree, roadmap, etc.)
- `src/components/ai/` — AI panel sub-components (chat, artifacts, question cards)
- `src/components/ui/` — shadcn/ui primitives
- `src/server/routers/` — tRPC routers
- `src/server/ai/` — AI orchestration (agents, prompts, tools)
- `src/stores/` — Zustand stores
- `prisma/` — schema and migrations

---

## React Component Conventions
- Functional components only, named exports (no default exports except Next.js pages)
- Props: `type XProps = {}` (not interface)
- Use `cn()` from `@/lib/utils` for conditional classnames
- shadcn/ui is the base — extend it, don't reinvent

### Naming
- Components: PascalCase (`FeatureTree`, `AiPanel`)
- Files: kebab-case (`feature-tree.tsx`, `ai-panel.tsx`)
- Hooks: `use` prefix (`useWorkspaceContext`)
- Event handlers: `on` prefix in props, `handle` prefix in implementation

### Views (src/components/views/)
Every view must:
1. Accept a `projectId` prop
2. Register with context bridge on mount via `useWorkspaceContext`
3. Clean up context on unmount

### Imports
- Use `@/` path alias for all imports from `src/`
- Group: React/Next → external libs → @/components → @/lib → @/stores → relative

---

## tRPC Router Conventions
- One router per domain: `project.ts`, `feature.ts`, `plan.ts`, `conversation.ts`
- Merge all in `src/server/routers/_app.ts`
- All procedures use Zod for input validation
- Always use `protectedProcedure` unless explicitly public
- Input: `.min()`, `.max()` on strings; `.cuid()` on IDs
- Return Prisma types directly — types flow end-to-end
- Errors: throw `TRPCError` with code (`NOT_FOUND`, `FORBIDDEN`, `BAD_REQUEST`)
- Keep procedures thin — complex logic goes in `src/server/services/`

---

## Zustand Store Conventions
- One store per concern: `workspace-context.ts`, `project-store.ts`
- Use selectors: `useWorkspaceContext((s) => s.activeView)`
- Never put server-fetched data in Zustand — that goes through tRPC + TanStack Query
- Zustand is for UI state only: active view, selections, panel state, draft text
- Keep stores flat

---

## AI Orchestration
- Vercel AI SDK (`ai` package) for streaming and tool calling
- OpenAI GPT-4o as primary model, Tavily API for web research
- Each AI capability is a separate agent in `src/server/ai/agents/`
- System prompts in `src/server/ai/prompts/` as exported string constants
- Always `streamText` for user-facing chat; `generateText` for background tasks
- Tool definitions live alongside their agent
- Include `maxTokens` and `temperature` explicitly
- Artifacts are typed (`plan | prd | persona | featureTree | competitor`), rendered inline in AI panel, saved to DB on "Push to View"

---

## Prisma & Database Conventions
- Models: PascalCase singular; tables: snake_case plural via `@@map()`
- Fields: camelCase in Prisma, snake_case in DB via `@map()`
- Every model: `id` (cuid), `createdAt`, `updatedAt`
- Soft deletes: `deletedAt DateTime?` where needed
- Ordering: explicit `order Int` for reorderable lists
- Foreign keys: `onDelete: Cascade` for children, `onDelete: SetNull` for optional refs
- JSON fields for flexible AI-generated content
- Prisma enums for status fields
- Project is top-level container; Features have self-referential parent/child tree
