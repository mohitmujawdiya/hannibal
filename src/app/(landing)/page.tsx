import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { LandingPage } from "@/components/landing/landing-page";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    let project = await db.project.findFirst({
      where: { userId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });

    if (!project) {
      project = await db.project.create({
        data: { name: "My First Project", userId },
        select: { id: true },
      });
    }

    redirect(`/${project.id}`);
  }

  return <LandingPage />;
}
