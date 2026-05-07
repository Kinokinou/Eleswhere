import type { Photo, RoutePoint, TripBuildTask, TripDay, TripSegment } from "@prisma/client";
import type { TripWithRelations } from "./trip.repository";

type ListTrip = {
  id: string;
  title: string;
  subtitle: string | null;
  startDate: Date;
  endDate: Date;
  coverPhotoId: string | null;
  tags: string[];
  moodTags: string[];
  status: string;
  photos: Photo[];
  days: TripDay[];
  routePoints: RoutePoint[];
  buildTask: TripBuildTask | null;
};

export function mapTripListItem(trip: ListTrip) {
  return {
    id: trip.id,
    title: trip.title,
    subtitle: trip.subtitle ?? undefined,
    startDate: toDateKey(trip.startDate),
    endDate: toDateKey(trip.endDate),
    coverPhotoId: trip.coverPhotoId ?? undefined,
    tags: trip.tags,
    moodTags: trip.moodTags,
    status: trip.status.toLowerCase(),
    buildTask: trip.buildTask ? mapBuildTask(trip.buildTask) : undefined,
    photos: trip.photos.map(mapPhoto),
    days: trip.days.map((day) => ({
      id: day.id,
      dayIndex: day.dayIndex,
      date: toDateKey(day.date),
      title: day.title,
      photoIds: [],
      segments: [],
    })),
    routePoints: trip.routePoints.map((point) => ({
      id: point.id,
      placeName: point.placeName,
      lat: point.lat ?? undefined,
      lng: point.lng ?? undefined,
      date: toDateKey(point.date),
      startTime: point.startTime.toISOString(),
      photoIds: [],
      representativePhotoId: point.representativePhotoId ?? undefined,
      order: point.sortOrder,
    })),
  };
}

export function mapTripDetail(trip: TripWithRelations) {
  return {
    id: trip.id,
    title: trip.title,
    subtitle: trip.subtitle ?? undefined,
    startDate: toDateKey(trip.startDate),
    endDate: toDateKey(trip.endDate),
    coverPhotoId: trip.coverPhotoId ?? undefined,
    notes: trip.notes ?? undefined,
    tags: trip.tags,
    moodTags: trip.moodTags,
    status: trip.status.toLowerCase(),
    buildTask: trip.buildTask ? mapBuildTask(trip.buildTask) : undefined,
    photos: trip.photos.map(mapPhoto),
    days: trip.days.map((day) => ({
      id: day.id,
      dayIndex: day.dayIndex,
      date: toDateKey(day.date),
      title: day.title,
      photoIds: day.segments.flatMap((segment) =>
        segment.photos.map((item) => item.photoId),
      ),
      segments: day.segments.map(mapSegment),
    })),
    routePoints: trip.routePoints.map((point) => ({
      id: point.id,
      placeName: point.placeName,
      lat: point.lat ?? undefined,
      lng: point.lng ?? undefined,
      date: toDateKey(point.date),
      startTime: point.startTime.toISOString(),
      photoIds: point.photos.map((item) => item.photoId),
      representativePhotoId: point.representativePhotoId ?? undefined,
      order: point.sortOrder,
    })),
    createdAt: trip.createdAt.toISOString(),
    updatedAt: trip.updatedAt.toISOString(),
  };
}

function mapBuildTask(task: TripBuildTask) {
  return {
    id: task.id,
    status: task.status.toLowerCase(),
    totalPhotos: task.totalPhotos,
    processedPhotos: task.processedPhotos,
    errorMessage: task.errorMessage ?? undefined,
  };
}

function mapSegment(
  segment: TripSegment & { photos: Array<{ photoId: string }> },
) {
  return {
    id: segment.id,
    dayId: segment.tripDayId,
    title: segment.title,
    placeName: segment.placeName ?? undefined,
    lat: segment.lat ?? undefined,
    lng: segment.lng ?? undefined,
    startTime: segment.startTime.toISOString(),
    endTime: segment.endTime.toISOString(),
    photoIds: segment.photos.map((item) => item.photoId),
  };
}

function mapPhoto(photo: Photo) {
  return {
    id: photo.id,
    fileName: photo.fileName,
    previewUrl: photo.publicUrl,
    takenAt: photo.takenAt.toISOString(),
    lat: photo.lat ?? undefined,
    lng: photo.lng ?? undefined,
    geo: {
      formattedAddress: photo.formattedAddress ?? undefined,
      country: photo.country ?? undefined,
      province: photo.province ?? undefined,
      city: photo.city ?? undefined,
      district: photo.district ?? undefined,
      township: photo.township ?? undefined,
      adcode: photo.adcode ?? undefined,
      poiName: photo.poiName ?? undefined,
      aoiName: photo.aoiName ?? undefined,
      placeName: photo.placeName ?? undefined,
    },
    placeName: photo.placeName ?? undefined,
    country: photo.country ?? undefined,
    selected: true,
  };
}

function toDateKey(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}
