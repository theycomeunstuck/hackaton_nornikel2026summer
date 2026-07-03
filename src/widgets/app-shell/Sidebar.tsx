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
    "group flex items-center rounded px-3 py-3 text-sm font-medium transition";

  if (isActive) {
    return `${base} bg-ice-500/16 text-white ring-1 ring-ice-300/35`;
  }

  return `${base} text-slate-300 hover:bg-white/8 hover:text-white`;
}

type SidebarProps = {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
};

export function Sidebar({ isCollapsed, onToggleCollapsed }: SidebarProps) {
  const primaryItems = navigationItems.filter((item) => !item.secondary);
  const secondaryItems = navigationItems.filter((item) => item.secondary);
  const toggleLabel = isCollapsed ? "Развернуть меню" : "Свернуть меню";

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col overflow-hidden border-r border-white/10 bg-graphite-950 py-6 text-white transition-[width,padding] duration-300 ease-out ${
        isCollapsed ? "w-[72px] px-3" : "w-72 px-5"
      }`}
    >
      <div className="border-b border-white/10 pb-6">
        <div
          className={`flex gap-3 transition-all duration-300 ${
            isCollapsed ? "flex-col items-center" : "items-center justify-between"
          }`}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-ice-500/18 text-lg font-bold text-ice-100 ring-1 ring-ice-300/25">
            EH
          </div>
          <button
            type="button"
            title={toggleLabel}
            aria-label={toggleLabel}
            onClick={onToggleCollapsed}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-white/10 bg-white/6 text-sm font-semibold text-slate-200 transition hover:border-ice-300/40 hover:bg-ice-500/16 hover:text-white"
          >
            {isCollapsed ? "›" : "‹"}
          </button>
        </div>
        <div
          className={`transition-all duration-200 ${
            isCollapsed ? "pointer-events-none mt-0 max-h-0 opacity-0" : "mt-4 max-h-32 opacity-100"
          }`}
        >
          <h2 className="whitespace-nowrap text-xl font-semibold">R&D Evidence Hub</h2>
          <p className="mt-2 text-sm leading-5 text-slate-400">
            Проверка научно-технических утверждений по источникам.
          </p>
        </div>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-2">
        {primaryItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={item.label}
            className={({ isActive }) => getNavLinkClass(isActive)}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-white/10 bg-white/6 text-[11px] font-semibold text-ice-100">
              {item.marker}
            </span>
            <span
              className={`min-w-0 whitespace-nowrap transition-all duration-200 ${
                isCollapsed ? "w-0 translate-x-2 overflow-hidden opacity-0" : "ml-3 w-auto opacity-100"
              }`}
            >
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 pt-4">
        <p
          className={`px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition-all duration-200 ${
            isCollapsed ? "h-0 overflow-hidden opacity-0" : "opacity-100"
          }`}
        >
          Дополнительно
        </p>
        <div className={`${isCollapsed ? "mt-0" : "mt-3"} flex flex-col gap-2 transition-all duration-200`}>
          {secondaryItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.label}
              className={({ isActive }) => getNavLinkClass(isActive)}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-white/10 bg-white/6 text-[11px] font-semibold text-slate-400">
                {item.marker}
              </span>
              <span
                className={`min-w-0 whitespace-nowrap transition-all duration-200 ${
                  isCollapsed ? "w-0 translate-x-2 overflow-hidden opacity-0" : "ml-3 w-auto opacity-100"
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          ))}
        </div>
      </div>
    </aside>
  );
}
