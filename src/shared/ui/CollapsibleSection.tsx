import { useState, type ReactNode } from "react";

type CollapsibleSectionProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  rightSlot?: ReactNode;
  className?: string;
};

export function CollapsibleSection({
  title,
  eyebrow,
  description,
  defaultOpen = false,
  children,
  rightSlot,
  className = "",
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section
      className={`rounded-2xl border border-white/75 bg-white/72 shadow-glass backdrop-blur-2xl ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="flex w-full items-start justify-between gap-5 rounded-2xl px-5 py-4 text-left outline-none transition hover:bg-ice-50/45 focus-visible:ring-4 focus-visible:ring-ice-100"
        aria-expanded={isOpen}
      >
        <span className="min-w-0">
          {eyebrow ? (
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-ice-600">
              {eyebrow}
            </span>
          ) : null}
          <span className="mt-1 block text-lg font-semibold text-slate-950">{title}</span>
          {description ? (
            <span className="mt-2 block max-w-4xl text-sm leading-6 text-slate-600">
              {description}
            </span>
          ) : null}
        </span>

        <span className="flex shrink-0 items-center gap-3">
          {rightSlot ? <span onClick={(event) => event.stopPropagation()}>{rightSlot}</span> : null}
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ice-100 bg-ice-50 text-lg font-semibold text-ice-700 transition"
            aria-hidden="true"
          >
            {isOpen ? "−" : "+"}
          </span>
        </span>
      </button>

      {isOpen ? (
        <div className="border-t border-slate-100 px-5 py-5">
          {children}
        </div>
      ) : null}
    </section>
  );
}
