import { prisma } from "@/server/db/prisma";
import type { RoutePoint, TripDay } from "@/lib/trips";
import {
  MAX_BATCH_ATTEMPTS,
  splitIntoBuildBatches,
} from "./trip-build.batch";

export {
  BUILD_BATCH_SIZE,
  MAX_BATCH_ATTEMPTS,
  splitIntoBuildBatches,
} from "./trip-build.batch";

type BuildTaskView = {
  id: string;
  draftId: string;
  tripId: string;
  status: string;
  totalPhotos: number;
  processedPhotos: number;
  errorMessage?: string;
};

// 启动构建任务：先创建 BUILDING Trip 占位卡片，再创建可恢复的批次任务。
export async function startTripBuild(draftId: string): Promise<BuildTaskView> {
  const existingTask = await prisma.tripBuildTask.findFirst({
    where: { draftId, status: { in: ["QUEUED", "RUNNING"] } },
  });
  if (existingTask) {
    return mapBuildTask(existingTask);
  }

  const draft = await prisma.tripDraft.findUnique({
    where: { id: draftId },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });
  if (!draft) {
    throw new Error("草稿不存在");
  }
  if (draft.photos.length === 0) {
    throw new Error("草稿没有可构建的照片");
  }

  const task = await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.create({
      data: {
        userId: draft.userId,
        draftId: draft.id,
        title: draft.title,
        subtitle: draft.subtitle,
        startDate: draft.startDate,
        endDate: draft.endDate,
        notes: draft.notes,
        tags: draft.tags,
        moodTags: draft.moodTags,
        status: "BUILDING",
      },
    });

    const createdTask = await tx.tripBuildTask.create({
      data: {
        draftId: draft.id,
        tripId: trip.id,
        totalPhotos: draft.photos.length,
        processedPhotos: 0,
        status: "QUEUED",
      },
    });

    const batches = splitIntoBuildBatches(draft.photos.map((photo) => photo.id));
    await tx.tripBuildBatch.createMany({
      data: batches.map((photoIds, index) => ({
        taskId: createdTask.id,
        batchIndex: index + 1,
        photoIds,
      })),
    });

    await tx.tripDraft.update({
      where: { id: draft.id },
      data: { status: "BUILDING", failureMessage: null },
    });

    return createdTask;
  });

  void processTripBuildTask(task.id);
  return mapBuildTask(task);
}

// 查询任务时顺手唤醒 worker，保证本地开发环境刷新页面后任务还能继续推进。
export async function getTripBuildTask(id: string): Promise<BuildTaskView | null> {
  const task = await prisma.tripBuildTask.findUnique({ where: { id } });
  if (!task) {
    return null;
  }

  if (task.status === "QUEUED" || task.status === "RUNNING") {
    void processTripBuildTask(task.id);
  }

  return mapBuildTask(task);
}

// 后端 worker 主入口：按批次顺序处理，任一批次未成功前不推进后续批次。
export async function processTripBuildTask(taskId: string) {
  const task = await prisma.tripBuildTask.findUnique({
    where: { id: taskId },
    include: {
      draft: { include: { photos: { orderBy: { sortOrder: "asc" } } } },
      trip: true,
      batches: { orderBy: { batchIndex: "asc" } },
    },
  });
  if (!task || task.status === "SUCCEEDED" || task.status === "FAILED") {
    return;
  }

  await prisma.tripBuildTask.update({
    where: { id: task.id },
    data: {
      status: "RUNNING",
      startedAt: task.startedAt ?? new Date(),
    },
  });

  for (const batch of task.batches) {
    if (batch.status === "SUCCEEDED") {
      continue;
    }

    const success = await processBuildBatch(task.id, batch.id);
    if (!success) {
      return;
    }
  }

  await finalizeBuildTask(task.id);
}

// 单批处理保持幂等：sourceDraftPhotoId 唯一约束保证重试不会重复写正式照片。
async function processBuildBatch(taskId: string, batchId: string): Promise<boolean> {
  const batch = await prisma.tripBuildBatch.findUnique({ where: { id: batchId } });
  const task = await prisma.tripBuildTask.findUnique({
    where: { id: taskId },
    include: { draft: { include: { photos: true } } },
  });
  if (!batch || !task) {
    return false;
  }

  const nextAttempt = batch.attemptCount + 1;
  await prisma.tripBuildBatch.update({
    where: { id: batch.id },
    data: { status: "RUNNING", attemptCount: nextAttempt, errorMessage: null },
  });

  try {
    const draftPhotoById = new Map(task.draft.photos.map((photo) => [photo.id, photo]));

    await prisma.$transaction(async (tx) => {
      for (const draftPhotoId of batch.photoIds) {
        const draftPhoto = draftPhotoById.get(draftPhotoId);
        if (!draftPhoto) {
          throw new Error(`草稿照片不存在：${draftPhotoId}`);
        }

        await tx.photo.upsert({
          where: { sourceDraftPhotoId: draftPhoto.id },
          update: {},
          create: {
            tripId: task.tripId,
            sourceDraftPhotoId: draftPhoto.id,
            fileName: draftPhoto.fileName,
            originalName: draftPhoto.originalName,
            mimeType: draftPhoto.mimeType,
            fileSize: draftPhoto.fileSize,
            storagePath: draftPhoto.storagePath,
            publicUrl: draftPhoto.publicUrl,
            takenAt: draftPhoto.takenAt,
            lat: draftPhoto.lat,
            lng: draftPhoto.lng,
            country: draftPhoto.country,
            province: draftPhoto.province,
            city: draftPhoto.city,
            district: draftPhoto.district,
            township: draftPhoto.township,
            adcode: draftPhoto.adcode,
            poiName: draftPhoto.poiName,
            aoiName: draftPhoto.aoiName,
            placeName: draftPhoto.placeName,
            formattedAddress: draftPhoto.formattedAddress,
            width: draftPhoto.width,
            height: draftPhoto.height,
          },
        });
      }

      await tx.tripBuildBatch.update({
        where: { id: batch.id },
        data: { status: "SUCCEEDED", errorMessage: null },
      });
    });

    await refreshTaskProgress(taskId);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "批次构建失败";
    if (nextAttempt >= MAX_BATCH_ATTEMPTS) {
      await failBuildTask(taskId, message);
      return false;
    }

    await prisma.tripBuildBatch.update({
      where: { id: batch.id },
      data: { status: "PENDING", errorMessage: message },
    });
    return processBuildBatch(taskId, batchId);
  }
}

// 根据成功批次重新计算进度，避免进度依赖内存状态。
async function refreshTaskProgress(taskId: string) {
  const succeededBatches = await prisma.tripBuildBatch.findMany({
    where: { taskId, status: "SUCCEEDED" },
    select: { photoIds: true },
  });
  const processedPhotos = succeededBatches.reduce(
    (sum, batch) => sum + batch.photoIds.length,
    0,
  );

  await prisma.tripBuildTask.update({
    where: { id: taskId },
    data: { processedPhotos },
  });
}

// 所有照片批次成功后，再一次性生成天、段落、路线点和照片关联。
async function finalizeBuildTask(taskId: string) {
  const task = await prisma.tripBuildTask.findUnique({
    where: { id: taskId },
    include: {
      draft: { include: { photos: { orderBy: { sortOrder: "asc" } } } },
      trip: true,
    },
  });
  if (!task || task.status === "SUCCEEDED") {
    return;
  }

  await prisma.$transaction(async (tx) => {
    const photos = await tx.photo.findMany({
      where: { tripId: task.tripId, sourceDraftPhotoId: { not: null } },
    });
    const draftPhotoById = new Map(task.draft.photos.map((photo) => [photo.id, photo]));
    const photoIdByClientId = new Map<string, string>();
    for (const photo of photos) {
      const draftPhoto = photo.sourceDraftPhotoId
        ? draftPhotoById.get(photo.sourceDraftPhotoId)
        : undefined;
      if (draftPhoto) {
        photoIdByClientId.set(draftPhoto.clientId, photo.id);
      }
    }

    const days = normalizeJsonArray<TripDay>(task.draft.daysJson);
    for (const day of days) {
      const createdDay = await tx.tripDay.create({
        data: {
          tripId: task.tripId,
          dayIndex: day.dayIndex,
          date: dateOnly(day.date),
          title: day.title,
        },
      });

      for (const [segmentIndex, segment] of day.segments.entries()) {
        const createdSegment = await tx.tripSegment.create({
          data: {
            tripDayId: createdDay.id,
            title: segment.title,
            placeName: segment.placeName,
            lat: segment.lat,
            lng: segment.lng,
            startTime: new Date(segment.startTime),
            endTime: new Date(segment.endTime),
            sortOrder: segmentIndex + 1,
          },
        });

        for (const [photoIndex, clientPhotoId] of segment.photoIds.entries()) {
          const photoId = photoIdByClientId.get(clientPhotoId);
          if (!photoId) continue;
          await tx.tripSegmentPhoto.create({
            data: {
              tripSegmentId: createdSegment.id,
              photoId,
              sortOrder: photoIndex + 1,
            },
          });
        }
      }
    }

    const routePoints = normalizeJsonArray<RoutePoint>(task.draft.routePointsJson);
    for (const routePoint of routePoints) {
      const representativePhotoId = routePoint.representativePhotoId
        ? photoIdByClientId.get(routePoint.representativePhotoId)
        : undefined;
      const createdPoint = await tx.routePoint.create({
        data: {
          tripId: task.tripId,
          placeName: routePoint.placeName,
          lat: routePoint.lat,
          lng: routePoint.lng,
          date: dateOnly(routePoint.date),
          startTime: new Date(routePoint.startTime),
          representativePhotoId,
          sortOrder: routePoint.order,
        },
      });

      for (const clientPhotoId of routePoint.photoIds) {
        const photoId = photoIdByClientId.get(clientPhotoId);
        if (!photoId) continue;
        await tx.routePointPhoto.create({
          data: { routePointId: createdPoint.id, photoId },
        });
      }
    }

    const coverPhotoId = task.draft.coverClientPhotoId
      ? photoIdByClientId.get(task.draft.coverClientPhotoId)
      : undefined;

    await tx.trip.update({
      where: { id: task.tripId },
      data: { status: "READY", coverPhotoId },
    });
    await tx.tripDraft.update({
      where: { id: task.draftId },
      data: { status: "BUILT", failureMessage: null },
    });
    await tx.tripBuildTask.update({
      where: { id: task.id },
      data: {
        status: "SUCCEEDED",
        processedPhotos: task.totalPhotos,
        finishedAt: new Date(),
      },
    });
  });
}

// 任务失败时保留失败 Trip 卡片，同时把草稿退回 DRAFT 让用户可重新编辑。
async function failBuildTask(taskId: string, message: string) {
  const task = await prisma.tripBuildTask.findUnique({ where: { id: taskId } });
  if (!task) {
    return;
  }

  await prisma.$transaction([
    prisma.tripBuildTask.update({
      where: { id: task.id },
      data: { status: "FAILED", errorMessage: message, finishedAt: new Date() },
    }),
    prisma.trip.update({
      where: { id: task.tripId },
      data: { status: "FAILED" },
    }),
    prisma.tripDraft.update({
      where: { id: task.draftId },
      data: { status: "DRAFT", failureMessage: message },
    }),
  ]);
}

function mapBuildTask(task: {
  id: string;
  draftId: string;
  tripId: string;
  status: string;
  totalPhotos: number;
  processedPhotos: number;
  errorMessage: string | null;
}) {
  return {
    id: task.id,
    draftId: task.draftId,
    tripId: task.tripId,
    status: task.status.toLowerCase(),
    totalPhotos: task.totalPhotos,
    processedPhotos: task.processedPhotos,
    errorMessage: task.errorMessage ?? undefined,
  };
}

function normalizeJsonArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function dateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}
