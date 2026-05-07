import {
  buildAmapRegeoUrl,
  normalizeAmapRegeo,
  validateRegeoPoint,
  type RegeoRequestPoint,
  type RegeoResult,
} from "@/lib/amap";

type RegeoRequestBody = {
  points?: RegeoRequestPoint[];
};

const cache = new Map<string, RegeoResult>();

export async function POST(request: Request) {
  const key = process.env.AMAP_WEB_SERVICE_KEY;
  if (!key) {
    return Response.json(
      { message: "缺少 AMAP_WEB_SERVICE_KEY，无法调用高德逆地理编码" },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as RegeoRequestBody;
  const points = Array.isArray(body.points) ? body.points : [];
  const results: RegeoResult[] = [];

  for (const point of points) {
    if (!validateRegeoPoint(point)) {
      results.push({
        id: point?.id ?? "unknown",
        lat: Number(point?.lat ?? 0),
        lng: Number(point?.lng ?? 0),
        status: "skipped",
        message: "非法经纬度",
      });
      continue;
    }

    const cacheKey = `${point.lng.toFixed(6)},${point.lat.toFixed(6)}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      results.push({ ...cached, id: point.id });
      continue;
    }

    try {
      // 关键逻辑：高德 Web 服务 Key 只在服务端参与请求，响应不返回 key。
      const response = await fetch(buildAmapRegeoUrl(point, key));
      const payload = await response.json();
      const result = normalizeAmapRegeo(point.id, point.lat, point.lng, payload);
      cache.set(cacheKey, result);
      results.push(result);
    } catch (error) {
      results.push({
        id: point.id,
        lat: point.lat,
        lng: point.lng,
        status: "failed",
        message: error instanceof Error ? error.message : "高德逆地理编码请求失败",
      });
    }
  }

  const hasInvalidPoint = results.some((result) => result.status === "skipped");
  return Response.json(
    { results },
    { status: hasInvalidPoint && results.length === 1 ? 400 : 200 },
  );
}
