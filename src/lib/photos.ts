import * as exifr from "exifr";
import {
  buildTripDraft,
  collectUniqueRegeoPoints,
  type GeoAddress,
  type PhotoMeta,
} from "./trips";

type ExifResult = {
  DateTimeOriginal?: Date | string;
  CreateDate?: Date | string;
  latitude?: number;
  longitude?: number;
  GPSLatitude?: number;
  GPSLongitude?: number;
};

type RegeoResponse = {
  results: Array<GeoAddress & {
    id: string;
    lat: number;
    lng: number;
    status: "success" | "failed" | "skipped";
    message?: string;
  }>;
};

export async function parsePhotoFiles(files: File[]): Promise<PhotoMeta[]> {
  const photos = await Promise.all(files.map(parsePhotoFile));
  return enrichPhotosWithRegeo(photos);
}

async function parsePhotoFile(file: File): Promise<PhotoMeta> {
  const previewUrl = URL.createObjectURL(file);
  let exif: ExifResult | undefined;

  try {
    exif = (await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
    })) as ExifResult | undefined;
  } catch {
    exif = undefined;
  }

  // 关键逻辑：EXIF 时间缺失时使用文件修改时间，保证照片仍可参与旅行草稿生成。
  const takenAt = normalizeDate(
    exif?.DateTimeOriginal ?? exif?.CreateDate ?? file.lastModified,
  );

  return {
    id: crypto.randomUUID(),
    fileName: file.name,
    previewUrl,
    dataUrl: await fileToDataUrl(file),
    takenAt,
    lat: normalizeNumber(exif?.latitude ?? exif?.GPSLatitude),
    lng: normalizeNumber(exif?.longitude ?? exif?.GPSLongitude),
    selected: true,
  };
}

export async function enrichPhotosWithRegeo(photos: PhotoMeta[]): Promise<PhotoMeta[]> {
  const points = collectUniqueRegeoPoints(photos);
  if (points.length === 0) {
    return photos;
  }

  try {
    const response = await fetch("/api/amap/regeo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ points }),
    });

    if (!response.ok && response.status !== 400) {
      return photos;
    }

    const payload = (await response.json()) as RegeoResponse;
    const resultById = new Map(payload.results.map((result) => [result.id, result]));

    return photos.map((photo) => {
      const directResult = resultById.get(photo.id);
      const matchedResult =
        directResult ??
        payload.results.find(
          (result) =>
            typeof photo.lat === "number" &&
            typeof photo.lng === "number" &&
            result.lat.toFixed(6) === photo.lat.toFixed(6) &&
            result.lng.toFixed(6) === photo.lng.toFixed(6),
        );

      if (!matchedResult || matchedResult.status !== "success") {
        return photo;
      }

      return {
        ...photo,
        geo: matchedResult,
        placeName: matchedResult.placeName,
        country: matchedResult.country,
      };
    });
  } catch {
    return photos;
  }
}

export function buildDraftFromPhotos(photos: PhotoMeta[]) {
  return buildTripDraft(photos);
}

function normalizeDate(value: Date | string | number): string {
  return new Date(value).toISOString();
}

function normalizeNumber(value?: number): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
