import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { auth } from "@clerk/nextjs/server";
import { appRouter } from "@/server/routers/_app";
import { createContext } from "@/server/trpc";
import { trpcLimiter, getRateLimitIdentifier, rateLimitResponse } from "@/lib/rate-limit";

async function handler(req: Request) {
  if (trpcLimiter) {
    const { userId } = await auth();
    const id = getRateLimitIdentifier(userId, req);
    const { success, reset } = await trpcLimiter.limit(id);
    if (!success) return rateLimitResponse(reset);
  }

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });
}

export { handler as GET, handler as POST };
