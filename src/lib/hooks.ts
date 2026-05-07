"use client";

import { useEffect, useState } from "react";
import { readTrips } from "./storage";
import type { TripDraft } from "./trips";

export function useStoredTrips() {
  const [trips, setTrips] = useState<TripDraft[]>([]);

  useEffect(() => {
    // 关键逻辑：延后读取 localStorage，避开 React 19 对 effect 同步 setState 的限制。
    const timer = window.setTimeout(() => {
      setTrips(readTrips());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  return trips;
}
