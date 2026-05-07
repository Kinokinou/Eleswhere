"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { PhotoMeta } from "@/lib/trips";

export function PhotoLightbox({
  photo,
  currentIndex,
  total,
  onClose,
  onPrevious,
  onNext,
}: {
  photo: PhotoMeta;
  currentIndex: number;
  total: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;

  return (
    <div
      role="dialog"
      aria-label="照片预览"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-full w-full max-w-5xl flex-col gap-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between text-white">
          <div className="text-sm">
            {currentIndex + 1} / {total} · {photo.fileName}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="关闭预览"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative flex min-h-[60vh] items-center justify-center">
          <button
            type="button"
            onClick={onPrevious}
            disabled={isFirst}
            className="absolute left-0 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-black disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="上一张"
          >
            <ChevronLeft size={22} />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.previewUrl}
            alt={photo.fileName}
            className="max-h-[76vh] max-w-full rounded-lg object-contain"
          />

          <button
            type="button"
            onClick={onNext}
            disabled={isLast}
            className="absolute right-0 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-black disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="下一张"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
