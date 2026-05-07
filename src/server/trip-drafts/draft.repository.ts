import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { getDefaultUserId } from "@/server/trips/trip.repository";
import type { CreateTripDraftInput, UpdateTripDraftInput } from "./draft.schema";

export type DraftWithPhotos = Prisma.TripDraftGetPayload<{
  include: { photos: { orderBy: { sortOrder: "asc" } } };
}>;

export type DraftPhotoCreateInput = {
  clientId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  storagePath: string;
  publicUrl: string;
  takenAt: string;
  lat?: number;
  lng?: number;
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  township?: string;
  adcode?: string;
  poiName?: string;
  aoiName?: string;
  placeName?: string;
  formattedAddress?: string;
  width?: number;
  height?: number;
  sortOrder: number;
};

const draftInclude = {
  photos: { orderBy: { sortOrder: "asc" as const } },
};

export async function createDraft(input: CreateTripDraftInput) {
  const userId = await getDefaultUserId();

  return prisma.tripDraft.create({
    data: {
      userId,
      title: input.title,
      subtitle: input.subtitle,
      startDate: dateOnly(input.startDate),
      endDate: dateOnly(input.endDate),
      coverClientPhotoId: input.coverClientPhotoId,
      notes: input.notes,
      tags: input.tags,
      moodTags: input.moodTags,
      daysJson: input.days,
      routePointsJson: input.routePoints,
    },
    include: draftInclude,
  });
}

export async function listDrafts() {
  const userId = await getDefaultUserId();

  return prisma.tripDraft.findMany({
    where: { userId, status: { in: ["DRAFT", "BUILDING"] } },
    orderBy: { updatedAt: "desc" },
    include: draftInclude,
  });
}

export async function getDraftById(
  id: string,
  client: PrismaClient | Prisma.TransactionClient = prisma,
) {
  return client.tripDraft.findUnique({
    where: { id },
    include: draftInclude,
  });
}

export async function updateDraft(id: string, input: UpdateTripDraftInput) {
  return prisma.tripDraft.update({
    where: { id },
    data: {
      title: input.title,
      subtitle: input.subtitle,
      startDate: input.startDate ? dateOnly(input.startDate) : undefined,
      endDate: input.endDate ? dateOnly(input.endDate) : undefined,
      coverClientPhotoId: input.coverClientPhotoId,
      notes: input.notes,
      tags: input.tags,
      moodTags: input.moodTags,
      daysJson: input.days,
      routePointsJson: input.routePoints,
    },
    include: draftInclude,
  });
}

export async function deleteDraft(id: string) {
  return prisma.tripDraft.delete({
    where: { id },
    include: draftInclude,
  });
}

export async function addDraftPhotos(draftId: string, photos: DraftPhotoCreateInput[]) {
  return prisma.$transaction(async (tx) => {
    for (const photo of photos) {
      await tx.tripDraftPhoto.upsert({
        where: {
          draftId_clientId: {
            draftId,
            clientId: photo.clientId,
          },
        },
        update: {
          fileName: photo.fileName,
          originalName: photo.originalName,
          mimeType: photo.mimeType,
          fileSize: photo.fileSize,
          storagePath: photo.storagePath,
          publicUrl: photo.publicUrl,
          takenAt: new Date(photo.takenAt),
          lat: photo.lat,
          lng: photo.lng,
          country: photo.country,
          province: photo.province,
          city: photo.city,
          district: photo.district,
          township: photo.township,
          adcode: photo.adcode,
          poiName: photo.poiName,
          aoiName: photo.aoiName,
          placeName: photo.placeName,
          formattedAddress: photo.formattedAddress,
          width: photo.width,
          height: photo.height,
          sortOrder: photo.sortOrder,
        },
        create: {
          draftId,
          clientId: photo.clientId,
          fileName: photo.fileName,
          originalName: photo.originalName,
          mimeType: photo.mimeType,
          fileSize: photo.fileSize,
          storagePath: photo.storagePath,
          publicUrl: photo.publicUrl,
          takenAt: new Date(photo.takenAt),
          lat: photo.lat,
          lng: photo.lng,
          country: photo.country,
          province: photo.province,
          city: photo.city,
          district: photo.district,
          township: photo.township,
          adcode: photo.adcode,
          poiName: photo.poiName,
          aoiName: photo.aoiName,
          placeName: photo.placeName,
          formattedAddress: photo.formattedAddress,
          width: photo.width,
          height: photo.height,
          sortOrder: photo.sortOrder,
        },
      });
    }

    return getDraftById(draftId, tx);
  });
}

function dateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}
