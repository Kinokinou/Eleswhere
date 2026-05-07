import { describe, expect, it } from "vitest";
import { BUILD_BATCH_SIZE, MAX_BATCH_ATTEMPTS, splitIntoBuildBatches } from "./trip-build.batch";

describe("trip-build.service", () => {
  it("按每批 20 张照片拆分 500 张照片", () => {
    const photoIds = Array.from({ length: 500 }, (_, index) => `photo-${index + 1}`);

    const batches = splitIntoBuildBatches(photoIds);

    expect(BUILD_BATCH_SIZE).toBe(20);
    expect(batches).toHaveLength(25);
    expect(batches[0]).toEqual(photoIds.slice(0, 20));
    expect(batches.at(-1)).toEqual(photoIds.slice(480, 500));
  });

  it("同一批失败 5 次后应判定任务失败", () => {
    expect(MAX_BATCH_ATTEMPTS).toBe(5);
  });
});
