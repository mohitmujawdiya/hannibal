import { z } from "zod/v3";
import { TRPCError } from "@trpc/server";
import { PRDStatus } from "@/generated/prisma/client";
import { publicProcedure, router } from "../trpc";

export const prdRouter = router({
  list: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.pRD.findMany({
        where: { projectId: input.projectId, deletedAt: null },
        orderBy: { updatedAt: "desc" },
      });
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const prd = await ctx.db.pRD.findUnique({
        where: { id: input.id },
      });
      if (!prd || prd.deletedAt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PRD not found" });
      }
      return prd;
    }),

  create: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        title: z.string().min(1).max(500),
        content: z.string().max(100_000).default(""),
        description: z.string().max(1000).optional(),
        owner: z.string().max(200).optional(),
        planId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.pRD.create({
        data: {
          title: input.title,
          content: input.content || `# ${input.title}\n\n`,
          description: input.description,
          owner: input.owner,
          projectId: input.projectId,
          planId: input.planId,
        },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(500).optional(),
        content: z.string().max(100_000).optional(),
        description: z.string().max(1000).optional(),
        owner: z.string().max(200).optional(),
        status: z.nativeEnum(PRDStatus).optional(),
        planId: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.pRD.update({ where: { id }, data });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.pRD.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });
    }),

  restore: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.pRD.update({
        where: { id: input.id },
        data: { deletedAt: null },
      });
    }),

  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(PRDStatus),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.pRD.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  linkToPlan: publicProcedure
    .input(
      z.object({
        id: z.string(),
        planId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.pRD.update({
        where: { id: input.id },
        data: { planId: input.planId },
      });
    }),
});
