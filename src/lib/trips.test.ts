import { describe, expect, it } from "vitest";
import {
  buildTripDraft,
  collectUniqueRegeoPoints,
  pickPlaceName,
  type PhotoMeta,
} from "./trips";

const photo = (override: Partial<PhotoMeta>): PhotoMeta => ({
  id: override.id ?? "photo-1",
  fileName: override.fileName ?? "photo.jpg",
  previewUrl: override.previewUrl ?? "blob:photo",
  takenAt: override.takenAt ?? "2026-05-03T10:00:00.000Z",
  selected: override.selected ?? true,
  ...override,
});

describe("pickPlaceName", () => {
  it("按 aoi、poi、行政区、详细地址的顺序选择地点名称", () => {
    expect(
      pickPlaceName({
        formattedAddress: "广东省珠海市香洲区某路",
        district: "香洲区",
        poiName: "珠海长隆海洋王国",
        aoiName: "横琴长隆国际海洋度假区",
      }),
    ).toBe("横琴长隆国际海洋度假区");
  });
});

describe("collectUniqueRegeoPoints", () => {
  it("只收集有 GPS 的照片，并按 6 位小数去重坐标", () => {
    const points = collectUniqueRegeoPoints([
      photo({ id: "a", lat: 22.10498123, lng: 113.5401234 }),
      photo({ id: "b", lat: 22.10498121, lng: 113.54012349 }),
      photo({ id: "c" }),
    ]);

    expect(points).toEqual([{ id: "a", lat: 22.104981, lng: 113.540123 }]);
  });
});

describe("buildTripDraft", () => {
  it("按天分组，并在无地点时按超过 2 小时拆分段落", () => {
    const draft = buildTripDraft([
      photo({ id: "a", takenAt: "2026-05-03T01:00:00.000Z" }),
      photo({ id: "b", takenAt: "2026-05-03T02:00:00.000Z" }),
      photo({ id: "c", takenAt: "2026-05-03T05:30:00.000Z" }),
      photo({ id: "d", takenAt: "2026-05-04T01:00:00.000Z" }),
    ]);

    expect(draft.days).toHaveLength(2);
    expect(draft.days[0].segments.map((segment) => segment.photoIds)).toEqual([
      ["a", "b"],
      ["c"],
    ]);
    expect(draft.days[1].dayIndex).toBe(2);
  });

  it("优先按地点变化生成段落和去重后的路线点", () => {
    const draft = buildTripDraft([
      photo({
        id: "a",
        takenAt: "2026-05-03T01:00:00.000Z",
        lat: 22.104981,
        lng: 113.540123,
        placeName: "珠海长隆",
      }),
      photo({
        id: "b",
        takenAt: "2026-05-03T02:00:00.000Z",
        lat: 22.104982,
        lng: 113.540124,
        placeName: "珠海长隆",
      }),
      photo({
        id: "c",
        takenAt: "2026-05-03T03:00:00.000Z",
        lat: 22.2711,
        lng: 113.5767,
        placeName: "情侣路",
      }),
    ]);

    expect(draft.days[0].segments.map((segment) => segment.placeName)).toEqual([
      "珠海长隆",
      "情侣路",
    ]);
    expect(draft.routePoints.map((point) => point.placeName)).toEqual([
      "珠海长隆",
      "情侣路",
    ]);
    expect(draft.title).toBe("珠海长隆 · 情侣路");
  });
});
