import type { PrismaClient } from "@/generated/prisma/client";
import type {
  RoadmapTimeScale as DbTimeScale,
  RoadmapItemStatus as DbItemStatus,
  RoadmapItemType as DbItemType,
} from "@/generated/prisma/client";

type LaneInput = {
  clientId: string;
  name: string;
  color: string;
  order: number;
};

type ItemInput = {
  clientId: string;
  title: string;
  description?: string;
  laneClientId: string;
  startDate: string;
  endDate: string;
  status: DbItemStatus;
  type: DbItemType;
  color?: string;
  order: number;
};

/**
 * Full sync for a roadmap: upsert the roadmap record, reconcile lanes and items.
 * All operations run in a single transaction.
 */
export async function syncRoadmapFull(
  db: PrismaClient,
  projectId: string,
  input: {
    roadmapId?: string;
    title: string;
    timeScale: DbTimeScale;
    lanes: LaneInput[];
    items: ItemInput[];
  },
) {
  return db.$transaction(async (tx) => {
    // 1. Upsert roadmap
    let roadmapId: string;
    if (input.roadmapId) {
      await tx.roadmap.update({
        where: { id: input.roadmapId },
        data: {
          title: input.title,
          timeScale: input.timeScale,
        },
      });
      roadmapId = input.roadmapId;
    } else {
      const created = await tx.roadmap.create({
        data: {
          title: input.title,
          timeScale: input.timeScale,
          projectId,
        },
      });
      roadmapId = created.id;
    }

    // 2. Get existing lanes and items
    const existingLanes = await tx.roadmapLane.findMany({
      where: { roadmapId },
    });
    const existingItems = await tx.roadmapItem.findMany({
      where: { roadmapId },
    });

    // 3. Build clientId → existing DB id mapping for lanes
    // Lanes with CUID-format IDs might already be in DB
    const existingLaneById = new Map(existingLanes.map((l) => [l.id, l]));

    // Map from clientId → DB lane ID
    const laneIdMap = new Map<string, string>();

    // Sync lanes
    const touchedLaneIds = new Set<string>();
    for (const lane of input.lanes) {
      if (existingLaneById.has(lane.clientId)) {
        // Update existing lane
        await tx.roadmapLane.update({
          where: { id: lane.clientId },
          data: { name: lane.name, color: lane.color, order: lane.order },
        });
        laneIdMap.set(lane.clientId, lane.clientId);
        touchedLaneIds.add(lane.clientId);
      } else {
        // Create new lane
        const created = await tx.roadmapLane.create({
          data: {
            name: lane.name,
            color: lane.color,
            order: lane.order,
            roadmapId,
          },
        });
        laneIdMap.set(lane.clientId, created.id);
        touchedLaneIds.add(created.id);
      }
    }

    // Delete lanes not in input
    const laneIdsToDelete = existingLanes
      .filter((l) => !touchedLaneIds.has(l.id))
      .map((l) => l.id);
    if (laneIdsToDelete.length > 0) {
      await tx.roadmapLane.deleteMany({
        where: { id: { in: laneIdsToDelete } },
      });
    }

    // 4. Sync items
    const existingItemById = new Map(existingItems.map((i) => [i.id, i]));
    const touchedItemIds = new Set<string>();

    for (const item of input.items) {
      const resolvedLaneId = laneIdMap.get(item.laneClientId) ?? null;

      if (existingItemById.has(item.clientId)) {
        // Update existing item
        await tx.roadmapItem.update({
          where: { id: item.clientId },
          data: {
            title: item.title,
            description: item.description,
            laneId: resolvedLaneId,
            startDate: new Date(item.startDate),
            endDate: new Date(item.endDate),
            status: item.status,
            type: item.type,
            color: item.color,
            order: item.order,
          },
        });
        touchedItemIds.add(item.clientId);
      } else {
        // Create new item
        const created = await tx.roadmapItem.create({
          data: {
            title: item.title,
            description: item.description,
            laneId: resolvedLaneId,
            startDate: new Date(item.startDate),
            endDate: new Date(item.endDate),
            status: item.status,
            type: item.type,
            color: item.color,
            order: item.order,
            roadmapId,
          },
        });
        touchedItemIds.add(created.id);
      }
    }

    // Delete items not in input
    const itemIdsToDelete = existingItems
      .filter((i) => !touchedItemIds.has(i.id))
      .map((i) => i.id);
    if (itemIdsToDelete.length > 0) {
      await tx.roadmapItem.deleteMany({
        where: { id: { in: itemIdsToDelete } },
      });
    }

    // 5. Return the complete roadmap
    return tx.roadmap.findUniqueOrThrow({
      where: { id: roadmapId },
      include: {
        lanes: { orderBy: { order: "asc" } },
        items: {
          orderBy: { order: "asc" },
          include: {
            lane: true,
            feature: { select: { id: true, title: true } },
          },
        },
      },
    });
  });
}
