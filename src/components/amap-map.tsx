"use client";

import { MapPinned } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RoutePoint } from "@/lib/trips";

declare global {
  interface Window {
    _AMapSecurityConfig?: {
      serviceHost?: string;
    };
  }
}

type AMapNamespace = {
  Map: new (
    container: HTMLDivElement,
    options: Record<string, unknown>,
  ) => AMapMap;
  Marker: new (options: Record<string, unknown>) => unknown;
  Polyline: new (options: Record<string, unknown>) => unknown;
  Scale: new () => unknown;
};

type AMapMap = {
  add: (layers: unknown[]) => void;
  setFitView: () => void;
  addControl: (control: unknown) => void;
  destroy: () => void;
};

export function AmapMap({
  points,
  className = "",
}: {
  points: RoutePoint[];
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const amapPoints = useMemo(
    () =>
      points.filter(
        (point) =>
          typeof point.lat === "number" && typeof point.lng === "number",
      ),
    [points],
  );
  const key = process.env.NEXT_PUBLIC_AMAP_JS_KEY;

  useEffect(() => {
    const serviceHost =
      process.env.NEXT_PUBLIC_AMAP_SERVICE_HOST ?? "/_AMapService";

    if (!containerRef.current) {
      return;
    }

    if (!key) {
      return;
    }

    let map: AMapMap | null = null;
    window._AMapSecurityConfig = { serviceHost };

    import("@amap/amap-jsapi-loader")
      .then(({ default: AMapLoader }) =>
        AMapLoader.load({
          key,
          version: "2.0",
          plugins: ["AMap.Scale"],
        }),
      )
      .then((AMap) => {
        const amap = AMap as unknown as AMapNamespace;
        map = new amap.Map(containerRef.current!, {
          viewMode: "3D",
          zoom: 11,
          center: [
            amapPoints[0]?.lng ?? 113.540123,
            amapPoints[0]?.lat ?? 22.104981,
          ],
        });

        const markers = amapPoints.map(
          (point) =>
            new amap.Marker({
              position: [point.lng, point.lat],
              title: point.placeName,
            }),
        );
        const polyline =
          amapPoints.length > 1
            ? new amap.Polyline({
                path: amapPoints.map((point) => [point.lng, point.lat]),
                strokeColor: "#111111",
                strokeWeight: 4,
              })
            : undefined;

        map.add([...markers, ...(polyline ? [polyline] : [])]);
        map.addControl(new amap.Scale());
        map.setFitView();
      })
      .catch(() => {
        setError("高德地图加载失败，请检查 Key、服务域名和安全代理配置。");
      });

    return () => {
      map?.destroy();
    };
  }, [amapPoints, key]);

  if (!key || error) {
    return (
      <MapFallback
        message={error ?? "缺少 NEXT_PUBLIC_AMAP_JS_KEY，当前显示地图占位。"}
        className={className}
      />
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-lg border border-black/10 ${className}`}
    >
      <div ref={containerRef} className="h-full min-h-[420px] w-full" />
    </div>
  );
}

function MapFallback({
  message,
  className,
}: {
  message: string;
  className: string;
}) {
  return (
    <div
      className={`flex min-h-[420px] flex-col justify-between rounded-lg border border-black/10 bg-[#eef1ec] p-6 ${className}`}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-black/70">
        <MapPinned size={18} />
        地图配置提示
      </div>
      <div>
        <p className="max-w-md text-2xl font-semibold leading-9">{message}</p>
        <p className="mt-3 text-sm leading-6 text-black/55">
          地图组件已预留真实高德加载逻辑；配置环境变量后会展示城市点和旅行路线。
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 text-xs text-black/55">
        <span className="rounded-lg bg-white/70 p-3">珠海长隆</span>
        <span className="rounded-lg bg-white/70 p-3">情侣路</span>
        <span className="rounded-lg bg-white/70 p-3">旅行路线</span>
      </div>
    </div>
  );
}
