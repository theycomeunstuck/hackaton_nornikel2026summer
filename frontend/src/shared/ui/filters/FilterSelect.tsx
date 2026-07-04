import {
  AnimatedSelect,
  type AnimatedSelectOption,
} from "../AnimatedSelect";

export type FilterOption = AnimatedSelectOption;

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
    <AnimatedSelect
      label={ariaLabel}
      value={value}
      options={options}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
