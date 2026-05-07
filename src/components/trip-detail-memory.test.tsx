/* @vitest-environment jsdom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TripDetailCalendar } from "./trip-detail-calendar";
import {
  buildTripSegmentPhotoBlocks,
  TripMemoryPhotoWall,
} from "./trip-memory-photo-wall";
import type { TripDraft } from "@/lib/trips";

const trip: TripDraft = {
  id: "trip-detail",
  title: "珠海长隆",
  startDate: "2026-05-03",
  endDate: "2026-05-05",
  tags: [],
  moodTags: [],
  photos: [
    {
      id: "photo-late",
      fileName: "late.jpg",
      previewUrl: "/uploads/late.jpg",
      takenAt: "2026-05-03T12:00:00.000Z",
      selected: true,
    },
    {
      id: "photo-early",
      fileName: "early.jpg",
      previewUrl: "/uploads/early.jpg",
      takenAt: "2026-05-03T10:00:00.000Z",
      selected: true,
    },
  ],
  days: [
    {
      id: "day-1",
      dayIndex: 1,
      date: "2026-05-03",
      title: "第 1 天",
      photoIds: ["photo-late", "photo-early"],
      segments: [
        {
          id: "segment-1",
          dayId: "day-1",
          title: "珠海长隆",
          placeName: "珠海长隆",
          startTime: "2026-05-03T10:00:00.000Z",
          endTime: "2026-05-03T12:00:00.000Z",
          photoIds: ["photo-late", "missing-photo", "photo-early"],
        },
      ],
    },
  ],
  routePoints: [],
};

describe("Trip Detail memory components", () => {
  afterEach(() => {
    cleanup();
  });

  it("按 TripSegment 生成照片墙块，标题包含 day-time-location，照片按时间排序", () => {
    const blocks = buildTripSegmentPhotoBlocks(trip);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].title).toBe("第 1 天 · 10:00-12:00 · 珠海长隆");
    expect(blocks[0].photos.map((photo) => photo.id)).toEqual([
      "photo-early",
      "photo-late",
    ]);
  });

  it("日历高亮旅行日期范围和有照片日期", () => {
    render(<TripDetailCalendar trip={trip} />);

    expect(screen.getByText("2026年5月")).not.toBeNull();
    expect(screen.getByLabelText("2026-05-03，旅行日期，有照片")).not.toBeNull();
    expect(screen.getByLabelText("2026-05-04，旅行日期")).not.toBeNull();
  });

  it("详情页照片墙支持缩略图放大和左右切换，并显示 AI 回忆占位", () => {
    render(<TripMemoryPhotoWall trip={trip} />);

    expect(screen.getByText("AI 旅行回忆将在这里生成。")).not.toBeNull();

    const block = screen.getByLabelText("第 1 天 · 10:00-12:00 · 珠海长隆 照片墙");
    fireEvent.click(within(block).getByRole("button", { name: "查看照片 early.jpg" }));

    const dialog = screen.getByRole("dialog", { name: "照片预览" });
    expect(within(dialog).getByAltText("early.jpg")).not.toBeNull();

    fireEvent.click(within(dialog).getByRole("button", { name: "下一张" }));
    expect(within(dialog).getByAltText("late.jpg")).not.toBeNull();
  });
});
