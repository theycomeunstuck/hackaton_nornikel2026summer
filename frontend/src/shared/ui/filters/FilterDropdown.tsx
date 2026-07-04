import {
  AnimatedSelect,
  type AnimatedSelectOption,
} from "../AnimatedSelect";

export type FilterOption = AnimatedSelectOption;

type FilterDropdownProps = {
  label?: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function FilterDropdown({
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
  className = "",
}: FilterDropdownProps) {
  return (
    <AnimatedSelect
      label={label}
      value={value}
      options={options}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
}
