import type { ReactNode } from "react";

type DisclosureSectionProps = {
  title: string;
  eyebrow?: string;
  summary?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

export function DisclosureSection({
  title,
  eyebrow,
  summary,
  children,
  defaultOpen = false,
  className = "",
}: DisclosureSectionProps) {
  return (
    <details
      open={defaultOpen}
      className={`group rounded border border-white/75 bg-white/72 shadow-glass backdrop-blur-2xl ${className}`}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-5 p-5 marker:hidden">
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ice-600">
              {eyebrow}
            </p>
          ) : null}
          <h2 className={eyebrow ? "mt-2 text-lg font-semibold text-slate-950" : "text-lg font-semibold text-slate-950"}>
            {title}
          </h2>
          {summary ? <p className="mt-2 text-sm leading-6 text-slate-600">{summary}</p> : null}
        </div>
        <span className="shrink-0 rounded border border-ice-100 bg-ice-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-ice-600 transition group-open:bg-ice-500 group-open:text-white">
          <span className="group-open:hidden">Открыть</span>
          <span className="hidden group-open:inline">Свернуть</span>
        </span>
      </summary>
      <div className="border-t border-slate-200/80 p-5 pt-4">{children}</div>
    </details>
  );
}
