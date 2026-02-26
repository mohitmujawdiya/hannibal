import { z } from "zod/v3";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../trpc";
import { syncPersonaContent } from "../services/artifact";

export const personaRouter = router({
  list: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.persona.findMany({
        where: { projectId: input.projectId, deletedAt: null },
        orderBy: { updatedAt: "desc" },
      });
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const persona = await ctx.db.persona.findUnique({
        where: { id: input.id },
      });
      if (!persona || persona.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Persona not found",
        });
      }
      return persona;
    }),

  create: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string().min(1).max(200),
        title: z.string().max(200).optional(),
        avatar: z.string().optional(),
        demographics: z.string().max(500).optional(),
        techProficiency: z.string().max(100).optional(),
        quote: z.string().max(500).optional(),
        goals: z.array(z.string().max(300)).optional(),
        frustrations: z.array(z.string().max(300)).optional(),
        behaviors: z.array(z.string().max(300)).optional(),
        notes: z.string().max(5000).optional(),
        content: z.string().max(50_000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, ...fields } = input;

      // If no content provided, generate from structured fields
      if (!fields.content) {
        fields.content = syncPersonaContent({
          name: fields.name,
          demographics: fields.demographics,
          techProficiency: fields.techProficiency,
          quote: fields.quote,
          goals: fields.goals,
          frustrations: fields.frustrations,
          behaviors: fields.behaviors,
          notes: fields.notes,
        });
      }

      return ctx.db.persona.create({
        data: { ...fields, projectId },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200).optional(),
        title: z.string().max(200).nullable().optional(),
        avatar: z.string().nullable().optional(),
        demographics: z.string().max(500).nullable().optional(),
        techProficiency: z.string().max(100).nullable().optional(),
        quote: z.string().max(500).nullable().optional(),
        goals: z.array(z.string().max(300)).optional(),
        frustrations: z.array(z.string().max(300)).optional(),
        behaviors: z.array(z.string().max(300)).optional(),
        notes: z.string().max(5000).nullable().optional(),
        content: z.string().max(50_000).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.persona.update({ where: { id }, data });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.persona.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });
    }),

  restore: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.persona.update({
        where: { id: input.id },
        data: { deletedAt: null },
      });
    }),
});
