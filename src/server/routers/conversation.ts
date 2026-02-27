import { z } from "zod/v3";
import { TRPCError } from "@trpc/server";
import { MessageRole } from "@/generated/prisma/client";
import { protectedProcedure, router } from "../trpc";
import { assertProjectOwnership, assertResourceOwnership } from "../services/auth";

export const conversationRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertProjectOwnership(ctx.db, input.projectId, ctx.userId);
      return ctx.db.conversation.findMany({
        where: { projectId: input.projectId },
        orderBy: { updatedAt: "desc" },
        include: {
          _count: { select: { messages: true } },
        },
      });
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      await assertResourceOwnership(ctx.db, "conversation", input.id, ctx.userId);
      const conversation = await ctx.db.conversation.findUnique({
        where: { id: input.id },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
        },
      });
      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }
      return conversation;
    }),

  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string().cuid(),
        title: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertProjectOwnership(ctx.db, input.projectId, ctx.userId);
      return ctx.db.conversation.create({
        data: {
          title: input.title,
          projectId: input.projectId,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        title: z.string().min(1).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertResourceOwnership(ctx.db, "conversation", input.id, ctx.userId);
      return ctx.db.conversation.update({
        where: { id: input.id },
        data: { title: input.title },
      });
    }),

  addMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().cuid(),
        role: z.nativeEnum(MessageRole),
        content: z.string().max(200_000),
        metadata: z.record(z.string(), z.any()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertResourceOwnership(ctx.db, "conversation", input.conversationId, ctx.userId);
      // Update conversation's updatedAt timestamp
      await ctx.db.conversation.update({
        where: { id: input.conversationId },
        data: { updatedAt: new Date() },
      });

      return ctx.db.message.create({
        data: {
          role: input.role,
          content: input.content,
          metadata: input.metadata ?? undefined,
          conversationId: input.conversationId,
        },
      });
    }),

  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().cuid(),
        limit: z.number().int().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await assertResourceOwnership(ctx.db, "conversation", input.conversationId, ctx.userId);
      const messages = await ctx.db.message.findMany({
        where: { conversationId: input.conversationId },
        orderBy: { createdAt: "asc" },
        take: input.limit + 1,
        ...(input.cursor
          ? { cursor: { id: input.cursor }, skip: 1 }
          : {}),
      });

      let nextCursor: string | undefined;
      if (messages.length > input.limit) {
        const next = messages.pop();
        nextCursor = next?.id;
      }

      return { messages, nextCursor };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await assertResourceOwnership(ctx.db, "conversation", input.id, ctx.userId);
      await ctx.db.conversation.delete({ where: { id: input.id } });
      return { id: input.id };
    }),
});
