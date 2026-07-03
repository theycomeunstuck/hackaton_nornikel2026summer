import { useLocation } from "react-router-dom";

type HeaderMeta = {
  title: string;
  subtitle: string;
};

const headerByPath: Record<string, HeaderMeta> = {
  "/dashboard": {
    title: "Обзор исследовательских доказательств",
    subtitle: "Сводка по источникам, утверждениям, пробелам и противоречиям.",
  },
  "/search": {
    title: "Поиск доказательств",
    subtitle: "Рабочая область для evidence-first запроса и проверки источников.",
  },
  "/graph": {
    title: "Граф знаний",
    subtitle: "Связи между материалами, процессами, параметрами и источниками.",
  },
  "/sources": {
    title: "Источники",
    subtitle: "Индексированные документы, патенты, отчеты и публикации.",
  },
  "/contradictions": {
    title: "Противоречия",
    subtitle: "Конфликтующие утверждения и слабые места доказательной базы.",
  },
  "/export": {
    title: "Экспорт",
    subtitle: "Подготовка доказательных отчетов для команды и экспертов.",
  },
  "/upload": {
    title: "Загрузка документов",
    subtitle: "Будущая точка пополнения корпуса научно-технических материалов.",
  },
  "/auth": {
    title: "Вход",
    subtitle: "Будущий контур доступа для внутренних пользователей.",
  },
};

export function Header() {
  const { pathname } = useLocation();
  const meta = headerByPath[pathname] ?? headerByPath["/dashboard"];

  return (
    <header className="border-b border-white/70 bg-white/55 px-8 py-5 shadow-sm backdrop-blur-xl">
      <div className="flex items-center justify-between gap-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ice-600">
            Научный клубок
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">{meta.title}</h1>
          <p className="mt-1 text-sm text-slate-600">{meta.subtitle}</p>
        </div>
        <div className="flex items-center gap-3 rounded border border-ice-100 bg-ice-50/80 px-4 py-3 text-sm text-slate-700">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.8)]" />
          Demo corpus: mining and metallurgy R&D
        </div>
      </div>
    </header>
  );
}
