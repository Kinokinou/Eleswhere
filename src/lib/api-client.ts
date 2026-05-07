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

export type TripBuildTaskClientResult = {
  id: string;
  draftId: string;
  tripId: string;
  status: "queued" | "running" | "succeeded" | "failed";
  totalPhotos: number;
  processedPhotos: number;
  errorMessage?: string;
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

export async function deleteTrip(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/trips/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? "删除旅行失败");
  }

  return response.json();
}

export async function fetchTripDrafts(): Promise<TripDraft[]> {
  const response = await fetch("/api/trip-drafts", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("获取草稿箱失败");
  }
  const payload = await response.json();
  return payload.drafts ?? [];
}

export async function fetchTripDraft(id: string): Promise<TripDraft | null> {
  const response = await fetch(`/api/trip-drafts/${id}`, { cache: "no-store" });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error("获取草稿详情失败");
  }
  const payload = await response.json();
  return payload.draft ?? null;
}

export async function createTripDraft(draft: TripDraft): Promise<TripDraft> {
  const response = await fetch("/api/trip-drafts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(buildCreateTripDraftRequest(draft)),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? "保存草稿失败");
  }

  const payload = await response.json();
  return payload.draft;
}

export async function deleteTripDraft(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/trip-drafts/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? "删除草稿失败");
  }
  return response.json();
}

export async function uploadDraftPhotos(
  draftId: string,
  photos: Array<{ clientId: string; file: File; meta: TripDraft["photos"][number] }>,
): Promise<TripDraft> {
  let latestDraft: TripDraft | null = null;
  for (const chunk of chunkClientPhotos(photos, 20)) {
    const formData = new FormData();
    for (const photo of chunk) {
      formData.append("clientIds", photo.clientId);
      formData.append("files", photo.file);
      formData.append("metadata", JSON.stringify(buildDraftPhotoMetadata(photo.meta)));
    }

    const response = await fetch(`/api/trip-drafts/${draftId}/photos`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message ?? "上传草稿照片失败");
    }
    const payload = await response.json();
    latestDraft = payload.draft;
  }

  return latestDraft ?? (await fetchTripDraft(draftId))!;
}

export async function startTripDraftBuild(
  draftId: string,
): Promise<TripBuildTaskClientResult> {
  const response = await fetch(`/api/trip-drafts/${draftId}/build`, {
    method: "POST",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? "启动构建任务失败");
  }

  const payload = await response.json();
  return payload.task;
}

export async function fetchTripBuildTask(
  taskId: string,
): Promise<TripBuildTaskClientResult | null> {
  const response = await fetch(`/api/trip-build-tasks/${taskId}`, {
    cache: "no-store",
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error("获取构建进度失败");
  }
  const payload = await response.json();
  return payload.task ?? null;
}

export async function saveTripDraftWithPhotos(
  draft: TripDraft,
  photoFiles: Record<string, File>,
): Promise<TripDraft> {
  const savedDraft = await createTripDraft(draft);
  const uploadInputs = draft.photos
    .map((photo) => {
      const file = photoFiles[photo.id];
      return file ? { clientId: photo.id, file, meta: photo } : null;
    })
    .filter(
      (item): item is { clientId: string; file: File; meta: TripDraft["photos"][number] } =>
        item !== null,
    );

  return uploadDraftPhotos(savedDraft.id, uploadInputs);
}

export async function saveDraftAndStartBuild(
  draft: TripDraft,
  photoFiles: Record<string, File>,
): Promise<TripBuildTaskClientResult> {
  const savedDraft = await saveTripDraftWithPhotos(draft, photoFiles);
  return startTripDraftBuild(savedDraft.id);
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

export function chunkClientPhotos<T>(photos: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < photos.length; index += size) {
    chunks.push(photos.slice(index, index + size));
  }
  return chunks;
}

export function buildCreateTripDraftRequest(draft: TripDraft) {
  return {
    title: draft.title,
    subtitle: draft.subtitle,
    startDate: draft.startDate,
    endDate: draft.endDate,
    coverClientPhotoId: draft.coverPhotoId,
    tags: draft.tags,
    moodTags: draft.moodTags,
    notes: draft.notes,
    photos: draft.photos.map(buildDraftPhotoMetadata),
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

function buildDraftPhotoMetadata(photo: TripDraft["photos"][number]) {
  return {
    clientId: photo.id,
    fileName: photo.fileName,
    takenAt: photo.takenAt,
    lat: photo.lat,
    lng: photo.lng,
    geo: photo.geo,
    placeName: photo.placeName,
    country: photo.country,
  };
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
