import type { Contradiction } from "../../entities/contradiction/types";
import { sourceRefs } from "./sources.mock";

export const waterContradictions: Contradiction[] = [];

export const nickelContradictions: Contradiction[] = [
  {
    id: "contradiction-nickel-flow-window",
    scenarioId: "nickel-catholyte-circulation",
    title: "Разный верхний предел скорости циркуляции католита",
    description:
      "Пилотный протокол допускает устойчивую работу до 0.45 m/s, а обзор гидродинамики указывает риск турбулентного срыва и ухудшения осадка выше 0.35 m/s.",
    severity: "moderate",
    claimIds: ["claim-nickel-optimal-range", "claim-nickel-upper-limit"],
    conflictingStatements: [
      "Рабочее окно 0.25-0.45 m/s стабилизирует массоперенос без ухудшения катодного осадка.",
      "При скоростях выше 0.35 m/s возрастает риск локальной турбулентности у кромки катода.",
    ],
    sourceRefs: [sourceRefs.nickelCatholytePage9, sourceRefs.nickelHydroPage11],
    confidence: "medium",
    resolutionHint:
      "Проверить геометрию ячейки, расстояние между электродами и фактическую настройку насосов в конкретной линии.",
  },
];

export const pgmContradictions: Contradiction[] = [];

export const mockContradictions: Contradiction[] = [
  ...waterContradictions,
  ...nickelContradictions,
  ...pgmContradictions,
];
