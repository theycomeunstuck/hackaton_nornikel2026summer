import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
};

export function SectionCard({ title, eyebrow, children, className = "" }: SectionCardProps) {
  return (
    <section
      className={`rounded border border-white/75 bg-white/72 p-5 shadow-glass backdrop-blur-2xl ${className}`}
    >
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ice-600">
          {eyebrow}
        </p>
      ) : null}
      <h2 className={eyebrow ? "mt-2 text-lg font-semibold text-slate-950" : "text-lg font-semibold text-slate-950"}>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
