"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import {
  PanelRightClose,
  Send,
  Globe,
  Sparkles,
  MoreHorizontal,
  Loader2,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useWorkspaceContext } from "@/stores/workspace-context";
import { ArtifactCard } from "@/components/ai/artifact-card";
import type { Artifact } from "@/lib/artifact-types";

type AiPanelProps = {
  projectId: string;
};

const WELCOME_MESSAGE = "Hey! I'm Hannibal, your AI product co-pilot. Describe a problem you're trying to solve, and I'll help you research it, plan it, and build it.\n\nTry something like:\n- \"I want to build a fitness tracking app\"\n- \"Help me analyze the competitor landscape for task management tools\"\n- \"Generate user personas for an e-commerce platform\"";

export function AiPanel({ projectId }: AiPanelProps) {
  const activeView = useWorkspaceContext((s) => s.activeView);
  const selectedEntity = useWorkspaceContext((s) => s.selectedEntity);
  const highlightedText = useWorkspaceContext((s) => s.highlightedText);
  const toggleAiPanel = useWorkspaceContext((s) => s.toggleAiPanel);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, stop } = useChat({
    api: "/api/chat",
    body: {
      activeView,
      selectedEntity,
      highlightedText,
      projectName: "Demo Project",
    },
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: WELCOME_MESSAGE,
        parts: [{ type: "text", text: WELCOME_MESSAGE }],
      },
    ],
  });

  const isStreaming = status === "streaming";
  const isLoading = status === "submitted";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const submit = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendMessage({ text });
  }, [input, sendMessage]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex h-full flex-col bg-muted/30 border-l border-border/40">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Hannibal AI</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {activeView}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={toggleAiPanel}
          >
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
        <div className="space-y-4 pb-4">
          {messages.map((message) => (
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
                          className="text-sm text-foreground leading-relaxed prose prose-invert prose-sm max-w-none [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-lg [&_code]:text-xs"
                        >
                          <MessageMarkdown content={part.text} />
                        </div>
                      );
                    }
                    if (part.type === "tool-invocation") {
                      const toolName = part.toolInvocation.toolName;
                      const state = part.toolInvocation.state;
                      if (toolName === "webSearch") {
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground py-1"
                          >
                            <Globe
                              className={cn(
                                "h-3 w-3",
                                state !== "result" && "animate-pulse"
                              )}
                            />
                            {state === "result"
                              ? `Searched: "${part.toolInvocation.args?.query}"`
                              : `Researching: "${part.toolInvocation.args?.query}"...`}
                          </div>
                        );
                      }
                      const artifactToolNames = [
                        "generatePlan",
                        "generatePRD",
                        "generatePersona",
                        "generateFeatureTree",
                        "generateCompetitor",
                      ];
                      if (
                        artifactToolNames.includes(toolName) &&
                        state === "result"
                      ) {
                        const result = part.toolInvocation.result as
                          | { artifact: Artifact }
                          | undefined;
                        if (result?.artifact) {
                          return (
                            <div key={i} className="py-1">
                              <ArtifactCard artifact={result.artifact} />
                            </div>
                          );
                        }
                      }
                      return null;
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
      </ScrollArea>

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
    if (linkMatch)
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2"
        >
          {linkMatch[1]}
        </a>
      );
    return part;
  });
}
