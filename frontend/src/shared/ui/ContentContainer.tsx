import type { ReactNode } from "react";

type ContentContainerProps = {
  children: ReactNode;
  className?: string;
};

export function ContentContainer({ children, className = "" }: ContentContainerProps) {
  return (
    <div className={`mx-auto max-w-[1680px] space-y-8 ${className}`}>
      {children}
    </div>
  );
}
