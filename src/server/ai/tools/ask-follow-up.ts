import { tool, jsonSchema } from "ai";

export const askFollowUpTool = tool({
  description:
    "Ask the user a strategic clarifying question with 2-4 mutually exclusive options before generating an artifact. Use up to 3 rounds (one question per turn) to gather enough context — after each answer, re-evaluate which of the 5 context criteria (topic, audience, angle, type, scope) are still missing and ask about the next most impactful dimension. The question must uncover a STRATEGIC DIMENSION (business model, go-to-market, scope, competitive positioning, stage, target audience segment, plan type) that reshapes the entire output — not a feature preference. Options must be directions the user must choose BETWEEN, never features they'd want to combine. Litmus test: if the user could say 'I want all of these', rethink the question.",
  inputSchema: jsonSchema<{
    question: string;
    options: Array<{ label: string; description: string }>;
  }>({
    type: "object",
    properties: {
      question: {
        type: "string",
        description:
          "A question about a strategic decision that changes the entire plan's shape. Ask about business model, go-to-market, competitive positioning, scope, or stage — NEVER about which features to include (all relevant features belong in the artifact regardless). BAD: 'What should the app focus on?' (invites feature-picking). GOOD: 'What's the business context?' or 'How will this reach users?' (shapes strategy).",
      },
      options: {
        type: "array",
        description: "2-4 mutually exclusive strategic directions. Each must be something the user chooses BETWEEN, not features they'd want to combine.",
        minItems: 2,
        maxItems: 4,
        items: {
          type: "object",
          properties: {
            label: {
              type: "string",
              description:
                "Concise label (2-8 words) naming a strategic direction. BAD: 'Workout tracking' (feature). GOOD: 'VC-backed Peloton competitor' (strategic direction).",
            },
            description: {
              type: "string",
              description:
                "1-2 sentences explaining the strategic implications — how this direction changes priorities, approach, scope, and what success looks like. NOT a feature description.",
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
