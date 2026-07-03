type SearchPanelProps = {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
};

export function SearchPanel({ query, onQueryChange, onSearch }: SearchPanelProps) {
  return (
    <section className="rounded border border-ice-100 bg-white/76 p-5 shadow-glass backdrop-blur-2xl">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ice-600">
            Поиск доказательств
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Проверьте научно-технический вопрос по источникам
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Сформулируйте вопрос с материалами, процессами, параметрами и требуемым результатом.
            Система покажет утверждения, источники, условия и уровень достоверности.
          </p>
        </div>
        <div className="rounded border border-ice-100 bg-ice-50 px-4 py-3 text-sm font-semibold text-ice-600">
          Каждый вывод должен иметь проверяемый источник
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_180px] gap-4">
        <textarea
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="min-h-32 resize-none rounded border border-slate-200 bg-white/90 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-ice-500 focus:ring-4 focus:ring-ice-100"
          placeholder="Введите промышленный R&D вопрос: материал, процесс, параметры, требуемый результат..."
        />
        <button
          type="button"
          onClick={onSearch}
          className="rounded bg-graphite-900 px-5 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-graphite-800 focus:outline-none focus:ring-4 focus:ring-ice-100"
        >
          Найти доказательства
        </button>
      </div>
    </section>
  );
}
