"use client";

import { useEffect, useState } from "react";
import { fetchTrips } from "./api-client";
import type { TripDraft } from "./trips";

let lastLoadedTrips: TripDraft[] = [];

export function useStoredTrips() {
  const [trips, setTrips] = useState<TripDraft[]>(lastLoadedTrips);

  useEffect(() => {
    // 关键逻辑：页面数据从后端 API 读取，不再依赖浏览器 localStorage。
    const timer = window.setTimeout(() => {
      fetchTrips()
        .then((nextTrips) => {
          lastLoadedTrips = nextTrips;
          setTrips(nextTrips);
        })
        .catch((error) => {
          // 关键逻辑：接口短暂失败不能把已有旅行清空，否则用户会误以为数据库丢失。
          console.warn("获取旅行列表失败，保留最近一次成功加载的数据", error);
          setTrips((currentTrips) =>
            currentTrips.length > 0 ? currentTrips : lastLoadedTrips,
          );
        });
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  return trips;
}
