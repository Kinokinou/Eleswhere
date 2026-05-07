export const BUILD_BATCH_SIZE = 20;
export const MAX_BATCH_ATTEMPTS = 5;

// 关键逻辑：构建任务按固定大小拆批，避免 500 张照片一次性写库导致超时。
export function splitIntoBuildBatches<T>(items: T[], size = BUILD_BATCH_SIZE): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}
