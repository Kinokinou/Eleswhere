/* @vitest-environment jsdom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  getInitialRoutePointId,
  getRoutePointPhotos,
  TripRouteExplorer,
} from "./trip-route-explorer";
import type { PhotoMeta, RoutePoint } from "@/lib/trips";

const photos: PhotoMeta[] = [
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
  {
    id: "photo-next",
    fileName: "next.jpg",
    previewUrl: "/uploads/next.jpg",
    takenAt: "2026-05-03T13:00:00.000Z",
    selected: true,
  },
];

const points: RoutePoint[] = [
  {
    id: "point-without-coords",
    placeName: "无坐标地点",
    date: "2026-05-03",
    startTime: "2026-05-03T09:00:00.000Z",
    photoIds: ["photo-next"],
    order: 1,
  },
  {
    id: "point-with-coords",
    placeName: "珠海长隆",
    lat: 22.1,
    lng: 113.5,
    date: "2026-05-03",
    startTime: "2026-05-03T10:00:00.000Z",
    photoIds: ["missing-photo", "photo-late", "photo-early"],
    order: 2,
  },
];

describe("TripRouteExplorer", () => {
  afterEach(() => {
    cleanup();
  });

  it("默认选中第一个有坐标的路线点", () => {
    expect(getInitialRoutePointId(points)).toBe("point-with-coords");
    expect(getInitialRoutePointId([points[0]])).toBe("point-without-coords");
  });

  it("按路线点关联照片并按拍摄时间升序返回，缺失 id 会被忽略", () => {
    expect(getRoutePointPhotos(points[1], photos).map((photo) => photo.id)).toEqual([
      "photo-early",
      "photo-late",
    ]);
  });

  it("点击路线点后同步切换地点信息和照片墙", () => {
    render(<TripRouteExplorer points={points} photos={photos} />);

    expect(screen.getByRole("heading", { name: "珠海长隆" })).not.toBeNull();

    fireEvent.click(screen.getAllByRole("button", { name: /无坐标地点/ })[0]);

    expect(screen.getByRole("heading", { name: "无坐标地点" })).not.toBeNull();
    expect(screen.getByAltText("next.jpg")).not.toBeNull();
    expect(screen.queryByAltText("early.jpg")).toBeNull();
  });

  it("点击缩略图后放大图片，并用左右按钮切换上下张", () => {
    render(<TripRouteExplorer points={points} photos={photos} />);

    const photoWall = screen.getByLabelText("当前地点照片墙");
    const thumbnails = within(photoWall).getAllByRole("button");
    fireEvent.click(thumbnails[0]);

    const dialog = screen.getByRole("dialog", { name: "照片预览" });
    expect(within(dialog).getByAltText("early.jpg")).not.toBeNull();

    fireEvent.click(within(dialog).getByRole("button", { name: "下一张" }));
    expect(within(dialog).getByAltText("late.jpg")).not.toBeNull();

    fireEvent.click(within(dialog).getByRole("button", { name: "上一张" }));
    expect(within(dialog).getByAltText("early.jpg")).not.toBeNull();
  });
});
