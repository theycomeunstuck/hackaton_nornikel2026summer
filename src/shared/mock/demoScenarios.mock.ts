import type { DemoScenario } from "../types/search";

export const demoScenarios: DemoScenario[] = [
  {
    id: "water-desalination",
    title: "Обессоливание воды",
    description:
      "Подбор технологической схемы для воды с сульфатами, хлоридами, Ca, Mg и Na при требовании по сухому остатку.",
    defaultQuery:
      "Какая технология подходит для обессоливания воды с сульфатами и хлоридами 200-300 мг/л, Ca/Mg/Na и сухим остатком не выше 1000 мг/дм3?",
    searchResultId: "result-water-desalination",
    tags: ["desalination", "sulfates", "chlorides", "dry residue"],
  },
  {
    id: "nickel-catholyte-circulation",
    title: "Циркуляция католита при электроэкстракции никеля",
    description:
      "Оценка диапазона циркуляции католита, оборудования и параметров процесса для устойчивого катодного осаждения никеля.",
    defaultQuery:
      "Какой диапазон скорости циркуляции католита оптимален при электроэкстракции никеля и где есть противоречия в источниках?",
    searchResultId: "result-nickel-catholyte-circulation",
    tags: ["nickel electrowinning", "catholyte", "flow velocity"],
  },
  {
    id: "pgm-matte-slag-distribution",
    title: "Au / Ag / МПГ между штейном и шлаком",
    description:
      "Evidence review по распределению драгоценных металлов между медным/никелевым штейном и шлаком за последние 5 лет.",
    defaultQuery:
      "Что известно за последние 5 лет о распределении Au, Ag и МПГ между медным и никелевым штейном и шлаком?",
    searchResultId: "result-pgm-matte-slag-distribution",
    tags: ["Au", "Ag", "PGM", "matte", "slag"],
  },
];
