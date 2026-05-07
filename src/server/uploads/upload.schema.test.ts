import { describe, expect, it } from "vitest";
import { validateUploadFileMeta } from "./upload.schema";

describe("validateUploadFileMeta", () => {
  it("允许 jpg 和 png，且限制单文件最大 10MB", () => {
    expect(
      validateUploadFileMeta({
        name: "IMG_001.jpg",
        type: "image/jpeg",
        size: 1024,
      }).success,
    ).toBe(true);

    expect(
      validateUploadFileMeta({
        name: "large.jpg",
        type: "image/jpeg",
        size: 11 * 1024 * 1024,
      }).success,
    ).toBe(false);

    expect(
      validateUploadFileMeta({
        name: "bad.gif",
        type: "image/gif",
        size: 1024,
      }).success,
    ).toBe(false);
  });
});
