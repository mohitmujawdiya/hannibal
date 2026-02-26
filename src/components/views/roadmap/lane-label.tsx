"use client";

import { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import type { RoadmapLane } from "@/lib/artifact-types";

type LaneLabelProps = {
  lane: RoadmapLane;
  itemCount: number;
  onRename: (name: string) => void;
  onDelete: () => void;
};

export function LaneLabel({ lane, itemCount, onRename, onDelete }: LaneLabelProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(lane.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== lane.name) onRename(trimmed);
    else setValue(lane.name);
    setEditing(false);
  };

  return (
    <div className="w-[220px] shrink-0 border-r border-b border-border/50 bg-muted/80 flex items-center group overflow-hidden sticky left-0 z-10">
      {/* Colored left indent */}
      <div className="self-stretch w-1.5 shrink-0" style={{ backgroundColor: lane.color }} />
      <div className="flex items-center justify-center gap-2.5 px-3 py-3 flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setValue(lane.name);
                setEditing(false);
              }
            }}
            className="flex-1 min-w-0 bg-transparent text-base font-semibold outline-none border-b border-primary"
          />
        ) : (
          <button
            type="button"
            className="flex-1 min-w-0 text-center text-base font-semibold truncate hover:text-primary transition-colors"
            onClick={() => setEditing(true)}
          >
            {lane.name}
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
