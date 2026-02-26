import { z } from "zod/v3";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../trpc";
import { syncCompetitorContent } from "../services/artifact";

export const competitorRouter = router({
  list: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.competitor.findMany({
        where: { projectId: input.projectId, deletedAt: null },
        orderBy: { updatedAt: "desc" },
      });
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const competitor = await ctx.db.competitor.findUnique({
        where: { id: input.id },
      });
      if (!competitor || competitor.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Competitor not found",
        });
      }
      return competitor;
    }),

  create: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string().min(1).max(200),
        title: z.string().max(200).optional(),
        url: z.string().optional(),
        logo: z.string().optional(),
        positioning: z.string().max(1000).optional(),
        pricing: z.string().max(200).optional(),
        strengths: z.array(z.string().max(300)).optional(),
        weaknesses: z.array(z.string().max(300)).optional(),
        featureGaps: z.array(z.string().max(300)).optional(),
        marketShare: z.string().max(100).optional(),
        notes: z.string().max(5000).optional(),
        content: z.string().max(50_000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, ...fields } = input;

      // If no content provided, generate from structured fields
      if (!fields.content) {
        fields.content = syncCompetitorContent({
          name: fields.name,
          url: fields.url,
          positioning: fields.positioning,
          pricing: fields.pricing,
          strengths: fields.strengths,
          weaknesses: fields.weaknesses,
          featureGaps: fields.featureGaps,
          notes: fields.notes,
        });
      }

      return ctx.db.competitor.create({
        data: { ...fields, projectId },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200).optional(),
        title: z.string().max(200).nullable().optional(),
        url: z.string().nullable().optional(),
        logo: z.string().nullable().optional(),
        positioning: z.string().max(1000).nullable().optional(),
        pricing: z.string().max(200).nullable().optional(),
        strengths: z.array(z.string().max(300)).optional(),
        weaknesses: z.array(z.string().max(300)).optional(),
        featureGaps: z.array(z.string().max(300)).optional(),
        marketShare: z.string().max(100).nullable().optional(),
        notes: z.string().max(5000).nullable().optional(),
        content: z.string().max(50_000).nullable().optional(),
        lastResearchedAt: z.date().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.competitor.update({ where: { id }, data });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.competitor.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });
    }),

  restore: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.competitor.update({
        where: { id: input.id },
        data: { deletedAt: null },
      });
    }),

  markResearched: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.competitor.update({
        where: { id: input.id },
        data: { lastResearchedAt: new Date() },
      });
    }),
});
