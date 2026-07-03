import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../entities/auth/model";

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
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const meta = headerByPath[pathname] ?? headerByPath["/dashboard"];

  const handleLogout = async () => {
    await logout();
    navigate("/auth", { replace: true });
  };

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
        <div className="flex items-center gap-3">
          <div className="rounded border border-ice-100 bg-ice-50/80 px-4 py-3 text-sm text-slate-700">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.8)]" />
              <div>
                <p className="font-semibold text-slate-900">{user?.name ?? "Demo user"}</p>
                <p className="text-xs text-slate-500">
                  {user?.role ?? "researcher"}
                  {user?.organization ? ` / ${user.organization}` : ""}
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-ice-200 hover:text-ice-600"
          >
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
}
