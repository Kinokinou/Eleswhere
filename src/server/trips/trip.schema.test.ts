import { describe, expect, it } from "vitest";
import { createTripSchema } from "./trip.schema";

const validRequest = {
  title: "珠海长隆 · 情侣路",
  startDate: "2026-05-03",
  endDate: "2026-05-04",
  coverClientPhotoId: "client-photo-1",
  tags: ["city walk"],
  moodTags: ["轻松"],
  photos: [
    {
      clientId: "client-photo-1",
      fileName: "stored.jpg",
      originalName: "IMG_001.jpg",
      storagePath: "D:/Eleswhere/.uploads/photos/2026/05/stored.jpg",
      publicUrl: "/uploads/photos/2026/05/stored.jpg",
      mimeType: "image/jpeg",
      fileSize: 2048,
      takenAt: "2026-05-03T10:00:00.000Z",
      lat: 22.104981,
      lng: 113.540123,
      placeName: "珠海长隆",
    },
  ],
  days: [
    {
      clientId: "day-1",
      dayIndex: 1,
      date: "2026-05-03",
      title: "第 1 天",
      photoIds: ["client-photo-1"],
      segments: [
        {
          clientId: "segment-1",
          title: "珠海长隆",
          placeName: "珠海长隆",
          startTime: "2026-05-03T10:00:00.000Z",
          endTime: "2026-05-03T11:00:00.000Z",
          photoIds: ["client-photo-1"],
        },
      ],
    },
  ],
  routePoints: [
    {
      clientId: "route-1",
      placeName: "珠海长隆",
      date: "2026-05-03",
      startTime: "2026-05-03T10:00:00.000Z",
      representativePhotoId: "client-photo-1",
      photoIds: ["client-photo-1"],
      order: 1,
    },
  ],
};

describe("createTripSchema", () => {
  it("接受完整旅行创建请求", () => {
    expect(createTripSchema.safeParse(validRequest).success).toBe(true);
  });

  it("拒绝没有照片的旅行", () => {
    expect(createTripSchema.safeParse({ ...validRequest, photos: [] }).success).toBe(false);
  });
});
