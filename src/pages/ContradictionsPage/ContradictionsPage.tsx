import { PagePlaceholder } from "../../shared/ui/PagePlaceholder";

export function ContradictionsPage() {
  return (
    <PagePlaceholder
      eyebrow="Contradictions"
      title="Противоречия и слабые утверждения"
      description="Раздел для конфликтующих claims, спорных параметров, несовместимых выводов и утверждений с низкой доказательной поддержкой."
      metrics={[
        { label: "Critical", value: "1", tone: "red" },
        { label: "Review", value: "3", tone: "amber" },
        { label: "Weak", value: "14", tone: "amber" },
        { label: "Resolved", value: "6", tone: "green" },
      ]}
    >
      <h3 className="text-xl font-semibold text-slate-950">Фокус экспертизы</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Здесь будет удобно быстро увидеть, где источники расходятся и какие выводы
        нельзя переносить в отчет без дополнительной проверки.
      </p>
    </PagePlaceholder>
  );
}
