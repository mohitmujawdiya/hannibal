import { auth } from "@clerk/nextjs/server";
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
import { askFollowUpTool } from "@/server/ai/tools/ask-follow-up";
import { chatLimiter, getRateLimitIdentifier, rateLimitResponse } from "@/lib/rate-limit";
import { loadProjectArtifacts } from "@/server/services/project-context";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (chatLimiter) {
    const id = getRateLimitIdentifier(userId, req);
    const { success, reset } = await chatLimiter.limit(id);
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
    },
    stopWhen: stepCountIs(5),
    temperature: 0.7,
    maxOutputTokens: 8192,
  });

  return result.toUIMessageStreamResponse();
}
