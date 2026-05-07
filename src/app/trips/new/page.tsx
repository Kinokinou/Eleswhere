"use client";

import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { PageHeader } from "@/components/page-header";
import {
  createTripFromDraft,
  uploadPhotos,
} from "@/lib/api-client";
import { buildDraftFromPhotos, parsePhotoFiles } from "@/lib/photos";
import type { PhotoMeta, TripDraft } from "@/lib/trips";

export default function NewTripPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoMeta[]>([]);
  const [photoFiles, setPhotoFiles] = useState<Record<string, File>>({});
  const [draft, setDraft] = useState<TripDraft | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [message, setMessage] = useState("请选择 JPG / JPEG / PNG 照片。");

  const selectedPhotos = useMemo(
    () => photos.filter((photo) => photo.selected),
    [photos],
  );

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    setIsParsing(true);
    setMessage("正在读取照片时间、GPS，并尝试识别地点...");

    try {
      const parsedPhotos = await parsePhotoFiles(files);
      const nextPhotos = [...photos, ...parsedPhotos];
      const nextPhotoFiles = { ...photoFiles };
      parsedPhotos.forEach((photo, index) => {
        const file = files[index];
        if (file) {
          nextPhotoFiles[photo.id] = file;
        }
      });
      const nextDraft = buildDraftFromPhotos(nextPhotos);
      setPhotos(nextPhotos);
      setPhotoFiles(nextPhotoFiles);
      setDraft(nextDraft);
      setMessage("照片已解析完成，可以编辑旅行草稿。");
    } catch {
      setMessage("照片解析失败，请换一批照片重试。");
    } finally {
      setIsParsing(false);
      event.target.value = "";
    }
  }

  function removePhoto(photoId: string) {
    const nextPhotos = photos.filter((photo) => photo.id !== photoId);
    const nextPhotoFiles = { ...photoFiles };
    delete nextPhotoFiles[photoId];
    setPhotos(nextPhotos);
    setPhotoFiles(nextPhotoFiles);
    setDraft(nextPhotos.length > 0 ? buildDraftFromPhotos(nextPhotos) : null);
  }

  function updateDraftTitle(title: string) {
    setDraft((current) => (current ? { ...current, title } : current));
  }

  function updateDayTitle(dayId: string, title: string) {
    setDraft((current) =>
      current
        ? {
            ...current,
            days: current.days.map((day) =>
              day.id === dayId ? { ...day, title } : day,
            ),
          }
        : current,
    );
  }

  function selectCover(photoId: string) {
    setDraft((current) =>
      current ? { ...current, coverPhotoId: photoId } : current,
    );
  }

  async function createTrip() {
    if (!draft) {
      return;
    }

    setIsParsing(true);
    setMessage("正在上传照片并保存到数据库...");

    try {
      const uploadedPhotos = await uploadPhotos(
        draft.photos.map((photo) => ({
          clientId: photo.id,
          file: photoFiles[photo.id],
        })).filter((item): item is { clientId: string; file: File } => Boolean(item.file)),
      );
      const trip = await createTripFromDraft(draft, uploadedPhotos);
      router.push(`/trips/${trip.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "创建旅行失败");
    } finally {
      setIsParsing(false);
    }
  }

  return (
    <section>
      <PageHeader
        title="Create a trip"
        description="从照片创建一次旅行。系统会读取时间和 GPS，并通过后端调用高德逆地理编码。"
      />

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-black/20 bg-[#f7f7f5] p-6 text-center">
            {isParsing ? (
              <Loader2 className="animate-spin" size={32} />
            ) : (
              <Upload size={34} />
            )}
            <span className="mt-4 text-lg font-semibold">批量导入照片</span>
            <span className="mt-2 text-sm leading-6 text-black/55">{message}</span>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
          </label>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="overflow-hidden rounded-lg border border-black/10 bg-white"
              >
                <div className="h-32 bg-[#eef1ec]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.dataUrl ?? photo.previewUrl}
                    alt={photo.fileName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <div className="truncate text-sm font-semibold">{photo.fileName}</div>
                  <div className="mt-1 text-xs text-black/50">
                    {formatDateTime(photo.takenAt)}
                  </div>
                  <div className="mt-1 text-xs text-black/50">
                    {photo.placeName
                      ? `地点：${photo.placeName}`
                      : photo.lat && photo.lng
                        ? "地点：待识别地点"
                        : "地点：未知地点"}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => selectCover(photo.id)}
                      className={`h-8 rounded-lg px-3 text-xs font-semibold ${
                        draft?.coverPhotoId === photo.id
                          ? "bg-black text-white"
                          : "bg-black/[0.05]"
                      }`}
                    >
                      设为封面
                    </button>
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black/[0.05]"
                      aria-label="删除照片"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-black/10 bg-white p-5">
          {draft ? (
            <div>
              <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
                <div>
                  <label className="text-sm font-semibold">旅行标题</label>
                  <input
                    value={draft.title}
                    onChange={(event) => updateDraftTitle(event.target.value)}
                    className="mt-2 h-11 w-full rounded-lg border border-black/10 px-3 text-sm outline-none focus:border-black"
                  />
                </div>
                <div className="rounded-lg bg-[#d8f35f] p-4">
                  <div className="text-2xl font-semibold">{selectedPhotos.length}</div>
                  <div className="mt-1 text-xs text-black/60">已选照片</div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {draft.days.map((day) => (
                  <div key={day.id} className="rounded-lg border border-black/10 p-4">
                    <input
                      value={day.title}
                      onChange={(event) => updateDayTitle(day.id, event.target.value)}
                      className="h-10 w-full rounded-lg bg-[#f7f7f5] px-3 text-sm font-semibold outline-none"
                    />
                    <div className="mt-3 space-y-2">
                      {day.segments.map((segment) => (
                        <div
                          key={segment.id}
                          className="flex items-center justify-between rounded-lg bg-black/[0.03] p-3 text-sm"
                        >
                          <div>
                            <div className="font-semibold">
                              {segment.placeName ?? "未知地点"}
                            </div>
                            <div className="text-xs text-black/50">
                              {formatTime(segment.startTime)} -{" "}
                              {formatTime(segment.endTime)}
                            </div>
                          </div>
                          <span className="text-xs text-black/50">
                            {segment.photoIds.length} 张照片
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={createTrip}
                className="mt-6 h-11 w-full rounded-lg bg-black text-sm font-semibold text-white"
              >
                创建旅行
              </button>
            </div>
          ) : (
            <div className="flex min-h-96 flex-col items-center justify-center rounded-lg bg-[#f7f7f5] text-center">
              <ImageIcon size={34} className="text-black/35" />
              <p className="mt-4 text-lg font-semibold">等待照片生成旅行草稿</p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-black/55">
                导入照片后，这里会显示自动生成的每日时间线和地点段落。
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
