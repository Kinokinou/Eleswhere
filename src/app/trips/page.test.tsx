/* @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TripsPage from "./page";
import { deleteTrip } from "@/lib/api-client";
import { useStoredTrips } from "@/lib/hooks";
import type { TripDraft } from "@/lib/trips";

vi.mock("@/lib/hooks", () => ({
  useStoredTrips: vi.fn(),
}));

vi.mock("@/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-client")>();
  return {
    ...actual,
    deleteTrip: vi.fn(),
  };
});

const trip: TripDraft = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "珠海长隆",
  startDate: "2026-05-03",
  endDate: "2026-05-03",
  tags: [],
  moodTags: [],
  photos: [],
  days: [],
  routePoints: [],
};

describe("TripsPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("旅行卡片右下角菜单包含占位操作和删除操作", () => {
    vi.mocked(useStoredTrips).mockReturnValue([trip]);

    render(<TripsPage />);
    fireEvent.click(screen.getByRole("button", { name: "打开旅行操作菜单" }));

    expect(screen.getByRole("menuitem", { name: "编辑（暂未实现）" })).not.toBeNull();
    expect(screen.getByRole("menuitem", { name: "分享（暂未实现）" })).not.toBeNull();
    expect(screen.getByRole("menuitem", { name: "删除旅行" })).not.toBeNull();
  });

  it("删除旅行需要弹窗二次确认，确认后调用删除接口并移除卡片", async () => {
    vi.mocked(useStoredTrips).mockReturnValue([trip]);
    vi.mocked(deleteTrip).mockResolvedValue({ success: true });

    render(<TripsPage />);
    fireEvent.click(screen.getByRole("button", { name: "打开旅行操作菜单" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "删除旅行" }));

    expect(screen.getByRole("dialog", { name: "确认删除旅行" })).not.toBeNull();
    expect(deleteTrip).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "确认删除" }));

    await waitFor(() => {
      expect(deleteTrip).toHaveBeenCalledWith(trip.id);
    });
    await waitFor(() => {
      expect(screen.queryByText("珠海长隆")).toBeNull();
    });
  });
});
