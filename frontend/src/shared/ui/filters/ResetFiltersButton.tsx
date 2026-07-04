type ResetFiltersButtonProps = {
  onClick: () => void;
  label?: string;
};

export function ResetFiltersButton({ onClick, label = "Сбросить" }: ResetFiltersButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-slate-200 bg-white/76 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 transition hover:border-ice-200 hover:bg-ice-50 hover:text-ice-700"
    >
      {label}
    </button>
  );
}
