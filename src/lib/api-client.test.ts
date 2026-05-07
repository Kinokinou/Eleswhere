import { describe, expect, it } from "vitest";
import { buildCreateTripRequest } from "./api-client";
import type { TripDraft } from "./trips";

const draft: TripDraft = {
  id: "trip-client",
  title: "珠海长隆",
  startDate: "2026-05-03",
  endDate: "2026-05-03",
  coverPhotoId: "photo-client",
  tags: [],
  moodTags: [],
  photos: [
    {
      id: "photo-client",
      fileName: "IMG.jpg",
      previewUrl: "blob:image",
      takenAt: "2026-05-03T10:00:00.000Z",
      placeName: "珠海长隆",
      selected: true,
    },
  ],
  days: [
    {
      id: "day-client",
      dayIndex: 1,
      date: "2026-05-03",
      title: "第 1 天",
      photoIds: ["photo-client"],
      segments: [
        {
          id: "segment-client",
          dayId: "day-client",
          title: "珠海长隆",
          placeName: "珠海长隆",
          startTime: "2026-05-03T10:00:00.000Z",
          endTime: "2026-05-03T11:00:00.000Z",
          photoIds: ["photo-client"],
        },
      ],
    },
  ],
  routePoints: [
    {
      id: "route-client",
      placeName: "珠海长隆",
      date: "2026-05-03",
      startTime: "2026-05-03T10:00:00.000Z",
      photoIds: ["photo-client"],
      representativePhotoId: "photo-client",
      order: 1,
    },
  ],
};

describe("buildCreateTripRequest", () => {
  it("用上传结果替换前端照片引用，生成后端创建旅行请求", () => {
    const request = buildCreateTripRequest(draft, [
      {
        clientId: "photo-client",
        fileName: "stored.jpg",
        originalName: "IMG.jpg",
        storagePath: "D:/Eleswhere/.uploads/photos/2026/05/stored.jpg",
        publicUrl: "/uploads/photos/2026/05/stored.jpg",
        mimeType: "image/jpeg",
        fileSize: 2048,
      },
    ]);

    expect(request.coverClientPhotoId).toBe("photo-client");
    expect(request.photos[0]).toMatchObject({
      clientId: "photo-client",
      fileName: "stored.jpg",
      takenAt: "2026-05-03T10:00:00.000Z",
      placeName: "珠海长隆",
    });
    expect(request.days[0].segments[0].photoIds).toEqual(["photo-client"]);
  });
});
