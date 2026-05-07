"use client";

import { CalendarDays, Loader2, Play, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import {
  deleteTripDraft,
  fetchTripDrafts,
  startTripDraftBuild,
} from "@/lib/api-client";
import type { TripDraft } from "@/lib/trips";

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<TripDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyDraftId, setBusyDraftId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadDrafts() {
    setIsLoading(true);
    try {
      setDrafts(await fetchTripDrafts());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "获取草稿箱失败");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDrafts();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function buildDraft(draftId: string) {
    setBusyDraftId(draftId);
    setMessage(null);
    try {
      await startTripDraftBuild(draftId);
      setMessage("构建任务已启动，可到 Trips 查看进度。");
      await loadDrafts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "启动构建任务失败");
    } finally {
      setBusyDraftId(null);
    }
  }

  async function removeDraft(draftId: string) {
    setBusyDraftId(draftId);
    setMessage(null);
    try {
      await deleteTripDraft(draftId);
      setDrafts((current) => current.filter((draft) => draft.id !== draftId));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除草稿失败");
    } finally {
      setBusyDraftId(null);
    }
  }

  return (
    <section>
      <PageHeader
        title="Drafts"
        description="先保存旅行草稿，再由后端分批构建正式旅途。"
        action={
          <Link
            href="/trips/new"
            className="inline-flex h-11 items-center rounded-lg bg-black px-4 text-sm font-semibold text-white"
          >
            新建草稿
          </Link>
        }
      />

      {message ? (
        <div className="mb-4 rounded-lg bg-white p-3 text-sm text-black/65">
          {message}
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex h-40 items-center justify-center rounded-lg bg-white">
          <Loader2 className="animate-spin" size={22} />
        </div>
      ) : drafts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/20 bg-white p-10 text-center">
          <p className="text-lg font-semibold">草稿箱为空</p>
          <p className="mt-2 text-sm text-black/55">
            导入照片后，旅行草稿会保存在这里。
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {drafts.map((draft) => (
            <article
              key={draft.id}
              className="rounded-lg border border-black/10 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase text-black/40">
                    {draft.failureMessage ? "Build failed" : "Draft"}
                  </div>
                  <h2 className="mt-2 text-xl font-semibold">{draft.title}</h2>
                </div>
                <span className="rounded-lg bg-[#d8f35f] px-2 py-1 text-xs font-semibold">
                  {draft.photos.length} 张照片
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-black/55">
                <CalendarDays size={15} />
                {draft.startDate} - {draft.endDate}
              </div>

              {draft.failureMessage ? (
                <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  上次构建失败：{draft.failureMessage}
                </div>
              ) : null}

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => buildDraft(draft.id)}
                  disabled={busyDraftId === draft.id}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-black px-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {busyDraftId === draft.id ? (
                    <Loader2 className="animate-spin" size={15} />
                  ) : (
                    <Play size={15} />
                  )}
                  开始构建
                </button>
                <button
                  type="button"
                  onClick={() => removeDraft(draft.id)}
                  disabled={busyDraftId === draft.id}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-black/10 disabled:opacity-60"
                  aria-label="删除草稿"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
