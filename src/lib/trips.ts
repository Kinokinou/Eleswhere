export type GeoAddress = {
  formattedAddress?: string;
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  township?: string;
  adcode?: string;
  poiName?: string;
  aoiName?: string;
  placeName?: string;
};

export type PhotoMeta = {
  id: string;
  fileName: string;
  previewUrl: string;
  dataUrl?: string;
  takenAt: string;
  lat?: number;
  lng?: number;
  geo?: GeoAddress;
  placeName?: string;
  country?: string;
  selected: boolean;
};

export type TripSegment = {
  id: string;
  dayId: string;
  title: string;
  placeName?: string;
  lat?: number;
  lng?: number;
  startTime: string;
  endTime: string;
  photoIds: string[];
};

export type TripDay = {
  id: string;
  dayIndex: number;
  date: string;
  title: string;
  photoIds: string[];
  segments: TripSegment[];
};

export type RoutePoint = {
  id: string;
  placeName: string;
  lat?: number;
  lng?: number;
  date: string;
  startTime: string;
  photoIds: string[];
  representativePhotoId?: string;
  order: number;
};

export type TripDraft = {
  id: string;
  title: string;
  subtitle?: string;
  startDate: string;
  endDate: string;
  coverPhotoId?: string;
  tags: string[];
  moodTags: string[];
  notes?: string;
  photos: PhotoMeta[];
  days: TripDay[];
  routePoints: RoutePoint[];
  createdAt?: string;
  updatedAt?: string;
};

export type RegeoPoint = {
  id: string;
  lat: number;
  lng: number;
};

const SEGMENT_GAP_MS = 2 * 60 * 60 * 1000;

export function pickPlaceName(geo?: GeoAddress): string | undefined {
  if (!geo) {
    return undefined;
  }

  return (
    cleanText(geo.aoiName) ??
    cleanText(geo.poiName) ??
    cleanText(geo.placeName) ??
    cleanText(geo.district) ??
    cleanText(geo.township) ??
    cleanText(geo.formattedAddress)
  );
}

export function collectUniqueRegeoPoints(photos: PhotoMeta[]): RegeoPoint[] {
  const seen = new Set<string>();
  const points: RegeoPoint[] = [];

  for (const photo of photos) {
    if (typeof photo.lat !== "number" || typeof photo.lng !== "number") {
      continue;
    }

    const lat = roundCoordinate(photo.lat);
    const lng = roundCoordinate(photo.lng);
    const key = `${lat},${lng}`;

    // 关键逻辑：同一批照片可能在同一地点连拍，只需要逆地理编码一次。
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    points.push({ id: photo.id, lat, lng });
  }

  return points;
}

export function buildTripDraft(inputPhotos: PhotoMeta[]): TripDraft {
  const photos = inputPhotos
    .filter((photo) => photo.selected)
    .map((photo) => ({
      ...photo,
      placeName: photo.placeName ?? pickPlaceName(photo.geo),
    }))
    .sort((a, b) => dateValue(a.takenAt) - dateValue(b.takenAt));

  const days = buildTripDays(photos);
  const routePoints = buildRoutePoints(days, photos);
  const title = buildTripTitle(routePoints, photos);

  return {
    id: createId("trip"),
    title,
    startDate: days[0]?.date ?? "",
    endDate: days.at(-1)?.date ?? "",
    coverPhotoId: photos[0]?.id,
    tags: [],
    moodTags: [],
    photos,
    days,
    routePoints,
  };
}

function buildTripDays(photos: PhotoMeta[]): TripDay[] {
  const grouped = new Map<string, PhotoMeta[]>();

  for (const photo of photos) {
    const dayKey = toDateKey(photo.takenAt);
    grouped.set(dayKey, [...(grouped.get(dayKey) ?? []), photo]);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, dayPhotos], index) => {
      const dayId = createId(`day-${index + 1}`);
      const sortedPhotos = [...dayPhotos].sort(
        (a, b) => dateValue(a.takenAt) - dateValue(b.takenAt),
      );

      return {
        id: dayId,
        dayIndex: index + 1,
        date,
        title: `第 ${index + 1} 天`,
        photoIds: sortedPhotos.map((photo) => photo.id),
        segments: buildTripSegments(dayId, sortedPhotos),
      };
    });
}

function buildTripSegments(dayId: string, photos: PhotoMeta[]): TripSegment[] {
  const segments: PhotoMeta[][] = [];

  for (const photo of photos) {
    const current = segments.at(-1);
    const previous = current?.at(-1);

    if (!current || !previous || shouldStartNewSegment(previous, photo)) {
      segments.push([photo]);
      continue;
    }

    current.push(photo);
  }

  return segments.map((segmentPhotos, index) => {
    const first = segmentPhotos[0];
    const last = segmentPhotos.at(-1) ?? first;
    const placeName = first.placeName;

    return {
      id: createId(`${dayId}-segment-${index + 1}`),
      dayId,
      title: placeName ?? `时间段 ${index + 1}`,
      placeName,
      lat: first.lat,
      lng: first.lng,
      startTime: first.takenAt,
      endTime: last.takenAt,
      photoIds: segmentPhotos.map((photo) => photo.id),
    };
  });
}

function buildRoutePoints(days: TripDay[], photos: PhotoMeta[]): RoutePoint[] {
  const photoById = new Map(photos.map((photo) => [photo.id, photo]));
  const routePoints: RoutePoint[] = [];

  for (const day of days) {
    for (const segment of day.segments) {
      if (!segment.placeName) {
        continue;
      }

      const previous = routePoints.at(-1);
      if (previous?.placeName === segment.placeName) {
        previous.photoIds.push(...segment.photoIds);
        continue;
      }

      const representativePhoto = photoById.get(segment.photoIds[0]);
      routePoints.push({
        id: createId(`route-${routePoints.length + 1}`),
        placeName: segment.placeName,
        lat: segment.lat,
        lng: segment.lng,
        date: day.date,
        startTime: segment.startTime,
        photoIds: [...segment.photoIds],
        representativePhotoId: representativePhoto?.id,
        order: routePoints.length + 1,
      });
    }
  }

  return routePoints;
}

function shouldStartNewSegment(previous: PhotoMeta, current: PhotoMeta): boolean {
  const previousPlace = previous.placeName;
  const currentPlace = current.placeName;

  // 关键逻辑：只要两张照片都有地点，地点变化就切换新的旅行段落。
  if (previousPlace && currentPlace) {
    return previousPlace !== currentPlace;
  }

  return dateValue(current.takenAt) - dateValue(previous.takenAt) > SEGMENT_GAP_MS;
}

function buildTripTitle(routePoints: RoutePoint[], photos: PhotoMeta[]): string {
  const places = Array.from(new Set(routePoints.map((point) => point.placeName)));
  if (places.length > 0) {
    return places.slice(0, 3).join(" · ");
  }

  const startDate = toDateKey(photos[0]?.takenAt ?? "");
  const endDate = toDateKey(photos.at(-1)?.takenAt ?? "");
  return startDate && endDate
    ? `Trip from ${startDate} to ${endDate}`
    : "Untitled Trip";
}

function cleanText(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function roundCoordinate(value: number): number {
  return Number(value.toFixed(6));
}

function toDateKey(value: string): string {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

function dateValue(value: string): number {
  return new Date(value).getTime();
}

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
