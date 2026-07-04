import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../entities/auth/model";
import { getHealth, type HealthResponse } from "../../shared/api/ragApi";

type HeaderMeta = {
  title: string;
  subtitle: string;
};

type BackendModeView = {
  label: string;
  dotClassName: string;
  className: string;
};

const headerByPath: Record<string, HeaderMeta> = {
  "/dashboard": {
    title: "Обзор",
    subtitle: "Сводка по утверждениям, источникам, противоречиям и пробелам.",
  },
  "/search": {
    title: "Поиск доказательств",
    subtitle: "Рабочая область анализа источников, утверждений и условий.",
  },
  "/claims": {
    title: "База утверждений",
    subtitle: "Проверяемые выводы с источниками, условиями и достоверностью.",
  },
  "/graph": {
    title: "Граф знаний",
    subtitle: "Связи между утверждениями, материалами, процессами и источниками.",
  },
  "/sources": {
    title: "Источники",
    subtitle: "Документы, страницы и фрагменты, подтверждающие выводы.",
  },
  "/contradictions": {
    title: "Противоречия",
    subtitle: "Конфликты и слабые места доказательной базы.",
  },
  "/export": {
    title: "Экспорт",
    subtitle: "Формирование отчётов из текущих результатов поиска.",
  },
  "/upload": {
    title: "Загрузка документов",
    subtitle: "Обработка документа и пополнение индекса доказательств.",
  },
};

function getBackendModeView(health: HealthResponse | null): BackendModeView {
  if (!health) {
    return {
      label: "Проверка режима",
      dotClassName: "bg-slate-400",
      className: "border-slate-200 bg-white/80 text-slate-600",
    };
  }

  if (health.isOffline) {
    return {
      label: "Offline · local samples",
      dotClassName: "bg-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.65)]",
      className: "border-amber-200 bg-amber-50/85 text-amber-800",
    };
  }

  if (health.engine === "rag") {
    return {
      label: "RAG · real index",
      dotClassName: "bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.8)]",
      className: "border-emerald-200 bg-emerald-50/85 text-emerald-800",
    };
  }

  return {
    label: "Demo · mock fallback",
    dotClassName: "bg-ice-500 shadow-[0_0_16px_rgba(14,165,233,0.65)]",
    className: "border-ice-200 bg-ice-50/85 text-ice-800",
  };
}

function BackendModeIndicator() {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    let isActive = true;

    void getHealth().then((nextHealth) => {
      if (isActive) {
        setHealth(nextHealth);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  const mode = getBackendModeView(health);
  const title = health
    ? [
        health.service,
        health.version ? `v${health.version}` : null,
        health.baseUrl,
      ]
        .filter(Boolean)
        .join(" · ")
    : "Проверка подключения к backend";

  return (
    <div
      className={`rounded border px-3 py-2 text-xs font-semibold transition ${mode.className}`}
      title={title}
      aria-label={`Режим backend: ${mode.label}`}
    >
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className={`h-2 w-2 rounded-full ${mode.dotClassName}`} />
        <span>{mode.label}</span>
      </div>
    </div>
  );
}

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
            R&D Evidence Hub
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">{meta.title}</h1>
          <p className="mt-1 text-sm text-slate-600">{meta.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <BackendModeIndicator />
          <div className="rounded border border-ice-100 bg-ice-50/80 px-4 py-3 text-sm text-slate-700">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.8)]" />
              <div>
                <p className="font-semibold text-slate-900">
                  {user?.name ?? "Инженер-исследователь"}
                </p>
                <p className="text-xs text-slate-500">
                  Исследователь
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
