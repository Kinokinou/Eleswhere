"use client";

import { useEffect, useState } from "react";
import { fetchTrips } from "./api-client";
import type { TripDraft } from "./trips";

let lastLoadedTrips: TripDraft[] = [];

export function useStoredTrips() {
  const [trips, setTrips] = useState<TripDraft[]>(lastLoadedTrips);

  useEffect(() => {
    let active = true;

    function loadTrips() {
      fetchTrips()
        .then((nextTrips) => {
          if (!active) return;
          lastLoadedTrips = nextTrips;
          setTrips(nextTrips);
        })
        .catch((error) => {
          if (!active) return;
          // 关键逻辑：接口短暂失败不能清空页面，否则用户会误以为数据库数据丢失。
          console.warn("获取旅行列表失败，保留最近一次成功加载的数据", error);
          setTrips((currentTrips) =>
            currentTrips.length > 0 ? currentTrips : lastLoadedTrips,
          );
        });
    }

    const timer = window.setTimeout(loadTrips, 0);
    const interval = window.setInterval(() => {
      if (lastLoadedTrips.some((trip) => trip.status === "building")) {
        loadTrips();
      }
    }, 3000);

    return () => {
      active = false;
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, []);

  return trips;
}
