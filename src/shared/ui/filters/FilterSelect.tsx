import type { ChangeEvent } from "react";

export type FilterOption = {
  value: string;
  label: string;
};

type FilterSelectProps = {
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
};

export function FilterSelect({ value, options, onChange, ariaLabel }: FilterSelectProps) {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <select
      value={value}
      aria-label={ariaLabel}
      onChange={handleChange}
      className="h-10 w-full appearance-none rounded-lg border border-slate-200/90 bg-white/92 px-3 pr-8 text-sm font-medium text-slate-800 shadow-sm outline-none transition hover:border-ice-200 focus:border-ice-400 focus:ring-4 focus:ring-ice-100"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
