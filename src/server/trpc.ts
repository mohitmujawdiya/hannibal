import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { db } from "@/lib/db";

export type Context = {
  db: typeof db;
  userId: string | null;
};

export function createContext(): Context {
  return {
    db,
    userId: null, // Will be populated by Clerk middleware later
  };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});
