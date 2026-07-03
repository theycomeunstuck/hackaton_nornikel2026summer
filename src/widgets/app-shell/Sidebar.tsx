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
    "group relative flex min-h-11 items-center rounded-xl px-2 py-2.5 text-sm font-medium outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-ice-300/55";

  if (isActive) {
    return `${base} active border border-ice-300/35 bg-ice-500/16 text-white shadow-[0_0_28px_rgba(14,165,233,0.14)]`;
  }

  return `${base} border border-transparent text-slate-300 hover:border-ice-300/18 hover:bg-ice-500/10 hover:text-white`;
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
      className={`sticky top-0 flex h-screen shrink-0 flex-col overflow-hidden border-r border-ice-300/10 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_30%),linear-gradient(180deg,#06111f_0%,#0b1220_44%,#050811_100%)] py-6 text-white shadow-[18px_0_48px_rgba(2,6,23,0.22)] transition-[width,padding] duration-300 ease-out ${
        isCollapsed ? "w-[72px] px-3" : "w-72 px-5"
      }`}
    >
      <div className="relative border-b border-white/10 pb-6">
        <div className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full bg-ice-500/12 blur-2xl" />
        <div
          className={`relative flex gap-3 transition-all duration-300 ${
            isCollapsed ? "flex-col items-center" : "items-center justify-between"
          }`}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-ice-300/20 bg-ice-500/18 text-lg font-bold text-ice-100 shadow-[0_0_30px_rgba(14,165,233,0.18)] ring-1 ring-white/8">
            EH
          </div>
          <button
            type="button"
            title={toggleLabel}
            aria-label={toggleLabel}
            onClick={onToggleCollapsed}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/7 text-base font-semibold text-slate-200 shadow-sm transition hover:border-ice-300/40 hover:bg-ice-500/18 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice-300/55"
          >
            {isCollapsed ? "›" : "‹"}
          </button>
        </div>
        <div
          className={`transition-all duration-200 ${
            isCollapsed ? "pointer-events-none mt-0 max-h-0 opacity-0" : "mt-4 max-h-32 opacity-100"
          }`}
        >
          <h2 className="whitespace-nowrap text-xl font-semibold tracking-tight text-white">
            R&D Evidence Hub
          </h2>
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
            <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-ice-300 opacity-0 transition group-[.active]:opacity-100" />
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/7 text-[11px] font-semibold text-ice-100 transition group-hover:border-ice-300/30 group-hover:bg-ice-500/14">
              {item.marker}
            </span>
            <span
              className={`min-w-0 whitespace-nowrap text-[13px] transition-all duration-200 ${
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
              <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-ice-300 opacity-0 transition group-[.active]:opacity-100" />
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/7 text-[11px] font-semibold text-slate-300 transition group-hover:border-ice-300/30 group-hover:bg-ice-500/14">
                {item.marker}
              </span>
              <span
                className={`min-w-0 whitespace-nowrap text-[13px] transition-all duration-200 ${
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
