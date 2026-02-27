import { Skeleton } from "@/components/ui/skeleton";

export function WorkspaceSkeleton() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar skeleton */}
      <div className="flex h-full w-[220px] shrink-0 flex-col bg-sidebar border-r border-border/50">
        {/* Logo */}
        <div className="flex items-center h-12 px-3 border-b border-border">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-4 w-20 ml-2" />
        </div>

        {/* Project switcher */}
        <div className="px-3 py-3">
          <Skeleton className="h-8 w-full rounded-md" />
        </div>

        {/* Nav items */}
        <div className="flex-1 flex flex-col gap-1 px-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-8 w-full rounded-md"
              style={{ opacity: 1 - i * 0.07 }}
            />
          ))}
        </div>

        {/* Bottom user area */}
        <div className="px-3 py-3 border-t border-border">
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex flex-1 min-w-0 flex-col">
        {/* Toolbar */}
        <div className="flex items-center h-12 px-6 border-b border-border">
          <Skeleton className="h-5 w-32" />
        </div>

        {/* Content area */}
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}
