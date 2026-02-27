# Hannibal — AI-Native Product Management Platform

## Product
"Cursor for PMs." An AI-native workspace where product managers create plans, PRDs, feature trees, roadmaps, personas, and competitive analysis — with AI assistance throughout.

## Tech Stack
- Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- MarkdownDoc component (react-markdown + textarea edit mode) for rich text surfaces (plans, PRDs)
- @xyflow/react + dagre for feature tree visualization
- dnd-timeline + dnd-kit for roadmap timeline drag-and-drop
- react-resizable-panels for the workspace layout
- tRPC v11 for type-safe API, Prisma 7 + PostgreSQL for data
- Vercel AI SDK v6 (OpenAI GPT-4o) for AI streaming and tool calling, Tavily for web search
- Zustand 5 for client state, TanStack Query 5 for server state
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
- `src/app/api/chat/route.ts` — AI chat endpoint (streaming, tool calls, project context)
- `src/app/api/trpc/` — tRPC API handler
- `src/components/workspace/` — shell components (sidebar, ai-panel, main-content, project-switcher)
- `src/components/views/` — main content views (plan-editor, feature-tree, roadmap, etc.)
- `src/components/views/dashboard/` — overview dashboard widgets
- `src/components/views/roadmap/` — roadmap timeline sub-components
- `src/components/ai/` — AI panel sub-components (artifact-card)
- `src/components/editor/` — MarkdownDoc component (react-markdown + textarea)
- `src/components/ui/` — shadcn/ui primitives
- `src/hooks/` — shared hooks (use-conversation, use-project-data, use-debounced-mutation)
- `src/lib/` — utilities (artifact types, markdown parsers, RICE scoring, rate limiting)
- `src/lib/transforms/` — artifact serialization transforms (plan, prd, persona, competitor, feature-tree, roadmap)
- `src/server/routers/` — tRPC routers (project, plan, prd, feature, persona, competitor, roadmap, conversation)
- `src/server/ai/prompts/` — system prompt builder + artifact serializers
- `src/server/ai/tools/` — AI tool definitions (generate-artifact, read-artifact, web-search)
- `src/server/services/` — business logic (feature-sync, roadmap-sync, project-context, auth, artifact)
- `src/stores/` — Zustand stores (workspace-context, artifact-store, project-store)
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
- Single chat endpoint (`src/app/api/chat/route.ts`) orchestrates all AI via `streamText`
- System prompt built dynamically in `src/server/ai/prompts/system.ts` with view context + artifact state
- Tool definitions in `src/server/ai/tools/` (generate-artifact, read-artifact, web-search)
- Include `maxOutputTokens` and `temperature` explicitly
- Artifacts are typed (`plan | prd | persona | featureTree | competitor | roadmap`), rendered inline in AI panel, saved to DB on "Push to View"

### Three-Tier Artifact Context
The system prompt includes artifact state tiered by relevance to the active view:
- **Tier 1 (full content):** Artifacts matching the active view (e.g. plan artifact on plan view) — serialized in full up to 8000 chars
- **Tier 2 (summaries):** All other artifacts — one-line summaries with counts and structure
- View-to-artifact mapping defined in `VIEW_PRIMARY_ARTIFACTS` in `system.ts`
- `readArtifact` / `readAllArtifacts` tools let the AI fetch full content for Tier 2 artifacts on demand

### Expert Prompt Pattern
Tool descriptions use expert personas with per-section quality criteria rather than format-only instructions. Section headings are framed as "typical sections (include all that apply, skip or add as context demands)" so the AI can adapt structure to context.

### Artifact Parsing & Extras Catch-All
- Persona and competitor artifacts are stored as markdown but parsed into structured fields for card UI rendering
- Parsers are in `src/lib/markdown-to-artifact.ts` with inverse builders in the view components
- **Extras catch-all:** `extractUnrecognizedSections()` captures any bold-labeled sections the parser doesn't explicitly handle, so new AI-generated sections render instead of being silently dropped
- Known fields get structured pretty rendering (colored icons, grids); unknown extras render as neutral text blocks

### Conversation Persistence
- Chat history persisted to DB via `conversation` tRPC router
- Messages serialized/deserialized via `src/lib/chat-serialization.ts`
- `useConversation` hook manages conversation lifecycle per project
- Project context (saved artifacts from DB) loaded server-side in the chat route via `src/server/services/project-context.ts`

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
