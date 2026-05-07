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
  createTripFromDraft,
  uploadPhotos,
} from "@/lib/api-client";
import { buildDraftFromPhotos, parsePhotoFilesWithReport } from "@/lib/photos";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
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
    uploadPhotos: vi.fn(),
    createTripFromDraft: vi.fn(),
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

  it("连续点击创建旅行时只触发一次上传和创建", async () => {
    vi.mocked(parsePhotoFilesWithReport).mockResolvedValue({
      photos: [photo],
      degradedCount: 0,
    });
    vi.mocked(buildDraftFromPhotos).mockReturnValue(draft);
    vi.mocked(uploadPhotos).mockImplementation(
      () =>
        new Promise((resolve) =>
          window.setTimeout(
            () =>
              resolve([
                {
                  clientId: "photo-1",
                  fileName: "stored.jpg",
                  originalName: "IMG_001.jpg",
                  storagePath: "D:/Eleswhere/.uploads/stored.jpg",
                  publicUrl: "/uploads/stored.jpg",
                  mimeType: "image/jpeg",
                  fileSize: 1024,
                },
              ]),
            20,
          ),
        ),
    );
    vi.mocked(createTripFromDraft).mockResolvedValue({
      ...draft,
      id: "trip-created",
    });

    render(<NewTripPage />);
    await selectFiles([makeFile("IMG_001.jpg", "image/jpeg")]);

    const button = await screen.findByRole("button", { name: "创建旅行" });
    fireEvent.click(button);
    fireEvent.click(button);

    await screen.findByText("正在创建...");
    await waitFor(() => {
      expect(uploadPhotos).toHaveBeenCalledTimes(1);
      expect(createTripFromDraft).toHaveBeenCalledTimes(1);
    });
  });

  it("创建失败后恢复按钮且保留草稿", async () => {
    vi.mocked(parsePhotoFilesWithReport).mockResolvedValue({
      photos: [photo],
      degradedCount: 0,
    });
    vi.mocked(buildDraftFromPhotos).mockReturnValue(draft);
    vi.mocked(uploadPhotos).mockRejectedValue(new Error("上传失败"));

    render(<NewTripPage />);
    await selectFiles([makeFile("IMG_001.jpg", "image/jpeg")]);

    fireEvent.click(await screen.findByRole("button", { name: "创建旅行" }));

    expect(await screen.findByText("上传失败")).not.toBeNull();
    expect(
      (screen.getByRole("button", {
        name: "创建旅行",
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
