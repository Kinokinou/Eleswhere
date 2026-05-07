import { describe, expect, it } from "vitest";
import { prepareTripForStorage } from "./storage";
import type { TripDraft } from "./trips";

const baseTrip: TripDraft = {
  id: "trip-1",
  title: "测试旅行",
  startDate: "2026-05-03",
  endDate: "2026-05-03",
  coverPhotoId: "photo-1",
  tags: [],
  moodTags: [],
  photos: [
    {
      id: "photo-1",
      fileName: "large.jpg",
      previewUrl: "blob:http://localhost/large",
      dataUrl: `data:image/jpeg;base64,${"a".repeat(300_000)}`,
      takenAt: "2026-05-03T10:00:00.000Z",
      selected: true,
    },
  ],
  days: [],
  routePoints: [],
};

describe("prepareTripForStorage", () => {
  it("存储前移除过大的照片 dataUrl，避免 localStorage 超额", () => {
    const prepared = prepareTripForStorage(baseTrip);

    expect(prepared.photos[0].dataUrl).toBeUndefined();
    expect(JSON.stringify(prepared)).not.toContain("aaaaa");
  });
});
