import { z } from "zod/v3";
import { TRPCError } from "@trpc/server";
import {
  RoadmapTimeScale,
  RoadmapItemStatus,
  RoadmapItemType,
  DependencyType,
} from "@/generated/prisma/client";
import { publicProcedure, router } from "../trpc";

export const roadmapRouter = router({
  // ─── Roadmap CRUD ───────────────────────────────────────────────────────

  list: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.roadmap.findMany({
        where: { projectId: input.projectId, deletedAt: null },
        orderBy: { updatedAt: "desc" },
        include: {
          lanes: { orderBy: { order: "asc" } },
          _count: { select: { items: true } },
        },
      });
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const roadmap = await ctx.db.roadmap.findUnique({
        where: { id: input.id },
        include: {
          lanes: { orderBy: { order: "asc" } },
          items: {
            orderBy: { order: "asc" },
            include: {
              lane: true,
              feature: { select: { id: true, title: true } },
              outgoing: true,
              incoming: true,
            },
          },
        },
      });
      if (!roadmap || roadmap.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Roadmap not found",
        });
      }
      return roadmap;
    }),

  create: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        title: z.string().min(1).max(500),
        description: z.string().max(2000).optional(),
        timeScale: z.nativeEnum(RoadmapTimeScale).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.roadmap.create({
        data: {
          title: input.title,
          description: input.description,
          timeScale: input.timeScale,
          projectId: input.projectId,
        },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(500).optional(),
        description: z.string().max(2000).optional(),
        timeScale: z.nativeEnum(RoadmapTimeScale).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.roadmap.update({ where: { id }, data });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.roadmap.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });
    }),

  // ─── Lane CRUD ──────────────────────────────────────────────────────────

  laneCreate: publicProcedure
    .input(
      z.object({
        roadmapId: z.string(),
        name: z.string().min(1).max(200),
        color: z.string().max(20).optional(),
        order: z.number().int().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.roadmapLane.create({
        data: {
          name: input.name,
          color: input.color,
          order: input.order ?? 0,
          roadmapId: input.roadmapId,
        },
      });
    }),

  laneUpdate: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200).optional(),
        color: z.string().max(20).optional(),
        order: z.number().int().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.roadmapLane.update({ where: { id }, data });
    }),

  laneDelete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.roadmapLane.delete({ where: { id: input.id } });
      return { id: input.id };
    }),

  lanesReorder: publicProcedure
    .input(
      z.object({
        roadmapId: z.string(),
        laneIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(
        input.laneIds.map((id, index) =>
          ctx.db.roadmapLane.update({
            where: { id },
            data: { order: index },
          }),
        ),
      );
    }),

  // ─── Item CRUD ──────────────────────────────────────────────────────────

  itemCreate: publicProcedure
    .input(
      z.object({
        roadmapId: z.string(),
        laneId: z.string().nullable().optional(),
        title: z.string().min(1).max(500),
        description: z.string().max(5000).optional(),
        type: z.nativeEnum(RoadmapItemType).optional(),
        status: z.nativeEnum(RoadmapItemStatus).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        priority: z.number().int().optional(),
        assignee: z.string().max(200).optional(),
        color: z.string().max(20).optional(),
        progress: z.number().int().min(0).max(100).optional(),
        order: z.number().int().min(0).optional(),
        featureId: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.roadmapItem.create({
        data: {
          title: input.title,
          description: input.description,
          type: input.type,
          status: input.status,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          priority: input.priority,
          assignee: input.assignee,
          color: input.color,
          progress: input.progress,
          order: input.order ?? 0,
          roadmapId: input.roadmapId,
          laneId: input.laneId,
          featureId: input.featureId,
        },
      });
    }),

  itemUpdate: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(500).optional(),
        description: z.string().max(5000).nullable().optional(),
        type: z.nativeEnum(RoadmapItemType).optional(),
        status: z.nativeEnum(RoadmapItemStatus).optional(),
        startDate: z.string().nullable().optional(),
        endDate: z.string().nullable().optional(),
        priority: z.number().int().nullable().optional(),
        assignee: z.string().max(200).nullable().optional(),
        color: z.string().max(20).nullable().optional(),
        progress: z.number().int().min(0).max(100).nullable().optional(),
        order: z.number().int().min(0).optional(),
        laneId: z.string().nullable().optional(),
        featureId: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, startDate, endDate, ...rest } = input;
      return ctx.db.roadmapItem.update({
        where: { id },
        data: {
          ...rest,
          ...(startDate !== undefined
            ? { startDate: startDate ? new Date(startDate) : null }
            : {}),
          ...(endDate !== undefined
            ? { endDate: endDate ? new Date(endDate) : null }
            : {}),
        },
      });
    }),

  itemDelete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.roadmapItem.delete({ where: { id: input.id } });
      return { id: input.id };
    }),

  itemMove: publicProcedure
    .input(
      z.object({
        id: z.string(),
        laneId: z.string().nullable().optional(),
        startDate: z.string(),
        endDate: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.roadmapItem.update({
        where: { id: input.id },
        data: {
          laneId: input.laneId,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
        },
      });
    }),

  itemsBatch: publicProcedure
    .input(
      z.object({
        updates: z.array(
          z.object({
            id: z.string(),
            laneId: z.string().nullable().optional(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            status: z.nativeEnum(RoadmapItemStatus).optional(),
            order: z.number().int().min(0).optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(
        input.updates.map(({ id, startDate, endDate, ...rest }) =>
          ctx.db.roadmapItem.update({
            where: { id },
            data: {
              ...rest,
              ...(startDate ? { startDate: new Date(startDate) } : {}),
              ...(endDate ? { endDate: new Date(endDate) } : {}),
            },
          }),
        ),
      );
    }),

  // ─── Dependencies ───────────────────────────────────────────────────────

  depCreate: publicProcedure
    .input(
      z.object({
        fromItemId: z.string(),
        toItemId: z.string(),
        type: z.nativeEnum(DependencyType).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.roadmapDependency.create({
        data: {
          fromItemId: input.fromItemId,
          toItemId: input.toItemId,
          type: input.type,
        },
      });
    }),

  depDelete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.roadmapDependency.delete({ where: { id: input.id } });
      return { id: input.id };
    }),
});
