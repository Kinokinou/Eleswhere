import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col justify-between gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-3xl font-semibold tracking-[0px] text-black sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </header>
  );
}
