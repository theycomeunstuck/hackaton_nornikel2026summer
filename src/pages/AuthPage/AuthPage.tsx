import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../entities/auth/model";
import type { LoginRequest } from "../../entities/auth/types";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

const testCredentials: LoginRequest = {
  email: "researcher@demo.local",
  password: "demo123",
};

function getRedirectPath(state: unknown): string {
  const locationState = state as LocationState | null;
  return locationState?.from?.pathname ?? "/dashboard";
}

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [loginValue, setLoginValue] = useState(testCredentials.email);
  const [secretValue, setSecretValue] = useState(testCredentials.password);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email: loginValue, password: secretValue });
      navigate(getRedirectPath(location.state), { replace: true });
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось войти. Проверьте электронную почту и пароль.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-animated-bg relative min-h-screen overflow-hidden bg-graphite-950 px-10 py-10 text-white">
      <div className="auth-dotted-wave pointer-events-none absolute inset-0" />
      <div className="auth-particle-wave pointer-events-none absolute inset-0" />
      <div className="auth-glow-field pointer-events-none absolute inset-0" />
      <div className="auth-floating-shape auth-floating-shape-one pointer-events-none" />
      <div className="auth-floating-shape auth-floating-shape-two pointer-events-none" />
      <div className="auth-floating-shape auth-floating-shape-three pointer-events-none" />

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl grid-cols-[minmax(0,1fr)_440px] items-center gap-12">
        <section className="auth-hero-enter">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ice-300">
            R&D Evidence Hub
          </p>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight">
            Проверка научно-технических утверждений по источникам, условиям и связям
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300">
            Корпоративная рабочая область для анализа источников, утверждений, противоречий и
            пробелов в научно-технических данных.
          </p>

          <div className="mt-8 grid max-w-4xl grid-cols-3 gap-4">
            {[
              ["База утверждений", "проверяемые выводы"],
              ["Источники", "страницы и фрагменты"],
              ["Граф знаний", "связи материалов и процессов"],
            ].map(([title, description]) => (
              <div key={title} className="rounded-xl border border-white/10 bg-white/8 p-4">
                <p className="text-lg font-semibold text-white">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="auth-card-enter rounded-2xl border border-white/12 bg-white/10 p-6 shadow-glass backdrop-blur-2xl">
          <div className="rounded-xl border border-ice-300/20 bg-ice-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ice-200">
              Тестовый доступ
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Вход в рабочую область</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Используйте тестовые учётные данные, чтобы открыть защищённые разделы.
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-200">
              Электронная почта
              <input
                type="email"
                value={loginValue}
                onChange={(event) => setLoginValue(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/90 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-ice-300 focus:ring-4 focus:ring-ice-500/20"
                autoComplete="email"
              />
            </label>

            <label className="block text-sm font-medium text-slate-200">
              Пароль
              <input
                type="password"
                value={secretValue}
                onChange={(event) => setSecretValue(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/90 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-ice-300 focus:ring-4 focus:ring-ice-500/20"
                autoComplete="current-password"
              />
            </label>

            {error ? (
              <div className="rounded-xl border border-red-300/40 bg-red-500/12 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-ice-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-ice-600 disabled:cursor-not-allowed disabled:bg-slate-600"
            >
              {isSubmitting ? "Вход..." : "Войти"}
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/6 p-4 text-sm text-slate-300">
            <p className="font-semibold text-white">Тестовый доступ</p>
            <p className="mt-2">researcher@demo.local / demo123</p>
          </div>
        </section>
      </div>
    </main>
  );
}
