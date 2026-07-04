import { useState, type ReactNode } from "react";

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
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section
      className={`rounded border border-white/75 bg-white/72 shadow-glass backdrop-blur-2xl ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        aria-expanded={isOpen}
        className="flex w-full cursor-pointer items-center justify-between gap-5 p-5 text-left outline-none motion-ui-transition hover:bg-ice-50/45 focus-visible:ring-4 focus-visible:ring-ice-100"
      >
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ice-600">
              {eyebrow}
            </p>
          ) : null}
          <h2
            className={
              eyebrow
                ? "mt-2 text-lg font-semibold text-slate-950"
                : "text-lg font-semibold text-slate-950"
            }
          >
            {title}
          </h2>
          {summary ? <p className="mt-2 text-sm leading-6 text-slate-600">{summary}</p> : null}
        </div>
        <span
          className={`shrink-0 rounded border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] motion-ui-transition ${
            isOpen
              ? "border-ice-500 bg-ice-500 text-white"
              : "border-ice-100 bg-ice-50 text-ice-600"
          }`}
        >
          {isOpen ? "Свернуть" : "Открыть"}
        </span>
      </button>
      <div
        className={`motion-collapsible-grid ${
          isOpen ? "motion-collapsible-grid-open" : ""
        }`}
      >
        <div className="motion-collapsible-inner">
          <div
            className={`border-t border-slate-200/80 p-5 pt-4 motion-reveal-transition ${
              isOpen
                ? "visible translate-y-0 opacity-100"
                : "-translate-y-1 opacity-0 pointer-events-none"
            }`}
            aria-hidden={!isOpen}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
