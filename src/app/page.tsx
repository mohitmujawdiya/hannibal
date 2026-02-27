import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let project = await db.project.findFirst({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  if (!project) {
    project = await db.project.create({
      data: { name: "My First Project", userId: "demo-user" },
      select: { id: true },
    });
  }

  redirect(`/${project.id}`);
}
