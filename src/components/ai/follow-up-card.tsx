"use client";

import { useState } from "react";
import { MessageCircleQuestion, Check, ChevronRight, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FollowUpOption = {
  label: string;
  description?: string;
};

type FollowUpCardProps = {
  question: string;
  options: FollowUpOption[];
  onSelect: (answer: string) => void;
  disabled?: boolean;
  selectedAnswer?: string;
};

export function FollowUpCard({
  question,
  options,
  onSelect,
  disabled = false,
  selectedAnswer,
}: FollowUpCardProps) {
  const [showOther, setShowOther] = useState(false);
  const [otherText, setOtherText] = useState("");

  const handleOtherSubmit = () => {
    const text = otherText.trim();
    if (!text) return;
    onSelect(text);
  };

  return (
    <div className="rounded-lg border border-border/50 bg-muted/40 p-3 my-1 space-y-2.5">
      <div className="flex items-start gap-2">
        <MessageCircleQuestion className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <span className="text-sm font-medium leading-snug">{question}</span>
      </div>

      <div className="space-y-1.5">
        {options.map((option) => {
          const isSelected = selectedAnswer === option.label;
          return (
            <button
              key={option.label}
              type="button"
              className={cn(
                "w-full text-left rounded-md border px-3 py-2 text-sm transition-colors",
                disabled && isSelected
                  ? "border-primary/50 bg-primary/10 text-foreground"
                  : disabled
                    ? "border-transparent bg-transparent text-muted-foreground/50 cursor-default"
                    : "border-border/50 bg-background/50 hover:border-primary/40 hover:bg-primary/5 cursor-pointer",
              )}
              onClick={() => !disabled && onSelect(option.label)}
              disabled={disabled}
            >
              <div className="flex items-center gap-2">
                {disabled && isSelected && (
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                )}
                <div className="min-w-0">
                  <div
                    className={cn(
                      "font-medium",
                      disabled && isSelected && "text-primary",
                    )}
                  >
                    {option.label}
                  </div>
                  {option.description && (!disabled || isSelected) && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* "Other" custom response */}
      {!disabled && (
        <div>
          {!showOther ? (
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowOther(true)}
            >
              <ChevronRight className="h-3 w-3" />
              Other...
            </button>
          ) : (
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Type your response..."
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleOtherSubmit();
                  }
                }}
                className="flex-1 rounded-md border border-border/50 bg-background/50 px-2.5 py-1.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                onClick={handleOtherSubmit}
                disabled={!otherText.trim()}
              >
                <Send
                  className={cn(
                    "h-3.5 w-3.5",
                    otherText.trim()
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Show custom answer for disabled state with non-option answers */}
      {disabled &&
        selectedAnswer &&
        !options.some((o) => o.label === selectedAnswer) && (
          <div className="flex items-center gap-2 px-3 py-2 text-sm">
            <Check className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-primary font-medium">{selectedAnswer}</span>
          </div>
        )}
    </div>
  );
}
