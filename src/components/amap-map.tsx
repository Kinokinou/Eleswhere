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
  Marker: new (options: Record<string, unknown>) => AMapMarker;
  Polyline: new (options: Record<string, unknown>) => unknown;
  Scale: new () => unknown;
};

type AMapMarker = {
  on: (eventName: string, handler: () => void) => void;
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
  selectedPointId,
  onPointSelect,
}: {
  points: RoutePoint[];
  className?: string;
  selectedPointId?: string;
  onPointSelect?: (point: RoutePoint) => void;
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

        const markers = amapPoints.map((point) => {
          const marker = new amap.Marker({
            position: [point.lng, point.lat],
            title: point.placeName,
            content: buildMarkerContent(point, point.id === selectedPointId),
          });

          if (onPointSelect) {
            marker.on("click", () => onPointSelect(point));
          }

          return marker;
        });
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
  }, [amapPoints, key, onPointSelect, selectedPointId]);

  if (!key || error) {
    return (
      <MapFallback
        message={error ?? "缺少 NEXT_PUBLIC_AMAP_JS_KEY，当前显示地图占位。"}
        className={className}
        points={points}
        selectedPointId={selectedPointId}
        onPointSelect={onPointSelect}
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
  points,
  selectedPointId,
  onPointSelect,
}: {
  message: string;
  className: string;
  points: RoutePoint[];
  selectedPointId?: string;
  onPointSelect?: (point: RoutePoint) => void;
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
      <div className="grid gap-3 text-xs text-black/55 sm:grid-cols-3">
        {(points.length > 0 ? points : fallbackPoints()).map((point) => (
          <button
            key={point.id}
            type="button"
            onClick={() => onPointSelect?.(point)}
            className={`rounded-lg p-3 text-left transition ${
              point.id === selectedPointId
                ? "bg-black text-white"
                : "bg-white/70 hover:bg-white"
            }`}
          >
            <span className="block font-semibold">{point.placeName}</span>
            <span
              className={`mt-1 block ${
                point.id === selectedPointId ? "text-white/65" : "text-black/45"
              }`}
            >
              {point.date}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// 关键逻辑：高德 marker 使用 HTML 内容，选中点需要比普通点更突出。
function buildMarkerContent(point: RoutePoint, selected: boolean) {
  const size = selected ? 34 : 28;
  const background = selected ? "#000000" : "#ffffff";
  const color = selected ? "#ffffff" : "#111111";
  const border = selected ? "2px solid #ffffff" : "1px solid rgba(0,0,0,.18)";

  return `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:999px;background:${background};color:${color};border:${border};box-shadow:0 8px 20px rgba(0,0,0,.18);font-size:12px;font-weight:700;">${point.order}</div>`;
}

function fallbackPoints(): RoutePoint[] {
  return [
    {
      id: "fallback-1",
      placeName: "珠海长隆",
      date: "2026-05-03",
      startTime: "2026-05-03T10:00:00.000Z",
      photoIds: [],
      order: 1,
    },
    {
      id: "fallback-2",
      placeName: "情侣路",
      date: "2026-05-03",
      startTime: "2026-05-03T14:00:00.000Z",
      photoIds: [],
      order: 2,
    },
    {
      id: "fallback-3",
      placeName: "旅行路线",
      date: "2026-05-03",
      startTime: "2026-05-03T16:00:00.000Z",
      photoIds: [],
      order: 3,
    },
  ];
}
