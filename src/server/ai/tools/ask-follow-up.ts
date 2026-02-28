import { tool, jsonSchema } from "ai";

export const askFollowUpTool = tool({
  description:
    "Ask the user a strategic clarifying question with 2-4 options before generating an artifact. The question should uncover the MOST IMPORTANT missing context — the one thing that would change 80% of the output. Ask about differentiation, target user, scope, or strategic angle — NOT surface-level categorization. Never ask more than one follow-up per turn.",
  inputSchema: jsonSchema<{
    question: string;
    options: Array<{ label: string; description: string }>;
  }>({
    type: "object",
    properties: {
      question: {
        type: "string",
        description:
          "A specific, strategic question that uncovers missing context. BAD: 'What's the primary focus?' (too vague, leads to generic categories). GOOD: 'What makes your bedtime stories app different from what already exists?' (uncovers differentiation, which shapes every section of the plan).",
      },
      options: {
        type: "array",
        description: "2-4 options, each representing a meaningfully different strategic direction",
        minItems: 2,
        maxItems: 4,
        items: {
          type: "object",
          properties: {
            label: {
              type: "string",
              description:
                "Concise option label (2-6 words) that names a specific approach, not a generic category. BAD: 'Content Variety'. GOOD: 'AI-generated personalized stories'.",
            },
            description: {
              type: "string",
              description:
                "1-2 sentences explaining what this direction means concretely — what would be built, for whom, and why it matters. Every option MUST have a description.",
            },
          },
          required: ["label", "description"],
        },
      },
    },
    required: ["question", "options"],
  }),
  // No execute — human-in-the-loop tool.
  // The client renders options and provides the result via addToolOutput.
});
