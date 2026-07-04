type SearchPanelProps = {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  disabled?: boolean;
};

export function SearchPanel({ query, onQueryChange, onSearch, disabled = false }: SearchPanelProps) {
  return (
    <section className="rounded-2xl border border-white/75 bg-white/76 p-6 shadow-glass backdrop-blur-2xl">
      <div className="grid grid-cols-[minmax(0,1fr)_280px] gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ice-600">
            Поиск доказательств
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Сформулируйте научно-технический вопрос
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Укажите материал, процесс, параметры или требуемый результат. В демонстрационном
            режиме результат берётся из подготовленного сценария.
          </p>
        </div>

        <div className="rounded-xl border border-ice-100 bg-ice-50 px-4 py-3 text-sm font-semibold leading-6 text-ice-700">
          Это поиск доказательств по источникам, условиям, фрагментам и уровню уверенности.
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_220px] gap-4">
        <textarea
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="min-h-32 resize-none rounded-xl border border-slate-200 bg-white/92 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-ice-500 focus:ring-4 focus:ring-ice-100"
          placeholder="Например: подобрать технологию обессоливания воды по сульфатам, хлоридам, Ca, Mg, Na и сухому остатку..."
        />
        <button
          type="button"
          onClick={onSearch}
          disabled={disabled}
          className="rounded-xl bg-graphite-900 px-5 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-graphite-800 focus:outline-none focus:ring-4 focus:ring-ice-100 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Найти доказательства
        </button>
      </div>
    </section>
  );
}
