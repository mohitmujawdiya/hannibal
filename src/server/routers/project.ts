import { z } from "zod/v3";
import { publicProcedure, router } from "../trpc";

export const projectRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.project.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
    });
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.project.findUnique({
        where: { id: input.id },
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.project.create({
        data: {
          ...input,
          userId: ctx.userId ?? "demo-user",
        },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.project.update({ where: { id }, data });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.project.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });
    }),
});
