"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  PanelRightClose,
  Send,
  Globe,
  Sparkles,
  MoreHorizontal,
  Loader2,
  Square,
  ChevronDown,
  Trash2,
  BookOpen,
  MessageCircleQuestion,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useWorkspaceContext } from "@/stores/workspace-context";
import { useProjectFeatureTree, useProjectRoadmap } from "@/hooks/use-project-data";
import { useConversation } from "@/hooks/use-conversation";
import { ArtifactCard } from "@/components/ai/artifact-card";
import { FollowUpCard } from "@/components/ai/follow-up-card";
import { localChatStore } from "@/lib/chat-persistence";
import { sanitizeUrl } from "@/lib/sanitize-url";
import type { Artifact, FeatureNode, RoadmapArtifact, RoadmapItem } from "@/lib/artifact-types";
import { artifactToSyncInput } from "@/lib/transforms/roadmap";
import { generateId } from "@/lib/roadmap-utils";

type AiPanelProps = {
  projectId: string;
};

const MODEL_OPTIONS = [
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini" },
  { id: "o3-mini", label: "o3 Mini" },
] as const;

const WELCOME_MESSAGE = "Hey! I'm Hannibal, your AI product co-pilot. Describe a problem you're trying to solve, and I'll help you research it, plan it, and build it.\n\nTry something like:\n- \"I want to build a fitness tracking app\"\n- \"Help me analyze the competitor landscape for task management tools\"\n- \"Generate user personas for an e-commerce platform\"";

export function AiPanel({ projectId }: AiPanelProps) {
  const activeView = useWorkspaceContext((s) => s.activeView);
  const selectedEntity = useWorkspaceContext((s) => s.selectedEntity);
  const highlightedText = useWorkspaceContext((s) => s.highlightedText);
  const toggleAiPanel = useWorkspaceContext((s) => s.toggleAiPanel);
  const focusAiInput = useWorkspaceContext((s) => s.focusAiInput);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isAtBottom = useRef(true);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  useEffect(() => {
    if (focusAiInput > 0) {
      // Small delay to ensure panel is rendered after opening
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [focusAiInput]);

  const welcomeMessages = useMemo(() => [
    {
      id: "welcome",
      role: "assistant" as const,
      content: WELCOME_MESSAGE,
      parts: [{ type: "text" as const, text: WELCOME_MESSAGE }],
    },
  ], []);

  const bodyRef = useRef({ activeView, selectedEntity, highlightedText, model });
  bodyRef.current = { activeView, selectedEntity, highlightedText, model };

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          ...bodyRef.current,
          projectId,
          projectName: "Demo Project",
        }),
      }),
    [],
  );

  const { messages, setMessages, sendMessage, status, stop, addToolOutput } = useChat({
    transport,
  });

  const { initialize, syncMessages: syncToDb, clearConversation } = useConversation(projectId);

  const didRestore = useRef(false);
  useEffect(() => {
    if (didRestore.current) return;
    didRestore.current = true;

    initialize().then((dbMessages) => {
      // Deduplicate by id (safety net against stale data)
      const dedup = (msgs: typeof dbMessages) => {
        const seen = new Set<string>();
        return msgs.filter((m) => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
      };

      if (dbMessages.length > 0) {
        const clean = dedup(dbMessages);
        // DB has messages — use them and warm localStorage cache
        setMessages(clean as Parameters<typeof setMessages>[0]);
        localChatStore.save(projectId, clean as Parameters<typeof localChatStore.save>[1]);
      } else {
        // Fall back to localStorage, then welcome
        const stored = dedup(localChatStore.load(projectId));
        // If localStorage is corrupted (too many messages), discard it
        if (stored.length > 200) {
          localChatStore.clear(projectId);
          setMessages(welcomeMessages as Parameters<typeof setMessages>[0]);
        } else {
          const toSet = stored.length > 0 ? stored : welcomeMessages;
          setMessages(toSet as Parameters<typeof setMessages>[0]);
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- initialize/setMessages are stable refs, only run once on mount
  }, [projectId]);

  const isStreaming = status === "streaming";
  const isLoading = status === "submitted";

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 80;
    isAtBottom.current = nearBottom;
    setShowScrollBtn(!nearBottom);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    isAtBottom.current = true;
    setShowScrollBtn(false);
  }, []);

  useEffect(() => {
    if (isAtBottom.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (status === "ready" && messages.length > 1) {
      localChatStore.save(projectId, messages as Parameters<typeof localChatStore.save>[1]);
      syncToDb(messages as Parameters<typeof syncToDb>[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- syncToDb is a stable ref
  }, [status, messages, projectId]);

  const submit = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    isAtBottom.current = true;
    setShowScrollBtn(false);
    sendMessage({ text });
  }, [input, sendMessage]);

  const handleFollowUpAnswer = useCallback(
    async (toolCallId: string, answer: string) => {
      await addToolOutput({
        tool: "askFollowUp",
        toolCallId,
        output: { answer },
      });
    },
    [addToolOutput],
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex h-full flex-col bg-muted/30 border-l border-border/40 w-full min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-base font-semibold">Hannibal AI</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-xs text-destructive focus:text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Clear chat
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will erase all AI conversation history for this project. The AI will lose context of previous discussions, though it can still read your saved plans, PRDs, features, and other artifacts.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    localChatStore.clear(projectId);
                    clearConversation();
                    setMessages(welcomeMessages as Parameters<typeof setMessages>[0]);
                  }}
                >
                  Clear
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleAiPanel}
          >
            <PanelRightClose className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="relative flex-1 min-h-0">
        <div className="h-full overflow-y-auto" ref={scrollRef} onScroll={handleScroll}>
          <div className="space-y-4 pb-4 px-4 py-3 w-full min-w-0">
            {messages.filter((message, index, arr) =>
              arr.findIndex((m) => m.id === message.id) === index
            ).map((message) => (
              <div key={message.id} className="space-y-1">
                {message.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-sm text-primary-foreground">
                      {getUserText(message)}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {message.parts?.map((part, i) => {
                      if (part.type === "text") {
                        return (
                          <div
                            key={i}
                            className="text-sm text-foreground leading-relaxed prose prose-invert prose-sm !max-w-none w-full break-words [overflow-wrap:anywhere] [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_code]:text-xs"
                          >
                            <MessageMarkdown content={part.text} />
                          </div>
                        );
                      }
                      const tool = extractToolInfo(part);
                      if (tool) {
                        return renderToolPart(tool, i, projectId, handleFollowUpAnswer);
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Thinking...
              </div>
            )}
          </div>
        </div>

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button
            type="button"
            onClick={() => scrollToBottom()}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center h-7 w-7 rounded-full bg-muted/90 border border-border/50 shadow-md backdrop-blur-sm transition-opacity hover:bg-muted"
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Input */}
      <Separator />
      <div className="p-3 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder="Ask about your product..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="min-h-[40px] max-h-[120px] resize-none pr-10 text-sm bg-muted/50 border-0 focus-visible:ring-1"
            />
            {isStreaming ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute bottom-1 right-1 h-7 w-7"
                onClick={stop}
              >
                <Square className="h-3.5 w-3.5 text-destructive" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute bottom-1 right-1 h-7 w-7"
                disabled={!input.trim()}
              >
                <Send
                  className={cn(
                    "h-4 w-4",
                    input.trim()
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                />
              </Button>
            )}
          </div>
        </form>
        <div className="mt-1.5 flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-1 py-0.5 rounded"
              >
                {MODEL_OPTIONS.find((m) => m.id === model)?.label ?? "GPT-4o"}
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[140px]">
              {MODEL_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.id}
                  onClick={() => setModel(opt.id)}
                  className={cn("text-xs", model === opt.id && "font-semibold")}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

type ToolInfo = {
  toolName: string;
  toolCallId: string;
  state: string;
  input: Record<string, unknown> | undefined;
  output: Record<string, unknown> | undefined;
};

const ARTIFACT_TOOL_LABELS: Record<string, string> = {
  generatePlan: "Generating plan",
  generatePRD: "Generating PRD",
  generatePersona: "Creating persona",
  generateFeatureTree: "Building feature tree",
  generateCompetitor: "Analyzing competitor",
  suggestPriorities: "Scoring features",
  refineFeatureDescription: "Refining description",
  generateRoadmap: "Building roadmap",
  updateRoadmap: "Updating roadmap",
};

function extractToolInfo(part: unknown): ToolInfo | null {
  const p = part as Record<string, unknown>;
  const type = p.type as string;
  if (!type) return null;

  // AI SDK v6 static tools: type = "tool-{name}"
  if (type.startsWith("tool-")) {
    return {
      toolName: type.slice(5),
      toolCallId: (p.toolCallId as string) ?? "",
      state: (p.state as string) ?? "call",
      input: p.input as Record<string, unknown> | undefined,
      output: p.output as Record<string, unknown> | undefined,
    };
  }

  // AI SDK v6 dynamic tools (client doesn't define tool schemas)
  if (type === "dynamic-tool") {
    return {
      toolName: (p.toolName as string) ?? "",
      toolCallId: (p.toolCallId as string) ?? "",
      state: (p.state as string) ?? "call",
      input: p.input as Record<string, unknown> | undefined,
      output: p.output as Record<string, unknown> | undefined,
    };
  }

  return null;
}

function renderToolPart(
  tool: ToolInfo,
  key: number,
  projectId: string,
  onFollowUpAnswer?: (toolCallId: string, answer: string) => void,
) {
  const isComplete = tool.state === "output-available";

  if (tool.toolName === "askFollowUp") {
    const question = (tool.input?.question as string) ?? "";
    const options =
      (tool.input?.options as Array<{ label: string; description?: string }>) ?? [];

    if (isComplete) {
      const answer = (tool.output?.answer as string) ?? "";
      return (
        <FollowUpCard
          key={key}
          question={question}
          options={options}
          disabled
          selectedAnswer={answer}
          onSelect={() => {}}
        />
      );
    }

    // Input still streaming — show progress
    if (tool.state !== "call" || !question || options.length === 0) {
      return (
        <ToolProgressCard
          key={key}
          icon={MessageCircleQuestion}
          label="Thinking"
        />
      );
    }

    // Interactive state — user hasn't answered yet
    return (
      <FollowUpCard
        key={key}
        question={question}
        options={options}
        onSelect={(answer) => onFollowUpAnswer?.(tool.toolCallId, answer)}
      />
    );
  }

  if (tool.toolName === "webSearch") {
    const query = (tool.input?.query as string) ?? "";
    if (isComplete) {
      return (
        <div
          key={key}
          className="flex items-center gap-1.5 text-xs text-muted-foreground py-1"
        >
          <Globe className="h-3 w-3" />
          Searched: &ldquo;{query}&rdquo;
        </div>
      );
    }
    return (
      <ToolProgressCard
        key={key}
        icon={Globe}
        label="Researching"
        detail={query ? `"${query}"` : undefined}
      />
    );
  }

  if (tool.toolName === "readArtifact") {
    const artifactId = (tool.input?.artifactId as string) ?? "";
    if (isComplete) {
      const result = tool.output as { content?: string; error?: string };
      // Extract artifact label from the serialized content (e.g. ### [Plan] "Title")
      const match = result.content?.match(/\[(\w[\w ]*)\]\s*"([^"]+)"/);
      const label = match ? `${match[1]}: ${match[2]}` : artifactId;
      return (
        <div
          key={key}
          className="flex items-center gap-1.5 text-xs text-muted-foreground py-1"
        >
          <BookOpen className="h-3 w-3" />
          Read: {label}
        </div>
      );
    }
    return (
      <ToolProgressCard
        key={key}
        icon={BookOpen}
        label="Reading artifact"
        detail={artifactId || undefined}
      />
    );
  }

  if (tool.toolName === "readAllArtifacts") {
    if (isComplete) {
      const result = tool.output as { count?: number };
      return (
        <div
          key={key}
          className="flex items-center gap-1.5 text-xs text-muted-foreground py-1"
        >
          <BookOpen className="h-3 w-3" />
          Read all artifacts ({result.count ?? "?"})
        </div>
      );
    }
    return (
      <ToolProgressCard
        key={key}
        icon={BookOpen}
        label="Reading all artifacts"
      />
    );
  }

  if (tool.toolName === "refineFeatureDescription") {
    if (isComplete && tool.output) {
      const result = tool.output as {
        refinedDescription?: {
          featureTitle: string;
          parentPath: string[];
          description: string;
        };
      };
      if (result.refinedDescription) {
        return (
          <RefinedDescriptionCard
            key={key}
            data={result.refinedDescription}
            projectId={projectId}
          />
        );
      }
    }
    return (
      <ToolProgressCard
        key={key}
        icon={Sparkles}
        label="Refining description"
      />
    );
  }

  if (tool.toolName === "suggestPriorities") {
    if (isComplete && tool.output) {
      const result = tool.output as {
        priorityScores?: {
          featureTitle: string;
          parentPath: string[];
          reach: number;
          impact: number;
          confidence: number;
          effort: number;
          rationale: string;
        }[];
      };
      if (result.priorityScores) {
        return (
          <PriorityScoresCard
            key={key}
            scores={result.priorityScores}
            projectId={projectId}
          />
        );
      }
    }
    return (
      <ToolProgressCard
        key={key}
        icon={Sparkles}
        label="Scoring features"
      />
    );
  }

  if (tool.toolName === "updateRoadmap") {
    if (isComplete && tool.output) {
      const result = tool.output as {
        roadmapOperations?: {
          action: string;
          item: Partial<RoadmapItem> & { title?: string; id?: string };
        }[];
      };
      if (result.roadmapOperations) {
        return (
          <RoadmapOperationsCard
            key={key}
            operations={result.roadmapOperations}
            projectId={projectId}
          />
        );
      }
    }
    return (
      <ToolProgressCard
        key={key}
        icon={Sparkles}
        label="Updating roadmap"
      />
    );
  }

  if (tool.toolName in ARTIFACT_TOOL_LABELS) {
    if (isComplete && tool.output) {
      const result = tool.output as { artifact?: Artifact };
      if (result.artifact) {
        return (
          <div key={key} className="py-1">
            <ArtifactCard artifact={result.artifact} projectId={projectId} />
          </div>
        );
      }
    }
    return (
      <ToolProgressCard
        key={key}
        icon={Sparkles}
        label={ARTIFACT_TOOL_LABELS[tool.toolName]}
      />
    );
  }

  return null;
}

function ToolProgressCard({
  icon: Icon,
  label,
  detail,
}: {
  icon: React.ElementType;
  label: string;
  detail?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-muted/40 px-3 py-2.5 my-1">
      <div className="relative flex items-center justify-center">
        <span className="absolute h-6 w-6 rounded-full bg-primary/10 animate-ping" />
        <Icon className="h-4 w-4 text-primary relative z-10" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium flex items-center gap-1.5">
          {label}
          <span className="inline-flex gap-0.5">
            <span className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
            <span className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
            <span className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
          </span>
        </div>
        {detail && (
          <p className="text-[11px] text-muted-foreground truncate">{detail}</p>
        )}
      </div>
    </div>
  );
}

function getUserText(message: { content?: string; parts?: { type: string; text?: string }[] }): string {
  const fromParts = message.parts
    ?.filter((p) => p.type === "text" && p.text)
    .map((p) => p.text)
    .join("");
  return fromParts || message.content || "";
}

function MessageMarkdown({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const lines = part.slice(3, -3).split("\n");
          const lang = lines[0]?.trim();
          const code = lang ? lines.slice(1).join("\n") : lines.join("\n");
          return (
            <pre key={i} className="bg-muted p-3 rounded-lg overflow-x-auto">
              <code className="text-xs">{code}</code>
            </pre>
          );
        }

        return part.split("\n").map((line, j) => {
          const key = `${i}-${j}`;

          if (line.startsWith("#### "))
            return (
              <h4 key={key} className="font-semibold text-xs mt-2 mb-1">
                {formatInline(line.slice(5))}
              </h4>
            );
          if (line.startsWith("### "))
            return (
              <h3 key={key} className="font-semibold mt-3 mb-1">
                {formatInline(line.slice(4))}
              </h3>
            );
          if (line.startsWith("## "))
            return (
              <h2 key={key} className="font-semibold mt-3 mb-1">
                {formatInline(line.slice(3))}
              </h2>
            );
          if (line.startsWith("# "))
            return (
              <h1 key={key} className="font-bold mt-3 mb-1">
                {formatInline(line.slice(2))}
              </h1>
            );
          if (line.match(/^[-*]\s/))
            return (
              <li key={key} className="ml-4 list-disc">
                {formatInline(line.slice(2))}
              </li>
            );
          if (line.match(/^\d+\.\s/))
            return (
              <li key={key} className="ml-4 list-decimal">
                {formatInline(line.replace(/^\d+\.\s/, ""))}
              </li>
            );
          if (line.trim() === "") return <br key={key} />;

          return (
            <p key={key} className="mb-1">
              {formatInline(line)}
            </p>
          );
        });
      })}
    </>
  );
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code
          key={i}
          className="bg-muted px-1 py-0.5 rounded text-xs font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
    if (linkMatch) {
      const safeHref = sanitizeUrl(linkMatch[2]);
      if (safeHref)
        return (
          <a
            key={i}
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            {linkMatch[1]}
          </a>
        );
      return <span key={i}>{linkMatch[1]}</span>;
    }
    return part;
  });
}

type PriorityScore = {
  featureTitle: string;
  parentPath: string[];
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  rationale: string;
};

function applyScoresToTree(
  children: FeatureNode[],
  scores: PriorityScore[],
  parentTitles: string[] = [],
): FeatureNode[] {
  return children.map((node) => {
    const match = scores.find(
      (s) =>
        s.featureTitle === node.title &&
        JSON.stringify(s.parentPath) === JSON.stringify(parentTitles),
    );
    const updated = match
      ? {
          ...node,
          reach: match.reach,
          impact: match.impact,
          confidence: match.confidence,
          effort: match.effort,
        }
      : node;
    if (updated.children?.length) {
      return {
        ...updated,
        children: applyScoresToTree(updated.children, scores, [
          ...parentTitles,
          node.title,
        ]),
      };
    }
    return updated;
  });
}

function applyDescriptionToTree(
  children: FeatureNode[],
  featureTitle: string,
  parentPath: string[],
  description: string,
  currentPath: string[] = [],
  applied = { done: false },
): FeatureNode[] {
  return children.map((node) => {
    const pathMatch =
      JSON.stringify(currentPath) === JSON.stringify(parentPath);
    const titleMatch = node.title === featureTitle;
    const isExactMatch = titleMatch && pathMatch;
    const updated =
      isExactMatch && !applied.done
        ? ((applied.done = true), { ...node, description })
        : node;
    if (updated.children?.length) {
      return {
        ...updated,
        children: applyDescriptionToTree(
          updated.children,
          featureTitle,
          parentPath,
          description,
          [...currentPath, node.title],
          applied,
        ),
      };
    }
    return updated;
  });
}

function applyDescriptionFuzzy(
  children: FeatureNode[],
  featureTitle: string,
  description: string,
): FeatureNode[] {
  let found = false;
  function walk(nodes: FeatureNode[]): FeatureNode[] {
    return nodes.map((node) => {
      if (!found && node.title === featureTitle) {
        found = true;
        return {
          ...node,
          description,
          children: node.children ? walk(node.children) : undefined,
        };
      }
      return node.children?.length
        ? { ...node, children: walk(node.children) }
        : node;
    });
  }
  return walk(children);
}

function RefinedDescriptionCard({
  data,
  projectId,
}: {
  data: { featureTitle: string; parentPath: string[]; description: string };
  projectId: string;
}) {
  const [applied, setApplied] = useState(false);
  const { tree, syncTree } = useProjectFeatureTree(projectId);
  const setActiveView = useWorkspaceContext((s) => s.setActiveView);

  const handleApply = async () => {
    if (!tree || applied) return;
    // Normalize parentPath — the AI may include rootFeature as the first element
    const normalizedPath =
      data.parentPath.length > 0 && data.parentPath[0] === tree.rootFeature
        ? data.parentPath.slice(1)
        : data.parentPath;
    const tracker = { done: false };
    let newChildren = applyDescriptionToTree(
      tree.children,
      data.featureTitle,
      normalizedPath,
      data.description,
      [],
      tracker,
    );
    if (!tracker.done) {
      newChildren = applyDescriptionFuzzy(
        tree.children,
        data.featureTitle,
        data.description,
      );
    }
    await syncTree({ rootFeature: tree.rootFeature, children: newChildren });
    setApplied(true);
  };

  const breadcrumb =
    data.parentPath.length > 0
      ? `${data.parentPath.join(" › ")} › `
      : "";

  return (
    <div className="rounded-lg border border-border/50 bg-muted/40 p-3 my-1 space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-medium truncate">
          Description for{" "}
          <span className="text-muted-foreground">{breadcrumb}</span>
          {data.featureTitle}
        </span>
      </div>
      <div className="max-h-[200px] overflow-auto rounded border border-border/30 bg-background/50 p-2 text-xs whitespace-pre-wrap font-mono">
        {data.description}
      </div>
      <Button
        size="sm"
        variant={applied ? "outline" : "secondary"}
        className="h-7 text-xs w-full justify-center"
        onClick={() => {
          handleApply();
          setActiveView("features");
        }}
        disabled={!tree}
      >
        {applied ? "Applied — View Features" : "Apply Description"}
      </Button>
    </div>
  );
}

function PriorityScoresCard({ scores, projectId }: { scores: PriorityScore[]; projectId: string }) {
  const [applied, setApplied] = useState(false);
  const { tree, syncTree } = useProjectFeatureTree(projectId);
  const setActiveView = useWorkspaceContext((s) => s.setActiveView);

  const handleApply = async () => {
    if (!tree || applied) return;
    // Normalize parentPaths — the AI may include rootFeature as the
    // first element, but applyScoresToTree builds paths starting from
    // tree.children (which excludes rootFeature).
    const normalizedScores = scores.map((s) => ({
      ...s,
      parentPath:
        s.parentPath.length > 0 && s.parentPath[0] === tree.rootFeature
          ? s.parentPath.slice(1)
          : s.parentPath,
    }));
    const newChildren = applyScoresToTree(tree.children, normalizedScores);
    await syncTree({ rootFeature: tree.rootFeature, children: newChildren });
    setApplied(true);
  };

  return (
    <div className="rounded-lg border border-border/50 bg-muted/40 p-3 my-1 space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-medium">
          RICE Scores for {scores.length} feature{scores.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="max-h-[200px] overflow-auto text-xs space-y-1.5">
        {scores.slice(0, 8).map((s, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <span className="truncate text-muted-foreground">
              {s.parentPath.length > 0 && (
                <span className="opacity-60">{s.parentPath.join(" › ")} › </span>
              )}
              <span className="text-foreground">{s.featureTitle}</span>
            </span>
            <span className="shrink-0 tabular-nums font-medium">
              {((s.reach * s.impact * (s.confidence / 100)) / s.effort).toFixed(1)}
            </span>
          </div>
        ))}
        {scores.length > 8 && (
          <div className="text-muted-foreground">+{scores.length - 8} more</div>
        )}
      </div>
      <Button
        size="sm"
        variant={applied ? "outline" : "secondary"}
        className="h-7 text-xs w-full justify-center"
        onClick={() => {
          handleApply();
          setActiveView("priorities");
        }}
        disabled={!tree}
      >
        {applied ? "View in Priorities" : "Apply Scores to Feature Tree"}
      </Button>
    </div>
  );
}

type RoadmapOp = {
  action: string;
  item: Partial<RoadmapItem> & { title?: string; id?: string };
};

function RoadmapOperationsCard({ operations, projectId }: { operations: RoadmapOp[]; projectId: string }) {
  const [applied, setApplied] = useState(false);
  const { roadmap, syncRoadmap } = useProjectRoadmap(projectId);
  const setActiveView = useWorkspaceContext((s) => s.setActiveView);

  const handleApply = async () => {
    if (!roadmap || applied) return;
    let newItems = [...roadmap.items];

    for (const op of operations) {
      if (op.action === "add" && op.item.title) {
        newItems.push({
          id: op.item.id || generateId(),
          title: op.item.title,
          description: op.item.description,
          laneId: op.item.laneId || roadmap.lanes[0]?.id || "",
          startDate: op.item.startDate || new Date().toISOString().slice(0, 10),
          endDate: op.item.endDate || new Date().toISOString().slice(0, 10),
          status: (op.item.status as RoadmapItem["status"]) || "not_started",
          type: (op.item.type as RoadmapItem["type"]) || "feature",
        });
      } else if (op.action === "update") {
        const idx = newItems.findIndex(
          (it) => it.id === op.item.id || it.title === op.item.title,
        );
        if (idx >= 0) {
          newItems[idx] = { ...newItems[idx], ...op.item, id: newItems[idx].id } as RoadmapItem;
        }
      } else if (op.action === "remove") {
        newItems = newItems.filter(
          (it) => it.id !== op.item.id && it.title !== op.item.title,
        );
      }
    }

    const merged: RoadmapArtifact & { id: string } = { ...roadmap, items: newItems };
    const input = artifactToSyncInput(merged);
    await syncRoadmap({ roadmapId: roadmap.id, ...input });
    setApplied(true);
  };

  const addCount = operations.filter((o) => o.action === "add").length;
  const updateCount = operations.filter((o) => o.action === "update").length;
  const removeCount = operations.filter((o) => o.action === "remove").length;
  const parts: string[] = [];
  if (addCount) parts.push(`${addCount} add`);
  if (updateCount) parts.push(`${updateCount} update`);
  if (removeCount) parts.push(`${removeCount} remove`);

  return (
    <div className="rounded-lg border border-border/50 bg-muted/40 p-3 my-1 space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-medium">
          Roadmap Changes ({parts.join(", ")})
        </span>
      </div>
      <div className="max-h-[200px] overflow-auto text-xs space-y-1.5">
        {operations.slice(0, 8).map((op, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={cn(
              "shrink-0 text-[10px] font-medium uppercase px-1 rounded",
              op.action === "add" && "text-green-400 bg-green-400/10",
              op.action === "update" && "text-blue-400 bg-blue-400/10",
              op.action === "remove" && "text-red-400 bg-red-400/10",
            )}>
              {op.action}
            </span>
            <span className="truncate text-foreground">
              {op.item.title || op.item.id}
            </span>
          </div>
        ))}
        {operations.length > 8 && (
          <div className="text-muted-foreground">+{operations.length - 8} more</div>
        )}
      </div>
      <Button
        size="sm"
        variant={applied ? "outline" : "secondary"}
        className="h-7 text-xs w-full justify-center"
        onClick={() => {
          handleApply();
          setActiveView("roadmap");
        }}
        disabled={!roadmap}
      >
        {applied ? "View Roadmap" : "Apply Changes"}
      </Button>
    </div>
  );
}
