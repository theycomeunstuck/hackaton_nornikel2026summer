import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../entities/auth/model";
import type { LoginRequest } from "../../entities/auth/types";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

const demoCredentials: LoginRequest = {
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
  const [email, setEmail] = useState(demoCredentials.email);
  const [password, setPassword] = useState(demoCredentials.password);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate(getRedirectPath(location.state), { replace: true });
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Не удалось выполнить demo-вход.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-graphite-950 px-10 py-10 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl grid-cols-[minmax(0,1fr)_440px] items-center gap-12">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ice-300">
            Научный клубок
          </p>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight">
            Evidence-first поиск научно-технических утверждений, источников,
            противоречий и пробелов.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300">
            Demo-доступ открывает промышленный R&D workspace: dashboard, поиск
            доказательств, граф знаний, источники, gaps, contradictions и экспорт
            отчётов.
          </p>

          <div className="mt-8 grid max-w-4xl grid-cols-3 gap-4">
            {[
              ["Claims", "утверждения с confidence"],
              ["Sources", "страницы и chunks"],
              ["Graph", "связи материалов и процессов"],
            ].map(([title, description]) => (
              <div key={title} className="rounded border border-white/10 bg-white/8 p-4">
                <p className="text-lg font-semibold text-white">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded border border-white/12 bg-white/10 p-6 shadow-glass backdrop-blur-2xl">
          <div className="rounded border border-ice-300/20 bg-ice-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ice-200">
              Demo access
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Вход в систему</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Используйте demo credentials для локальной авторизации без backend.
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-200">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded border border-white/10 bg-white/90 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-ice-300 focus:ring-4 focus:ring-ice-500/20"
                autoComplete="email"
              />
            </label>

            <label className="block text-sm font-medium text-slate-200">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded border border-white/10 bg-white/90 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-ice-300 focus:ring-4 focus:ring-ice-500/20"
                autoComplete="current-password"
              />
            </label>

            {error ? (
              <div className="rounded border border-red-300/40 bg-red-500/12 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded bg-ice-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-ice-600 disabled:cursor-not-allowed disabled:bg-slate-600"
            >
              {isSubmitting ? "Входим..." : "Войти"}
            </button>
          </form>

          <div className="mt-5 rounded border border-white/10 bg-white/6 p-4 text-sm text-slate-300">
            <p className="font-semibold text-white">Demo credentials</p>
            <p className="mt-2">researcher@demo.local / demo123</p>
          </div>
        </section>
      </div>
    </main>
  );
}
