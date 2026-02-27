import { z } from "zod/v3";
import { TRPCError } from "@trpc/server";
import { PRDStatus } from "@/generated/prisma/client";
import { protectedProcedure, router } from "../trpc";
import { assertProjectOwnership, assertResourceOwnership } from "../services/auth";

export const prdRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertProjectOwnership(ctx.db, input.projectId, ctx.userId);
      return ctx.db.pRD.findMany({
        where: { projectId: input.projectId, deletedAt: null },
        orderBy: { updatedAt: "desc" },
      });
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      await assertResourceOwnership(ctx.db, "prd", input.id, ctx.userId);
      const prd = await ctx.db.pRD.findUnique({
        where: { id: input.id },
      });
      if (!prd || prd.deletedAt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PRD not found" });
      }
      return prd;
    }),

  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string().cuid(),
        title: z.string().min(1).max(500),
        content: z.string().max(100_000).default(""),
        description: z.string().max(1000).optional(),
        owner: z.string().max(200).optional(),
        planId: z.string().cuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertProjectOwnership(ctx.db, input.projectId, ctx.userId);
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

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        title: z.string().min(1).max(500).optional(),
        content: z.string().max(100_000).optional(),
        description: z.string().max(1000).optional(),
        owner: z.string().max(200).optional(),
        status: z.nativeEnum(PRDStatus).optional(),
        planId: z.string().cuid().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertResourceOwnership(ctx.db, "prd", input.id, ctx.userId);
      const { id, ...data } = input;
      return ctx.db.pRD.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await assertResourceOwnership(ctx.db, "prd", input.id, ctx.userId);
      return ctx.db.pRD.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });
    }),

  restore: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await assertResourceOwnership(ctx.db, "prd", input.id, ctx.userId);
      return ctx.db.pRD.update({
        where: { id: input.id },
        data: { deletedAt: null },
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        status: z.nativeEnum(PRDStatus),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertResourceOwnership(ctx.db, "prd", input.id, ctx.userId);
      return ctx.db.pRD.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  linkToPlan: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        planId: z.string().cuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertResourceOwnership(ctx.db, "prd", input.id, ctx.userId);
      return ctx.db.pRD.update({
        where: { id: input.id },
        data: { planId: input.planId },
      });
    }),
});
