/* @vitest-environment jsdom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useStoredTrips } from "./hooks";
import { fetchTrips } from "./api-client";
import type { TripDraft } from "./trips";

vi.mock("./api-client", () => ({
  fetchTrips: vi.fn(),
}));

const trip: TripDraft = {
  id: "trip-cache",
  title: "缓存旅行",
  startDate: "2026-05-03",
  endDate: "2026-05-03",
  tags: [],
  moodTags: [],
  photos: [],
  days: [],
  routePoints: [],
};

describe("useStoredTrips", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("接口短暂失败时保留最近一次成功加载的旅行数据", async () => {
    vi.mocked(fetchTrips).mockResolvedValueOnce([trip]);
    const firstRender = render(<TripCount />);

    await screen.findByText("缓存旅行");
    firstRender.unmount();

    vi.mocked(fetchTrips).mockRejectedValueOnce(new Error("network"));
    render(<TripCount />);

    await waitFor(() => {
      expect(screen.getByText("缓存旅行")).not.toBeNull();
    });
  });
});

function TripCount() {
  const trips = useStoredTrips();

  return <div>{trips[0]?.title ?? "没有旅行"}</div>;
}
