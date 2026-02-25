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

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json();
  const {
    messages: rawMessages,
    activeView = "overview",
    selectedEntity = null,
    highlightedText = null,
    projectName,
    artifacts = [],
    model: requestedModel,
  } = body;

  const ALLOWED_MODELS = ["gpt-4o", "gpt-4o-mini", "o3-mini"];
  const model = ALLOWED_MODELS.includes(requestedModel) ? requestedModel : "gpt-4o";

  const systemPrompt = buildSystemPrompt({
    activeView,
    selectedEntity,
    highlightedText,
    projectName,
    artifacts,
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
      ...artifactTools,
    },
    stopWhen: stepCountIs(5),
    temperature: 0.7,
  });

  return result.toUIMessageStreamResponse();
}
