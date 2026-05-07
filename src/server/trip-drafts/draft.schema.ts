import { z } from "zod";
import {
  routePointInputSchema,
  tripDayInputSchema,
} from "@/server/trips/trip.schema";

const optionalNumber = z.number().finite().optional();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须是 YYYY-MM-DD");
const isoDateTime = z.string().datetime("时间必须是 ISO 字符串");

const geoSchema = z
  .object({
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
  })
  .optional();

export const draftPhotoMetaSchema = z.object({
  clientId: z.string().min(1),
  fileName: z.string().min(1),
  takenAt: isoDateTime,
  lat: optionalNumber,
  lng: optionalNumber,
  geo: geoSchema,
  placeName: z.string().optional(),
  country: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const createTripDraftSchema = z.object({
  title: z.string().min(1, "草稿标题不能为空"),
  subtitle: z.string().optional(),
  startDate: isoDate,
  endDate: isoDate,
  coverClientPhotoId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  moodTags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  photos: z.array(draftPhotoMetaSchema).min(1, "草稿至少需要一张照片"),
  days: z.array(tripDayInputSchema).default([]),
  routePoints: z.array(routePointInputSchema).default([]),
});

export const updateTripDraftSchema = createTripDraftSchema.partial().extend({
  photos: z.array(draftPhotoMetaSchema).optional(),
});

export type DraftPhotoMetaInput = z.infer<typeof draftPhotoMetaSchema>;
export type CreateTripDraftInput = z.infer<typeof createTripDraftSchema>;
export type UpdateTripDraftInput = z.infer<typeof updateTripDraftSchema>;
