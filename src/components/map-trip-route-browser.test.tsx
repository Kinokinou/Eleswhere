/* @vitest-environment jsdom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapTripRouteBrowser } from "./map-trip-route-browser";
import type { TripDraft } from "@/lib/trips";

const macauTrip = makeTrip({
  id: "trip-macau",
  title: "澳门周末",
  pointName: "大三巴",
  photoName: "macau.jpg",
});

const zhuhaiTrip = makeTrip({
  id: "trip-zhuhai",
  title: "珠海长隆",
  pointName: "企鹅馆",
  photoName: "zhuhai.jpg",
});

describe("MapTripRouteBrowser", () => {
  afterEach(() => {
    cleanup();
  });

  it("默认选中第一条旅行，并展示第一个路线点的照片墙", async () => {
    render(
      <MapTripRouteBrowser
        trips={[macauTrip, zhuhaiTrip]}
        loadTripDetail={async () => macauTrip}
      />,
    );

    expect(await screen.findByRole("heading", { name: "大三巴" })).not.toBeNull();
    expect(screen.getByAltText("macau.jpg")).not.toBeNull();
    expect(screen.getByAltText("澳门周末 封面")).not.toBeNull();
  });

  it("点击 Trip 卡片后切换地图路线和照片墙", async () => {
    const loadTripDetail = vi.fn(async (tripId: string) =>
      tripId === "trip-zhuhai" ? zhuhaiTrip : macauTrip,
    );

    render(
      <MapTripRouteBrowser
        trips={[macauTrip, zhuhaiTrip]}
        loadTripDetail={loadTripDetail}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: /珠海长隆/ }));

    expect(await screen.findByRole("heading", { name: "企鹅馆" })).not.toBeNull();
    expect(screen.getByAltText("zhuhai.jpg")).not.toBeNull();
    expect(loadTripDetail).toHaveBeenCalledWith("trip-zhuhai");
  });

  it("点击地图占位点后切换当前点照片墙", async () => {
    const twoPointTrip: TripDraft = {
      ...macauTrip,
      routePoints: [
        macauTrip.routePoints[0],
        {
          id: "point-taipa",
          placeName: "氹仔",
          lat: 22.15,
          lng: 113.56,
          date: "2026-05-04",
          startTime: "2026-05-04T13:00:00.000Z",
          photoIds: ["photo-taipa"],
          order: 2,
        },
      ],
      photos: [
        ...macauTrip.photos,
        {
          id: "photo-taipa",
          fileName: "taipa.jpg",
          previewUrl: "/uploads/taipa.jpg",
          takenAt: "2026-05-04T13:00:00.000Z",
          selected: true,
        },
      ],
    };

    render(
      <MapTripRouteBrowser
        trips={[twoPointTrip]}
        loadTripDetail={async () => twoPointTrip}
      />,
    );

    const mapRegion = await screen.findByLabelText("旅行路线地图");
    fireEvent.click(within(mapRegion).getByRole("button", { name: /氹仔/ }));

    expect(await screen.findByRole("heading", { name: "氹仔" })).not.toBeNull();
    await waitFor(() => {
      expect(screen.getByAltText("taipa.jpg")).not.toBeNull();
    });
  });
});

function makeTrip({
  id,
  title,
  pointName,
  photoName,
}: {
  id: string;
  title: string;
  pointName: string;
  photoName: string;
}): TripDraft {
  return {
    id,
    title,
    startDate: "2026-05-04",
    endDate: "2026-05-04",
    tags: [],
    moodTags: [],
    photos: [
      {
        id: `${id}-photo`,
        fileName: photoName,
        previewUrl: `/uploads/${photoName}`,
        takenAt: "2026-05-04T10:00:00.000Z",
        selected: true,
      },
    ],
    days: [],
    routePoints: [
      {
        id: `${id}-point`,
        placeName: pointName,
        lat: 22.19,
        lng: 113.54,
        date: "2026-05-04",
        startTime: "2026-05-04T10:00:00.000Z",
        photoIds: [`${id}-photo`],
        order: 1,
      },
    ],
  };
}
