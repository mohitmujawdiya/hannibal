import { z } from "zod/v3";
import { TRPCError } from "@trpc/server";
import { MessageRole } from "@/generated/prisma/client";
import { publicProcedure, router } from "../trpc";

export const conversationRouter = router({
  list: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.conversation.findMany({
        where: { projectId: input.projectId },
        orderBy: { updatedAt: "desc" },
        include: {
          _count: { select: { messages: true } },
        },
      });
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
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

  create: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        title: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.conversation.create({
        data: {
          title: input.title,
          projectId: input.projectId,
        },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.conversation.update({
        where: { id: input.id },
        data: { title: input.title },
      });
    }),

  addMessage: publicProcedure
    .input(
      z.object({
        conversationId: z.string(),
        role: z.nativeEnum(MessageRole),
        content: z.string().max(200_000),
        metadata: z.any().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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

  getMessages: publicProcedure
    .input(
      z.object({
        conversationId: z.string(),
        limit: z.number().int().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
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

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.conversation.delete({ where: { id: input.id } });
      return { id: input.id };
    }),
});
