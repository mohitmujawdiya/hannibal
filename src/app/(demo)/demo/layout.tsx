import { db } from "@/lib/db";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

const DEMO_PROJECT_SLUG = process.env.DEMO_PROJECT_SLUG ?? "demo";

export default async function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let project: { id: string; slug: string; name: string; deletedAt: Date | null } | null = null;

  try {
    project = await db.project.findUnique({
      where: { slug: DEMO_PROJECT_SLUG },
      select: { id: true, slug: true, name: true, deletedAt: true },
    });
  } catch (err) {
    console.error("[Demo] DB query failed:", err);
  }

  if (!project || project.deletedAt) {
    console.error("[Demo] Project not found for slug:", DEMO_PROJECT_SLUG, "result:", project);
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Demo Not Available</h1>
          <p className="mt-2 text-muted-foreground">
            The demo project has not been set up yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <WorkspaceShell
      projectId={project.id}
      projectName={project.name}
      projectSlug="demo"
      isDemo
    />
  );
}
