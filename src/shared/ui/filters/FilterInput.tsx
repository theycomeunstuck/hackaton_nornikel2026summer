import type { InputHTMLAttributes } from "react";

type FilterInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  className?: string;
};

export function FilterInput({ className = "", ...props }: FilterInputProps) {
  return (
    <input
      {...props}
      className={`h-10 w-full rounded-lg border border-slate-200/90 bg-white/92 px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-ice-200 focus:border-ice-400 focus:ring-4 focus:ring-ice-100 ${className}`}
    />
  );
}
