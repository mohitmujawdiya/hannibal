import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { openai } from "@ai-sdk/openai";
import {
  streamText,
  stepCountIs,
  convertToModelMessages,
  type UIMessage,
} from "ai";
import { buildSystemPrompt } from "@/server/ai/prompts/system";
import { webSearchTool } from "@/server/ai/tools/web-search";
import { artifactTools } from "@/server/ai/tools/generate-artifact";
import { createReadArtifactTool, createReadAllArtifactsTool } from "@/server/ai/tools/read-artifact";
import { createEditPlanTool, createEditPrdTool } from "@/server/ai/tools/edit-artifact";
import { askFollowUpTool } from "@/server/ai/tools/ask-follow-up";
import { chatLimiter, demoChatLimiter, getRateLimitIdentifier, rateLimitResponse } from "@/lib/rate-limit";
import { loadProjectArtifacts } from "@/server/services/project-context";

const DEMO_USER_ID = process.env.DEMO_USER_ID;

export const maxDuration = 60;

export async function POST(req: Request) {
  let userId: string | null = null;
  let isDemo = false;

  const { userId: clerkUserId } = await auth();
  userId = clerkUserId;

  // Demo fallback: if no Clerk session, check for demo cookie
  if (!userId && DEMO_USER_ID) {
    const cookieStore = await cookies();
    const demoCookie = cookieStore.get("hannibal-demo");
    if (demoCookie?.value === "true") {
      userId = DEMO_USER_ID;
      isDemo = true;
    }
  }

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Use stricter rate limiting for demo users
  const limiter = isDemo ? (demoChatLimiter ?? chatLimiter) : chatLimiter;
  if (limiter) {
    const id = getRateLimitIdentifier(userId, req);
    const { success, reset } = await limiter.limit(id);
    if (!success) return rateLimitResponse(reset);
  }

  const body = await req.json();
  const {
    messages: rawMessages,
    activeView = "overview",
    selectedEntity = null,
    highlightedText = null,
    projectId,
    projectName,
    artifacts = [],
    model: requestedModel,
  } = body;

  const ALLOWED_MODELS = ["gpt-4o", "gpt-4o-mini", "o3-mini"];
  const model = ALLOWED_MODELS.includes(requestedModel) ? requestedModel : "gpt-4o";

  // Load saved project artifacts from DB to give AI persistent context
  let dbArtifacts: Awaited<ReturnType<typeof loadProjectArtifacts>> = [];
  if (projectId && typeof projectId === "string") {
    try {
      dbArtifacts = await loadProjectArtifacts(projectId);
    } catch {
      // DB unreachable — proceed without project context
    }
  }

  // Merge DB artifacts with any client-side (unpushed) artifacts
  const allArtifacts = [...dbArtifacts, ...artifacts];

  const systemPrompt = buildSystemPrompt({
    activeView,
    selectedEntity,
    highlightedText,
    projectName,
    artifacts: allArtifacts,
  });

  const modelMessages = await convertToModelMessages(
    rawMessages as UIMessage[]
  );

  const result = streamText({
    model: openai(model),
    system: systemPrompt,
    messages: modelMessages,
    tools: {
      webSearch: webSearchTool,
      askFollowUp: askFollowUpTool,
      ...artifactTools,
      readArtifact: createReadArtifactTool(allArtifacts),
      readAllArtifacts: createReadAllArtifactsTool(allArtifacts),
      editPlan: createEditPlanTool(userId),
      editPRD: createEditPrdTool(userId),
    },
    stopWhen: stepCountIs(5),
    temperature: 0.7,
    maxOutputTokens: 16384,
  });

  return result.toUIMessageStreamResponse();
}
