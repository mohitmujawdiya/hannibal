// Model routing engine — picks the right OpenAI model for each request based on
// active view, recent message intent, and the user's "Auto" / explicit choice.
//
// Philosophy: PMs don't know gpt-5.4 vs o3 vs gpt-5-pro. The system should default
// to the right model for the task; the user can override when they want.
//
// Routing rules (ordered, first match wins):
// - Reasoning-heavy intent (priorities/RICE/scoring/strategic analysis) → o3
// - Quick edit/refine intent → gpt-5.4-mini
// - "Make it great" intent (deep, thorough, comprehensive) → gpt-5-pro
// - Default → gpt-5.4 (flagship balanced)

export const ALLOWED_MODELS = [
  "auto",
  "gpt-5.4",
  "gpt-5.4-mini",
  "gpt-5-pro",
  "o3",
  "gpt-4o",
] as const;

export type AllowedModel = (typeof ALLOWED_MODELS)[number];

export const DEFAULT_MODEL: Exclude<AllowedModel, "auto"> = "gpt-5.4";

type RoutingContext = {
  activeView?: string;
  messageText?: string;
};

const REASONING_VIEWS = new Set(["priorities"]);

const REASONING_KEYWORDS =
  /\b(rice|prioritize|prioritise|score|scoring|rank|rank.?ed|trade.?off|opportunity cost|impact.?effort|reason about|strategic analysis|pros.?and.?cons|cost.benefit|decision matrix)\b/i;

const QUICK_EDIT_KEYWORDS =
  /\b(refine|edit|polish|tweak|adjust|small change|quick fix|update this|change the|fix the|reword|rephrase|tidy)\b/i;

const HIGH_QUALITY_KEYWORDS =
  /\b(deep|thorough|comprehensive|detailed|exhaustive|in[- ]?depth|high.?quality|polished|production.?grade|investor.?ready|publish.?ready)\b/i;

export function routeModel(
  requested: string | undefined,
  ctx: RoutingContext = {},
): Exclude<AllowedModel, "auto"> {
  // Explicit override (anything that's a real model id wins).
  if (
    requested &&
    requested !== "auto" &&
    (ALLOWED_MODELS as readonly string[]).includes(requested)
  ) {
    return requested as Exclude<AllowedModel, "auto">;
  }

  // Auto routing.
  const text = ctx.messageText ?? "";
  const view = ctx.activeView ?? "";

  if (REASONING_VIEWS.has(view) || REASONING_KEYWORDS.test(text)) {
    return "o3";
  }
  if (HIGH_QUALITY_KEYWORDS.test(text)) {
    return "gpt-5-pro";
  }
  if (QUICK_EDIT_KEYWORDS.test(text)) {
    return "gpt-5.4-mini";
  }
  return DEFAULT_MODEL;
}

// Some models don't accept the standard temperature parameter (o-series reasoning
// models constrain it). This helper returns the right temperature or undefined to
// let the SDK fall through to the model default.
export function temperatureFor(
  model: Exclude<AllowedModel, "auto">,
): number | undefined {
  if (model.startsWith("o")) return undefined; // o3, o4-mini, etc.
  return 0.7;
}
