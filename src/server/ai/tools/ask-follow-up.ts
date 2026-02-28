import { tool, jsonSchema } from "ai";

export const askFollowUpTool = tool({
  description:
    "Ask the PM a clarifying question with 2-4 clickable options before generating an artifact. Use when the request is vague, multiple approaches exist, or scope/audience/priorities are unclear. Do NOT use when the request is specific enough to act on directly. Never ask more than one follow-up per turn.",
  inputSchema: jsonSchema<{
    question: string;
    options: Array<{ label: string; description?: string }>;
  }>({
    type: "object",
    properties: {
      question: {
        type: "string",
        description: "The clarifying question to ask the PM",
      },
      options: {
        type: "array",
        description: "2-4 clickable options for the PM to choose from",
        minItems: 2,
        maxItems: 4,
        items: {
          type: "object",
          properties: {
            label: {
              type: "string",
              description: "Short option label (1-5 words)",
            },
            description: {
              type: "string",
              description:
                "Optional brief explanation of what this option means",
            },
          },
          required: ["label"],
        },
      },
    },
    required: ["question", "options"],
  }),
  // No execute — human-in-the-loop tool.
  // The client renders options and provides the result via addToolOutput.
});
