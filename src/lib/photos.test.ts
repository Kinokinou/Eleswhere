import { afterEach, describe, expect, it, vi } from "vitest";
import {
  filterImportFiles,
  parsePhotoFilesWithReport,
} from "./photos";

vi.mock("exifr", () => ({
  parse: vi.fn(),
}));

describe("filterImportFiles", () => {
  it("只允许 JPG/PNG，跳过视频、不支持格式和超过 10MB 图片", () => {
    const result = filterImportFiles([
      makeFile("ok.jpg", "image/jpeg", 1024),
      makeFile("ok.png", "image/png", 1024),
      makeFile("movie.mp4", "video/mp4", 1024),
      makeFile("bad.gif", "image/gif", 1024),
      makeFile("large.jpg", "image/jpeg", 11 * 1024 * 1024),
    ]);

    expect(result.acceptedFiles.map((file) => file.name)).toEqual([
      "ok.jpg",
      "ok.png",
    ]);
    expect(result.skippedVideos).toBe(1);
    expect(result.skippedUnsupported).toBe(1);
    expect(result.skippedOversized).toBe(1);
  });
});

describe("parsePhotoFilesWithReport", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("dataURL 读取失败时不让整批失败，并继承上一张照片的时间和地点", async () => {
    const { parse } = await import("exifr");
    vi.mocked(parse)
      .mockResolvedValueOnce({
        DateTimeOriginal: new Date("2026-05-03T10:00:00.000Z"),
        latitude: 22.1,
        longitude: 113.5,
      })
      .mockResolvedValueOnce(undefined);

    const originalFileReader = globalThis.FileReader;
    class FailingSecondFileReader {
      static reads = 0;
      result: string | ArrayBuffer | null = null;
      error: DOMException | null = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      readAsDataURL() {
        FailingSecondFileReader.reads += 1;
        if (FailingSecondFileReader.reads === 1) {
          this.result = "data:image/jpeg;base64,ok";
          this.onload?.();
          return;
        }

        this.error = new DOMException("broken");
        this.onerror?.();
      }
    }
    vi.stubGlobal("FileReader", FailingSecondFileReader);

    const result = await parsePhotoFilesWithReport([
      makeFile("first.jpg", "image/jpeg", 1024, 1),
      makeFile("broken.jpg", "image/jpeg", 1024, 2),
    ]);

    expect(result.degradedCount).toBe(1);
    expect(result.photos).toHaveLength(2);
    expect(result.photos[1]).toMatchObject({
      fileName: "broken.jpg",
      takenAt: result.photos[0].takenAt,
      lat: result.photos[0].lat,
      lng: result.photos[0].lng,
    });
    expect(result.photos[1].dataUrl).toBeUndefined();

    vi.stubGlobal("FileReader", originalFileReader);
  });

  it("没有上一张可继承时，失败图片使用文件修改时间和未知地点", async () => {
    const { parse } = await import("exifr");
    vi.mocked(parse).mockResolvedValueOnce(undefined);

    class AlwaysFailingFileReader {
      result: string | ArrayBuffer | null = null;
      error: DOMException | null = new DOMException("broken");
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      readAsDataURL() {
        this.onerror?.();
      }
    }
    vi.stubGlobal("FileReader", AlwaysFailingFileReader);

    const file = makeFile("broken.jpg", "image/jpeg", 1024, 1_777_777_777);
    const result = await parsePhotoFilesWithReport([file]);

    expect(result.degradedCount).toBe(1);
    expect(result.photos[0]).toMatchObject({
      fileName: "broken.jpg",
      takenAt: new Date(file.lastModified).toISOString(),
      lat: undefined,
      lng: undefined,
    });
  });
});

function makeFile(
  name: string,
  type: string,
  size: number,
  lastModified = Date.now(),
) {
  return new File([new Uint8Array(size)], name, { type, lastModified });
}
