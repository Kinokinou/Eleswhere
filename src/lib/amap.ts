import { pickPlaceName, type GeoAddress } from "./trips";

export type RegeoRequestPoint = {
  id: string;
  lat: number;
  lng: number;
};

export type RegeoResult = GeoAddress & {
  id: string;
  lat: number;
  lng: number;
  status: "success" | "failed" | "skipped";
  message?: string;
};

type AmapRegeoResponse = {
  status?: string;
  info?: string;
  regeocode?: {
    formatted_address?: string;
    addressComponent?: {
      country?: string;
      province?: string;
      city?: string | unknown[];
      district?: string;
      township?: string;
      adcode?: string;
    };
    pois?: Array<{ name?: string }>;
    aois?: Array<{ name?: string }>;
  };
};

export function validateRegeoPoint(point: RegeoRequestPoint): boolean {
  return (
    typeof point.id === "string" &&
    point.id.length > 0 &&
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    point.lng >= -180 &&
    point.lng <= 180
  );
}

export function buildAmapRegeoUrl(
  point: Pick<RegeoRequestPoint, "lat" | "lng">,
  key: string,
): string {
  const url = new URL("https://restapi.amap.com/v3/geocode/regeo");
  url.searchParams.set("key", key);
  url.searchParams.set("location", `${point.lng.toFixed(6)},${point.lat.toFixed(6)}`);
  url.searchParams.set("output", "JSON");
  url.searchParams.set("extensions", "all");
  url.searchParams.set("radius", "1000");
  return url.toString();
}

export function normalizeAmapRegeo(
  id: string,
  lat: number,
  lng: number,
  payload: AmapRegeoResponse,
): RegeoResult {
  if (payload.status !== "1" || !payload.regeocode) {
    return {
      id,
      lat,
      lng,
      status: "failed",
      message: payload.info ?? "高德逆地理编码失败",
    };
  }

  const addressComponent = payload.regeocode.addressComponent;
  const geo: GeoAddress = {
    formattedAddress: payload.regeocode.formatted_address,
    country: addressComponent?.country,
    province: addressComponent?.province,
    city:
      typeof addressComponent?.city === "string"
        ? addressComponent.city
        : undefined,
    district: addressComponent?.district,
    township: addressComponent?.township,
    adcode: addressComponent?.adcode,
    poiName: payload.regeocode.pois?.[0]?.name,
    aoiName: payload.regeocode.aois?.[0]?.name,
  };

  return {
    id,
    lat,
    lng,
    ...geo,
    placeName: pickPlaceName(geo),
    status: "success",
  };
}

export function appendJscode(targetUrl: string, jscode: string): string {
  const url = new URL(targetUrl);
  // 关键逻辑：安全密钥只在服务端代理层追加，避免暴露给浏览器代码。
  url.searchParams.set("jscode", jscode);
  return url.toString();
}
