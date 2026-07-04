import type { ReactNode } from "react";

type SectionEyebrowProps = {
  children: ReactNode;
  className?: string;
};

export function SectionEyebrow({ children, className = "" }: SectionEyebrowProps) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-[0.22em] text-ice-600 ${className}`}>
      {children}
    </p>
  );
}
