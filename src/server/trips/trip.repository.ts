import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import type { CreateTripInput, UpdateTripInput } from "./trip.schema";

export const DEFAULT_USER_EMAIL = "local@eleswhere.dev";

export type TripWithRelations = Prisma.TripGetPayload<{
  include: typeof tripDetailInclude;
}>;

const tripDetailInclude = {
  photos: true,
  days: {
    orderBy: { dayIndex: "asc" as const },
    include: {
      segments: {
        orderBy: { sortOrder: "asc" as const },
        include: {
          photos: {
            orderBy: { sortOrder: "asc" as const },
            include: { photo: true },
          },
        },
      },
    },
  },
  routePoints: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      photos: { include: { photo: true } },
    },
  },
};

export async function getDefaultUserId(client: PrismaClient | Prisma.TransactionClient = prisma) {
  const user = await client.user.findUnique({
    where: { email: DEFAULT_USER_EMAIL },
    select: { id: true },
  });

  if (!user) {
    throw new Error("默认用户不存在，请先运行数据库 seed");
  }

  return user.id;
}

export async function createTripGraph(input: CreateTripInput): Promise<TripWithRelations> {
  return prisma.$transaction(async (tx) => {
    const userId = await getDefaultUserId(tx);
    const trip = await tx.trip.create({
      data: {
        userId,
        title: input.title,
        subtitle: input.subtitle,
        startDate: dateOnly(input.startDate),
        endDate: dateOnly(input.endDate),
        notes: input.notes,
        tags: input.tags,
        moodTags: input.moodTags,
      },
    });

    const photoIdByClientId = new Map<string, string>();
    for (const photo of input.photos) {
      const createdPhoto = await tx.photo.create({
        data: {
          tripId: trip.id,
          fileName: photo.fileName,
          originalName: photo.originalName,
          mimeType: photo.mimeType,
          fileSize: photo.fileSize,
          storagePath: photo.storagePath,
          publicUrl: photo.publicUrl,
          takenAt: new Date(photo.takenAt),
          lat: photo.lat,
          lng: photo.lng,
          country: photo.country ?? photo.geo?.country,
          province: photo.geo?.province,
          city: photo.geo?.city,
          district: photo.geo?.district,
          township: photo.geo?.township,
          adcode: photo.geo?.adcode,
          poiName: photo.geo?.poiName,
          aoiName: photo.geo?.aoiName,
          placeName: photo.placeName ?? photo.geo?.placeName,
          formattedAddress: photo.geo?.formattedAddress,
          width: photo.width,
          height: photo.height,
        },
      });
      photoIdByClientId.set(photo.clientId, createdPhoto.id);
    }

    const coverPhotoId = input.coverClientPhotoId
      ? photoIdByClientId.get(input.coverClientPhotoId)
      : undefined;
    if (coverPhotoId) {
      await tx.trip.update({ where: { id: trip.id }, data: { coverPhotoId } });
    }

    for (const day of input.days) {
      const createdDay = await tx.tripDay.create({
        data: {
          tripId: trip.id,
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

    for (const routePoint of input.routePoints) {
      const representativePhotoId = routePoint.representativePhotoId
        ? photoIdByClientId.get(routePoint.representativePhotoId)
        : undefined;
      const createdRoutePoint = await tx.routePoint.create({
        data: {
          tripId: trip.id,
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
          data: {
            routePointId: createdRoutePoint.id,
            photoId,
          },
        });
      }
    }

    return getTripById(trip.id, tx) as Promise<TripWithRelations>;
  });
}

export async function listTrips() {
  return prisma.trip.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      photos: true,
      routePoints: { orderBy: { sortOrder: "asc" } },
      days: { orderBy: { dayIndex: "asc" } },
    },
  });
}

export async function getTripById(
  id: string,
  client: PrismaClient | Prisma.TransactionClient = prisma,
) {
  return client.trip.findUnique({
    where: { id },
    include: tripDetailInclude,
  });
}

export async function updateTrip(id: string, input: UpdateTripInput) {
  return prisma.$transaction(async (tx) => {
    await tx.trip.update({
      where: { id },
      data: {
        title: input.title,
        subtitle: input.subtitle,
        notes: input.notes,
        tags: input.tags,
        moodTags: input.moodTags,
        coverPhotoId: input.coverPhotoId,
      },
    });

    for (const day of input.days ?? []) {
      await tx.tripDay.update({
        where: { id: day.id },
        data: { title: day.title },
      });
    }

    return getTripById(id, tx);
  });
}

export async function deleteTrip(id: string) {
  return prisma.trip.delete({
    where: { id },
    include: { photos: true },
  });
}

function dateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}
