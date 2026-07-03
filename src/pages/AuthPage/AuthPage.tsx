import { PagePlaceholder } from "../../shared/ui/PagePlaceholder";

export function AuthPage() {
  return (
    <PagePlaceholder
      eyebrow="Access"
      title="Вход"
      description="Вторичный placeholder для будущего контура доступа. Авторизация в этой итерации не реализуется."
      metrics={[
        { label: "Mode", value: "Demo", tone: "cyan" },
        { label: "Auth", value: "Later", tone: "amber" },
        { label: "Roles", value: "Planned", tone: "cyan" },
        { label: "Access", value: "Open", tone: "green" },
      ]}
    >
      <h3 className="text-xl font-semibold text-slate-950">Auth не входит в Task 1</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Экран нужен только как вторичный маршрут в shell, без форм входа и backend-вызовов.
      </p>
    </PagePlaceholder>
  );
}
