"use client";

import { CalendarDays } from "lucide-react";
import type { TripDraft } from "@/lib/trips";

const weekDays = ["一", "二", "三", "四", "五", "六", "日"];

export function TripDetailCalendar({ trip }: { trip: TripDraft }) {
  const monthDays = buildCalendarDays(trip);

  return (
    <aside className="rounded-lg border border-black/10 bg-white p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-black/65">
        <CalendarDays size={18} />
        旅行日历
      </div>
      <div className="mt-4 text-2xl font-semibold tracking-[0px]">
        {formatMonthTitle(trip.startDate)}
      </div>
      <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-black/45">
        {weekDays.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2">
        {monthDays.map((day, index) =>
          day ? (
            <div
              key={day.dateKey}
              aria-label={buildDayLabel(day)}
              className={`flex aspect-square items-center justify-center rounded-lg text-sm ${
                day.hasPhoto
                  ? "bg-black font-semibold text-white"
                  : day.inTripRange
                    ? "bg-[#d8f35f] font-semibold text-black"
                    : "bg-[#f7f7f5] text-black/45"
              }`}
            >
              {day.dayOfMonth}
            </div>
          ) : (
            <div key={`empty-${index}`} aria-hidden="true" />
          ),
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-black/55">
        <span className="rounded-lg bg-[#d8f35f] px-2 py-1">旅行日期</span>
        <span className="rounded-lg bg-black px-2 py-1 text-white">有照片</span>
      </div>
    </aside>
  );
}

type CalendarDay = {
  dateKey: string;
  dayOfMonth: number;
  inTripRange: boolean;
  hasPhoto: boolean;
};

export function buildCalendarDays(trip: TripDraft): Array<CalendarDay | null> {
  const [year, month] = trip.startDate.split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startOffset = (firstDay.getUTCDay() + 6) % 7;
  const photoDateKeys = new Set(
    trip.photos.map((photo) => photo.takenAt.slice(0, 10)),
  );
  const days: Array<CalendarDay | null> = Array.from(
    { length: startOffset },
    () => null,
  );

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(
      day,
    ).padStart(2, "0")}`;
    days.push({
      dateKey,
      dayOfMonth: day,
      inTripRange: dateKey >= trip.startDate && dateKey <= trip.endDate,
      hasPhoto: photoDateKeys.has(dateKey),
    });
  }

  return days;
}

function buildDayLabel(day: CalendarDay) {
  if (day.inTripRange && day.hasPhoto) {
    return `${day.dateKey}，旅行日期，有照片`;
  }
  if (day.inTripRange) {
    return `${day.dateKey}，旅行日期`;
  }
  return day.dateKey;
}

function formatMonthTitle(dateKey: string) {
  const [year, month] = dateKey.split("-");
  return `${year}年${Number(month)}月`;
}
