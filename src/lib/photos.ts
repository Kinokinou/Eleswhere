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

const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024;
const allowedImportMimeTypes = new Set(["image/jpeg", "image/png"]);

export type ImportFileFilterResult = {
  acceptedFiles: File[];
  skippedVideos: number;
  skippedUnsupported: number;
  skippedOversized: number;
};

export type ParsedPhotoFileResult = {
  photos: PhotoMeta[];
  degradedCount: number;
};

export function filterImportFiles(files: File[]): ImportFileFilterResult {
  const result: ImportFileFilterResult = {
    acceptedFiles: [],
    skippedVideos: 0,
    skippedUnsupported: 0,
    skippedOversized: 0,
  };

  for (const file of files) {
    if (file.type.startsWith("video/")) {
      result.skippedVideos += 1;
      continue;
    }

    if (!allowedImportMimeTypes.has(file.type)) {
      result.skippedUnsupported += 1;
      continue;
    }

    if (file.size > MAX_IMPORT_FILE_SIZE) {
      result.skippedOversized += 1;
      continue;
    }

    result.acceptedFiles.push(file);
  }

  return result;
}

export async function parsePhotoFiles(files: File[]): Promise<PhotoMeta[]> {
  const result = await parsePhotoFilesWithReport(files);
  return result.photos;
}

export async function parsePhotoFilesWithReport(
  files: File[],
): Promise<ParsedPhotoFileResult> {
  const photos: PhotoMeta[] = [];
  let degradedCount = 0;

  for (const file of files) {
    const previousPhoto = photos.at(-1);
    const parsed = await parsePhotoFile(file, previousPhoto);
    photos.push(parsed.photo);
    if (parsed.degraded) {
      degradedCount += 1;
    }
  }

  return {
    photos: await enrichPhotosWithRegeo(photos),
    degradedCount,
  };
}

async function parsePhotoFile(
  file: File,
  previousPhoto?: PhotoMeta,
): Promise<{ photo: PhotoMeta; degraded: boolean }> {
  const previewUrl = createPreviewUrl(file);
  let exif: ExifResult | undefined;
  let dataUrl: string | undefined;
  let degraded = false;

  try {
    exif = (await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
    })) as ExifResult | undefined;
  } catch {
    exif = undefined;
  }

  try {
    dataUrl = await fileToDataUrl(file);
  } catch {
    degraded = true;
  }

  // 关键逻辑：EXIF 时间缺失时使用文件修改时间，保证照片仍可参与旅行草稿生成。
  const takenAt = normalizeDate(
    exif?.DateTimeOriginal ??
      exif?.CreateDate ??
      (degraded ? previousPhoto?.takenAt : undefined) ??
      file.lastModified,
  );
  const lat = normalizeNumber(exif?.latitude ?? exif?.GPSLatitude);
  const lng = normalizeNumber(exif?.longitude ?? exif?.GPSLongitude);

  return {
    photo: {
      id: crypto.randomUUID(),
      fileName: file.name,
      previewUrl,
      dataUrl,
      takenAt,
      lat: lat ?? (degraded ? previousPhoto?.lat : undefined),
      lng: lng ?? (degraded ? previousPhoto?.lng : undefined),
      geo: degraded ? previousPhoto?.geo : undefined,
      placeName: degraded ? previousPhoto?.placeName : undefined,
      country: degraded ? previousPhoto?.country : undefined,
      selected: true,
    },
    degraded,
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

function createPreviewUrl(file: File) {
  if (typeof URL.createObjectURL === "function") {
    return URL.createObjectURL(file);
  }

  return "";
}
