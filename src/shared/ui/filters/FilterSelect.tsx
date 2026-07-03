import { FilterDropdown, type FilterOption } from "./FilterDropdown";

export type { FilterOption };

type FilterSelectProps = {
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  disabled?: boolean;
};

export function FilterSelect({
  value,
  options,
  onChange,
  ariaLabel,
  disabled = false,
}: FilterSelectProps) {
  return (
    <FilterDropdown
      label={ariaLabel}
      value={value}
      options={options}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
