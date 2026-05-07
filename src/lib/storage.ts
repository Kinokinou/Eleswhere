import type { TripDraft } from "./trips";

export const TRIPS_STORAGE_KEY = "eleswhere.trips.v1";
const MAX_STORED_DATA_URL_LENGTH = 160_000;

export function readTrips(): TripDraft[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(TRIPS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeTrips(trips: TripDraft[]) {
  const preparedTrips = trips.map(prepareTripForStorage);

  try {
    window.localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(preparedTrips));
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      throw error;
    }

    // 关键逻辑：localStorage 容量有限，超额时降级保存元数据，保证创建流程不中断。
    window.localStorage.setItem(
      TRIPS_STORAGE_KEY,
      JSON.stringify(preparedTrips.map(removeAllPhotoDataUrls)),
    );
  }
}

export function saveTrip(trip: TripDraft) {
  const trips = readTrips();
  const nextTrips = [trip, ...trips.filter((item) => item.id !== trip.id)];
  writeTrips(nextTrips);
}

export function findTrip(id: string): TripDraft | undefined {
  return readTrips().find((trip) => trip.id === id);
}

export function prepareTripForStorage(trip: TripDraft): TripDraft {
  return {
    ...trip,
    photos: trip.photos.map((photo) => {
      if (!photo.dataUrl || photo.dataUrl.length <= MAX_STORED_DATA_URL_LENGTH) {
        return photo;
      }

      return {
        ...photo,
        dataUrl: undefined,
      };
    }),
  };
}

function removeAllPhotoDataUrls(trip: TripDraft): TripDraft {
  return {
    ...trip,
    photos: trip.photos.map((photo) => ({
      ...photo,
      dataUrl: undefined,
    })),
  };
}

function isQuotaExceededError(error: unknown) {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}
