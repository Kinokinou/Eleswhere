import type { TripDraft } from "./trips";

export type UploadedPhotoClientResult = {
  clientId: string;
  fileName: string;
  originalName: string;
  storagePath: string;
  publicUrl: string;
  mimeType: string;
  fileSize: number;
};

export async function fetchTrips(): Promise<TripDraft[]> {
  const response = await fetch("/api/trips", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("获取旅行列表失败");
  }
  const payload = await response.json();
  return payload.trips ?? [];
}

export async function fetchTrip(id: string): Promise<TripDraft | null> {
  const response = await fetch(`/api/trips/${id}`, { cache: "no-store" });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error("获取旅行详情失败");
  }
  const payload = await response.json();
  return payload.trip ?? null;
}

export async function uploadPhotos(
  photos: Array<{ clientId: string; file: File }>,
): Promise<UploadedPhotoClientResult[]> {
  const formData = new FormData();
  for (const photo of photos) {
    formData.append("clientIds", photo.clientId);
    formData.append("files", photo.file);
  }

  const response = await fetch("/api/uploads/photos", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? "照片上传失败");
  }

  const payload = await response.json();
  return payload.photos ?? [];
}

export async function createTripFromDraft(
  draft: TripDraft,
  uploadedPhotos: UploadedPhotoClientResult[],
): Promise<TripDraft> {
  const response = await fetch("/api/trips", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(buildCreateTripRequest(draft, uploadedPhotos)),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? "创建旅行失败");
  }

  const payload = await response.json();
  return payload.trip;
}

export function buildCreateTripRequest(
  draft: TripDraft,
  uploadedPhotos: UploadedPhotoClientResult[],
) {
  const uploadByClientId = new Map(
    uploadedPhotos.map((photo) => [photo.clientId, photo]),
  );

  return {
    title: draft.title,
    subtitle: draft.subtitle,
    startDate: draft.startDate,
    endDate: draft.endDate,
    coverClientPhotoId: draft.coverPhotoId,
    tags: draft.tags,
    moodTags: draft.moodTags,
    notes: draft.notes,
    photos: draft.photos
      .map((photo) => {
        const uploaded = uploadByClientId.get(photo.id);
        if (!uploaded) {
          return null;
        }

        return {
          ...uploaded,
          takenAt: photo.takenAt,
          lat: photo.lat,
          lng: photo.lng,
          geo: photo.geo,
          placeName: photo.placeName,
          country: photo.country,
        };
      })
      .filter((photo) => photo !== null),
    days: draft.days.map((day) => ({
      clientId: day.id,
      dayIndex: day.dayIndex,
      date: day.date,
      title: day.title,
      photoIds: day.photoIds,
      segments: day.segments.map((segment) => ({
        clientId: segment.id,
        title: segment.title,
        placeName: segment.placeName,
        lat: segment.lat,
        lng: segment.lng,
        startTime: segment.startTime,
        endTime: segment.endTime,
        photoIds: segment.photoIds,
      })),
    })),
    routePoints: draft.routePoints.map((point) => ({
      clientId: point.id,
      placeName: point.placeName,
      lat: point.lat,
      lng: point.lng,
      date: point.date,
      startTime: point.startTime,
      representativePhotoId: point.representativePhotoId,
      photoIds: point.photoIds,
      order: point.order,
    })),
  };
}
