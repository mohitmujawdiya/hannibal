"use client";

import * as React from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { cn } from "@/lib/utils";

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof Group>) {
  return (
    <Group
      className={cn("flex h-full w-full", className)}
      {...props}
    />
  );
}

function ResizablePanel({
  ...props
}: React.ComponentProps<typeof Panel>) {
  return <Panel {...props} />;
}

function ResizableHandle({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      className={cn(
        "relative bg-border/60 transition-colors",
        "data-[resize-handle-state=hover]:bg-primary/30",
        "data-[resize-handle-state=drag]:bg-primary/50",
        "data-[panel-group-direction=horizontal]:w-[3px]",
        "data-[panel-group-direction=vertical]:h-[3px]",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="z-10 flex h-6 w-[3px] flex-col items-center justify-center gap-[2px] rounded-full">
          <span className="h-[3px] w-[3px] rounded-full bg-muted-foreground/40" />
          <span className="h-[3px] w-[3px] rounded-full bg-muted-foreground/40" />
          <span className="h-[3px] w-[3px] rounded-full bg-muted-foreground/40" />
        </div>
      </div>
    </Separator>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
