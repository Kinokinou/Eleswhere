import { PageHeader } from "./page-header";

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <section>
      <PageHeader title={title} description="该功能将在后续阶段实现。" />
      <div className="rounded-lg border border-dashed border-black/20 bg-white p-10 text-center">
        <p className="text-lg font-semibold">当前是一阶段占位页</p>
        <p className="mt-2 text-sm text-black/55">
          先保留入口，避免路由空缺；后续会在这里扩展正式功能。
        </p>
      </div>
    </section>
  );
}
