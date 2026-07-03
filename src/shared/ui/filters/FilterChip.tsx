type FilterChipProps = {
  label: string;
  active?: boolean;
  onClick: () => void;
};

export function FilterChip({ label, active = false, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-ice-300 bg-ice-500 text-white shadow-sm shadow-ice-200"
          : "border-ice-100 bg-white/80 text-ice-700 hover:border-ice-300 hover:bg-ice-50"
      }`}
    >
      {label}
    </button>
  );
}
