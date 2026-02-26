"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Folder, ChevronDown, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProjectSwitcherProps = {
  projectId: string;
  collapsed?: boolean;
};

export function ProjectSwitcher({ projectId, collapsed }: ProjectSwitcherProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const utils = trpc.useUtils();
  const { data: projects } = trpc.project.list.useQuery();
  const createMutation = trpc.project.create.useMutation({
    onSuccess: (project) => {
      utils.project.list.invalidate();
      router.push(`/${project.id}`);
      setDialogOpen(false);
      setNewProjectName("");
    },
  });

  const currentProject = projects?.find((p) => p.id === projectId);

  const handleCreate = () => {
    const trimmed = newProjectName.trim();
    if (!trimmed) return;
    createMutation.mutate({ name: trimmed });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {collapsed ? (
            <button
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-colors"
              title={currentProject?.name ?? "Switch project"}
            >
              <Folder className="h-5 w-5" />
            </button>
          ) : (
            <button
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-sidebar-accent/50 transition-colors text-left"
            >
              <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate flex-1">
                {currentProject?.name ?? "Select project"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={collapsed ? "start" : "start"}
          side={collapsed ? "right" : "bottom"}
          className="w-56"
        >
          <DropdownMenuLabel>Projects</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {projects?.map((project) => (
            <DropdownMenuCheckboxItem
              key={project.id}
              checked={project.id === projectId}
              onSelect={() => {
                if (project.id !== projectId) {
                  router.push(`/${project.id}`);
                }
              }}
            >
              {project.name}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Fitness App"
                maxLength={200}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newProjectName.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
