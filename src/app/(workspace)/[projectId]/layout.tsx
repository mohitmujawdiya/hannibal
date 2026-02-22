import { WorkspaceShell } from "@/components/workspace/workspace-shell";

type WorkspaceLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
};

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { projectId } = await params;

  return <WorkspaceShell projectId={projectId} />;
}
