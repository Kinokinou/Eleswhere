import { z } from "zod";

const optionalNumber = z.number().finite().optional();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须是 YYYY-MM-DD");
const isoDateTime = z.string().datetime("时间必须是 ISO 字符串");

const geoSchema = z.object({
  formattedAddress: z.string().optional(),
  country: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  township: z.string().optional(),
  adcode: z.string().optional(),
  poiName: z.string().optional(),
  aoiName: z.string().optional(),
  placeName: z.string().optional(),
}).optional();

export const uploadedPhotoInputSchema = z.object({
  clientId: z.string().min(1),
  fileName: z.string().min(1),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive(),
  storagePath: z.string().min(1),
  publicUrl: z.string().min(1),
  takenAt: isoDateTime,
  lat: optionalNumber,
  lng: optionalNumber,
  geo: geoSchema,
  placeName: z.string().optional(),
  country: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const tripSegmentInputSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().min(1),
  placeName: z.string().optional(),
  lat: optionalNumber,
  lng: optionalNumber,
  startTime: isoDateTime,
  endTime: isoDateTime,
  photoIds: z.array(z.string().min(1)).default([]),
});

export const tripDayInputSchema = z.object({
  clientId: z.string().min(1),
  dayIndex: z.number().int().positive(),
  date: isoDate,
  title: z.string().min(1),
  photoIds: z.array(z.string().min(1)).default([]),
  segments: z.array(tripSegmentInputSchema).default([]),
});

export const routePointInputSchema = z.object({
  clientId: z.string().min(1),
  placeName: z.string().min(1),
  lat: optionalNumber,
  lng: optionalNumber,
  date: isoDate,
  startTime: isoDateTime,
  representativePhotoId: z.string().optional(),
  photoIds: z.array(z.string().min(1)).default([]),
  order: z.number().int().positive(),
});

export const createTripSchema = z.object({
  title: z.string().min(1, "旅行标题不能为空"),
  subtitle: z.string().optional(),
  startDate: isoDate,
  endDate: isoDate,
  coverClientPhotoId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  moodTags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  photos: z.array(uploadedPhotoInputSchema).min(1, "至少需要一张照片"),
  days: z.array(tripDayInputSchema).default([]),
  routePoints: z.array(routePointInputSchema).default([]),
});

export const updateTripSchema = z.object({
  title: z.string().min(1).optional(),
  subtitle: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  moodTags: z.array(z.string()).optional(),
  coverPhotoId: z.string().uuid().optional(),
  days: z.array(z.object({
    id: z.string().uuid(),
    title: z.string().min(1),
  })).optional(),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
