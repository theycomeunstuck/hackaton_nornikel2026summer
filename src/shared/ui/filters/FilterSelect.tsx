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
    <div className="relative">
      <select
        value={value}
        aria-label={ariaLabel}
        onChange={handleChange}
        className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-slate-200/90 bg-white/92 px-3 pr-9 text-sm font-medium text-slate-800 shadow-sm outline-none transition hover:border-ice-200 focus:border-ice-400 focus:ring-4 focus:ring-ice-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ice-600">
        ▾
      </span>
    </div>
  );
}
