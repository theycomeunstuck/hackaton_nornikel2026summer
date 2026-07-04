import type { ReactNode } from "react";
import { SectionEyebrow } from "./SectionEyebrow";

type EvidencePageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
  className?: string;
};

export function EvidencePageHeader({
  eyebrow,
  title,
  description,
  aside,
  className = "",
}: EvidencePageHeaderProps) {
  return (
    <section
      className={`rounded-2xl border border-white/75 bg-white/76 p-7 shadow-glass backdrop-blur-2xl ${className}`}
    >
      <div className={aside ? "grid grid-cols-[minmax(0,1fr)_360px] gap-8" : ""}>
        <div>
          <SectionEyebrow>{eyebrow}</SectionEyebrow>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">{title}</h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {aside ? <div>{aside}</div> : null}
      </div>
    </section>
  );
}
