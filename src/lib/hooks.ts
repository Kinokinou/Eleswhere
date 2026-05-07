"use client";

import { useEffect, useState } from "react";
import { fetchTrips } from "./api-client";
import type { TripDraft } from "./trips";

export function useStoredTrips() {
  const [trips, setTrips] = useState<TripDraft[]>([]);

  useEffect(() => {
    // 关键逻辑：页面数据从后端 API 读取，不再依赖浏览器 localStorage。
    const timer = window.setTimeout(() => {
      fetchTrips()
        .then(setTrips)
        .catch(() => setTrips([]));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  return trips;
}
