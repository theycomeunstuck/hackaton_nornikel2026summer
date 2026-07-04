"""Run one demo query through the Mode-B pipeline and print the SearchResult JSON.

Works OUT OF THE BOX against the tiny fixtures (builds an ephemeral index):

    python -m backend.demo                       # default: catholyte scenario
    python -m backend.demo --scenario desalination
    python -m backend.demo --scenario pgm
    python -m backend.demo --query "ваш вопрос ..."

Against a REAL index you built from the archive:

    # 1) build a dev index (fast, first 20k chunks):
    python -m backend.index build --data-root <archive_root> --db backend/data/index.sqlite --limit 20000
    # 2) query it:
    python -m backend.demo --db backend/data/index.sqlite --data-root <archive_root> \
           --query "Какая скорость потока католита оптимальна при электроэкстракции никеля?"

    # full index later (slow, all 441k chunks; add --with-mentions if needed):
    python -m backend.index build --data-root <archive_root> --db backend/data/index.sqlite
    # once parameters.jsonl is ready, point --data-root at the run that contains
    # data/extracted_with_params/parameters.jsonl and REBUILD — numeric filtering
    # upgrades from "approximate" to "structured" automatically.
"""
from __future__ import annotations

import argparse
import json
import sys
import tempfile
from pathlib import Path

from .index import build
from .retrieval.pipeline import Engine

FIXTURES = str(Path(__file__).resolve().parent / "data" / "fixtures")

SCENARIOS = {
    "desalination": "Какие методы обессоливания воды подходят для обогатительной фабрики, "
                    "если исходная вода содержит сульфаты, хлориды, Ca, Mg, Na по 200–300 мг/л, "
                    "а требуемый сухой остаток — ≤1000 мг/дм³?",
    "catholyte": "Какие технические решения организации циркуляции католита при электроэкстракции "
                 "никеля описаны в мировой практике, и какая скорость потока считается оптимальной?",
    "pgm": "Покажите все эксперименты и публикации по распределению Au, Ag и МПГ между "
           "медным/никелевым штейном и шлаком за последние 5 лет.",
}


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Mode-B RAG demo.")
    ap.add_argument("--db", help="Path to a built index. If omitted, builds an ephemeral fixture index.")
    ap.add_argument("--data-root", default=FIXTURES, help="Dir with entities/synonyms (default: fixtures).")
    ap.add_argument("--scenario", choices=list(SCENARIOS), default="catholyte")
    ap.add_argument("--query", help="Custom query (overrides --scenario).")
    ap.add_argument("--top-k", type=int, default=12)
    ap.add_argument("--now-year", type=int, default=2026, help="Reference year for 'last N years'.")
    args = ap.parse_args(argv)

    query = args.query or SCENARIOS[args.scenario]

    tmp_db = None
    if args.db:
        db_path, data_root = args.db, args.data_root
    else:
        tmp_db = tempfile.NamedTemporaryFile(suffix=".sqlite", delete=False)
        tmp_db.close()
        db_path, data_root = tmp_db.name, FIXTURES
        build(FIXTURES, db_path, with_mentions=True, verbose=False)
        print("[demo] built ephemeral fixture index (no --db given)", file=sys.stderr)

    eng = Engine(db_path, data_root, now_year=args.now_year)
    result = eng.search(query, top_k=args.top_k)
    print(json.dumps(result.to_api(), ensure_ascii=False, indent=2))
    print(f"\n[demo] mode={result.answer.numeric_mode} evidence={len(result.evidence)} "
          f"contradictions={len(result.contradictions)} gaps={len(result.gaps)} "
          f"graph_nodes={len(result.graph.nodes)}", file=sys.stderr)
    eng.close()
    if tmp_db:
        Path(tmp_db.name).unlink(missing_ok=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
