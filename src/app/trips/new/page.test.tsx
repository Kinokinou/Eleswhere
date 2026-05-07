/* @vitest-environment jsdom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import NewTripPage from "./page";
import {
  saveTripDraftWithPhotos,
  startTripDraftBuild,
} from "@/lib/api-client";
import { buildDraftFromPhotos, parsePhotoFilesWithReport } from "@/lib/photos";

const routerPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPush,
  }),
}));

vi.mock("@/lib/photos", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/photos")>();
  return {
    ...actual,
    parsePhotoFilesWithReport: vi.fn(),
    buildDraftFromPhotos: vi.fn(actual.buildDraftFromPhotos),
  };
});

vi.mock("@/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-client")>();
  return {
    ...actual,
    saveTripDraftWithPhotos: vi.fn(),
    startTripDraftBuild: vi.fn(),
  };
});

const photo = {
  id: "photo-1",
  fileName: "IMG_001.jpg",
  previewUrl: "blob:image",
  takenAt: "2026-05-03T10:00:00.000Z",
  selected: true,
};

const draft = {
  id: "trip-draft",
  title: "测试旅行",
  startDate: "2026-05-03",
  endDate: "2026-05-03",
  coverPhotoId: "photo-1",
  tags: [],
  moodTags: [],
  photos: [photo],
  days: [],
  routePoints: [],
};

describe("NewTripPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("先保存草稿，保存成功后才允许开始构建", async () => {
    prepareParsedDraft();
    vi.mocked(saveTripDraftWithPhotos).mockResolvedValue({
      ...draft,
      id: "saved-draft",
    });

    render(<NewTripPage />);
    await selectFiles([makeFile("IMG_001.jpg", "image/jpeg")]);

    const initialBuildButton = await screen.findByRole("button", {
      name: "开始构建",
    });
    expect((initialBuildButton as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));

    await screen.findByText("草稿已保存，可以开始构建。");
    expect(saveTripDraftWithPhotos).toHaveBeenCalledTimes(1);
    expect(
      (screen.getByRole("button", { name: "开始构建" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
    expect(startTripDraftBuild).not.toHaveBeenCalled();
  });

  it("开始构建只调用任务接口，成功后跳转到 Trips", async () => {
    prepareParsedDraft();
    vi.mocked(saveTripDraftWithPhotos).mockResolvedValue({
      ...draft,
      id: "saved-draft",
    });
    vi.mocked(startTripDraftBuild).mockResolvedValue({
      id: "task-1",
      draftId: "saved-draft",
      tripId: "trip-building",
      status: "queued",
      totalPhotos: 1,
      processedPhotos: 0,
    });

    render(<NewTripPage />);
    await selectFiles([makeFile("IMG_001.jpg", "image/jpeg")]);

    fireEvent.click(await screen.findByRole("button", { name: "保存草稿" }));
    await screen.findByText("草稿已保存，可以开始构建。");
    fireEvent.click(screen.getByRole("button", { name: "开始构建" }));

    await waitFor(() => {
      expect(startTripDraftBuild).toHaveBeenCalledWith("saved-draft");
      expect(routerPush).toHaveBeenCalledWith("/trips");
    });
  });

  it("连续点击开始构建时只触发一次任务启动", async () => {
    prepareParsedDraft();
    vi.mocked(saveTripDraftWithPhotos).mockResolvedValue({
      ...draft,
      id: "saved-draft",
    });
    vi.mocked(startTripDraftBuild).mockImplementation(
      () =>
        new Promise((resolve) =>
          window.setTimeout(
            () =>
              resolve({
                id: "task-1",
                draftId: "saved-draft",
                tripId: "trip-building",
                status: "queued",
                totalPhotos: 1,
                processedPhotos: 0,
              }),
            20,
          ),
        ),
    );

    render(<NewTripPage />);
    await selectFiles([makeFile("IMG_001.jpg", "image/jpeg")]);

    fireEvent.click(await screen.findByRole("button", { name: "保存草稿" }));
    await screen.findByText("草稿已保存，可以开始构建。");

    const button = screen.getByRole("button", { name: "开始构建" });
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getAllByText("正在启动构建...").length).toBeGreaterThan(0);
    });
    await waitFor(() => {
      expect(startTripDraftBuild).toHaveBeenCalledTimes(1);
    });
  });

  it("保存失败后恢复按钮且保留草稿", async () => {
    prepareParsedDraft();
    vi.mocked(saveTripDraftWithPhotos).mockRejectedValue(new Error("保存失败"));

    render(<NewTripPage />);
    await selectFiles([makeFile("IMG_001.jpg", "image/jpeg")]);

    fireEvent.click(await screen.findByRole("button", { name: "保存草稿" }));

    expect(await screen.findByText("保存失败")).not.toBeNull();
    expect(
      (screen.getByRole("button", {
        name: "保存草稿",
      }) as HTMLButtonElement).disabled,
    ).toBe(false);
    expect(screen.getByDisplayValue("测试旅行")).not.toBeNull();
  });

  it("选择视频和不支持文件时跳过，不生成草稿", async () => {
    render(<NewTripPage />);
    await selectFiles([
      makeFile("movie.mp4", "video/mp4"),
      makeFile("bad.gif", "image/gif"),
    ]);

    expect(parsePhotoFilesWithReport).not.toHaveBeenCalled();
    expect(await screen.findByText(/已跳过 1 个视频文件/)).not.toBeNull();
    expect(screen.getByText(/已跳过 1 个暂不支持的文件/)).not.toBeNull();
    expect(screen.getByText("等待照片生成旅行草稿")).not.toBeNull();
  });
});

function prepareParsedDraft() {
  vi.mocked(parsePhotoFilesWithReport).mockResolvedValue({
    photos: [photo],
    degradedCount: 0,
  });
  vi.mocked(buildDraftFromPhotos).mockReturnValue(draft);
}

async function selectFiles(files: File[]) {
  const input = document.querySelector("input[type='file']");
  if (!input) {
    throw new Error("没有找到文件输入框");
  }

  fireEvent.change(input, {
    target: { files },
  });
}

function makeFile(name: string, type: string) {
  return new File([new Uint8Array([1, 2, 3])], name, {
    type,
    lastModified: Date.parse("2026-05-03T10:00:00.000Z"),
  });
}
