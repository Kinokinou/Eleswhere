import { describe, expect, it } from "vitest";
import { createTripDraftSchema } from "./draft.schema";

describe("createTripDraftSchema", () => {
  it("要求草稿至少包含一张照片，避免空任务进入构建队列", () => {
    const parsed = createTripDraftSchema.safeParse({
      title: "珠海长隆",
      startDate: "2026-05-03",
      endDate: "2026-05-03",
      tags: [],
      moodTags: [],
      photos: [],
      days: [],
      routePoints: [],
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe("草稿至少需要一张照片");
  });
});
