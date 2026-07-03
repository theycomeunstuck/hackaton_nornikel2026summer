import { NavLink } from "react-router-dom";

type NavigationItem = {
  label: string;
  path: string;
  marker: string;
  secondary?: boolean;
};

const navigationItems: NavigationItem[] = [
  { label: "Обзор", path: "/dashboard", marker: "ОБ" },
  { label: "Поиск доказательств", path: "/search", marker: "ПД" },
  { label: "База утверждений", path: "/claims", marker: "БУ" },
  { label: "Граф знаний", path: "/graph", marker: "ГЗ" },
  { label: "Источники", path: "/sources", marker: "ИС" },
  { label: "Противоречия", path: "/contradictions", marker: "ПР" },
  { label: "Экспорт", path: "/export", marker: "ЭК" },
  { label: "Загрузка документов", path: "/upload", marker: "ЗД", secondary: true },
];

function getNavLinkClass(isActive: boolean): string {
  const base =
    "group flex items-center gap-3 rounded px-3 py-3 text-sm font-medium transition";

  if (isActive) {
    return `${base} bg-ice-500/16 text-white ring-1 ring-ice-300/35`;
  }

  return `${base} text-slate-300 hover:bg-white/8 hover:text-white`;
}

export function Sidebar() {
  const primaryItems = navigationItems.filter((item) => !item.secondary);
  const secondaryItems = navigationItems.filter((item) => item.secondary);

  return (
    <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col border-r border-white/10 bg-graphite-950 px-5 py-6 text-white">
      <div className="border-b border-white/10 pb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded bg-ice-500/18 text-lg font-bold text-ice-100 ring-1 ring-ice-300/25">
          EH
        </div>
        <h2 className="mt-4 text-xl font-semibold">R&D Evidence Hub</h2>
        <p className="mt-2 text-sm leading-5 text-slate-400">
          Проверка научно-технических утверждений по источникам.
        </p>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-2">
        {primaryItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => getNavLinkClass(isActive)}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-white/6 text-[11px] font-semibold text-ice-100">
              {item.marker}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 pt-4">
        <p className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Дополнительно
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {secondaryItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => getNavLinkClass(isActive)}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-white/6 text-[11px] font-semibold text-slate-400">
                {item.marker}
              </span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </aside>
  );
}
