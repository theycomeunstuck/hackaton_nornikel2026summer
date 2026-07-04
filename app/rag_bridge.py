"""Мост между нашим FastAPI-бэкендом (`app`) и GraphRAG-движком (`rag`).

Делает систему единым механизмом: `/api/query` и связанные эндпоинты работают
поверх реального движка `rag.retrieval.pipeline.Engine` и пребилт-индекса
`rag/data/index.sqlite`. Если индекс недоступен — прозрачный fallback на
демо-данные из `app.query_engine` (система остаётся работоспособной на любой
машине без 5.8 ГБ индекса).

Важно про потоки: движок держит ОДНО sqlite-соединение, привязанное к потоку,
где он создан. Поэтому Engine инициализируется в startup (event loop thread), а
все обращения идут из `async def` эндпоинтов inline — на том же потоке. См.
комментарий в `rag/api.py`.
"""
from __future__ import annotations

import os
import uuid
from pathlib import Path
from typing import Any, Optional

from .models import QueryFilters

# Корень проекта и путь к индексу
_ROOT = Path(__file__).resolve().parent.parent
_DEFAULT_DB = _ROOT / "rag" / "data" / "index.sqlite"


class RagBridge:
    """Ленивая обёртка над RAG Engine с кэшом агрегатов и fallback-флагом."""

    def __init__(self, db_path: Optional[str] = None, now_year: int = 2026) -> None:
        # приоритет: явный аргумент -> env RAG_DB_PATH -> дефолт rag/data/index.sqlite
        resolved = db_path or os.environ.get("RAG_DB_PATH")
        self.db_path = Path(resolved) if resolved else _DEFAULT_DB
        self.now_year = now_year
        self.engine = None
        self.available = False
        self.scenarios: dict[str, str] = {}
        self.documents: dict[str, dict] = {}         # document_id -> doc record
        self._scenario_cache: dict[str, dict] = {}   # scenario -> to_api dict
        self._agg: dict[str, Any] = {}               # ленивый агрегат по индексу
        self.init_error: Optional[str] = None

    # -- lifecycle ------------------------------------------------------------
    def init(self) -> bool:
        """Строит Engine один раз. Вызывать на event-loop-потоке (startup)."""
        if self.engine is not None:
            return self.available
        if not self.db_path.exists():
            self.init_error = f"index not found: {self.db_path}"
            self.available = False
            return False
        try:
            from rag.demo import FIXTURES, SCENARIOS
            from rag.loader import load_documents
            from rag.retrieval.pipeline import Engine
            # Реальные (не fixtures) сущности/синонимы/документы, извлечённые из
            # nornikel.7z в rag/data/meta/ — дают читаемые имена сущностей в графе
            # и в извлечении по документу. Если их нет — движок падает на fixtures.
            meta = _ROOT / "rag" / "data" / "meta"
            ent_p = meta / "entities.jsonl"
            syn_p = meta / "synonyms.json"
            docs_p = meta / "documents.jsonl"
            self.engine = Engine(
                str(self.db_path), FIXTURES,
                entities_path=str(ent_p) if ent_p.exists() else None,
                synonyms_path=str(syn_p) if syn_p.exists() else None,
                now_year=self.now_year)
            self.documents = load_documents(str(docs_p)) if docs_p.exists() else {}
            self.scenarios = dict(SCENARIOS)
            self.available = True
        except Exception as exc:  # pragma: no cover - защита от неожиданных ошибок
            self.init_error = f"{type(exc).__name__}: {exc}"
            self.available = False
        return self.available

    def close(self) -> None:
        if self.engine is not None:
            try:
                self.engine.close()
            finally:
                self.engine = None

    # -- фильтры --------------------------------------------------------------
    @staticmethod
    def _to_rag_filters(f: Optional[QueryFilters]) -> dict:
        """Наши QueryFilters -> filters, понятные rag Engine.search().

        RAG жёстко фильтрует только: geography, time_range, source_types.
        material/process/confidence в Mode B не являются hard-фильтрами.
        """
        if not f:
            return {}
        out: dict[str, Any] = {}
        if f.geography and f.geography != "all":
            out["geography"] = "domestic" if f.geography in ("domestic", "russia") else f.geography
        if f.yearFrom or f.yearTo:
            out["time_range"] = {"from": f.yearFrom, "to": f.yearTo}
        if f.sourceTypes:
            out["source_types"] = list(f.sourceTypes)
        return out

    @staticmethod
    def _post_filter_confidence(api: dict, f: Optional[QueryFilters]) -> dict:
        """confidence RAG не фильтрует — при явном фильтре отсекаем evidence здесь."""
        if not f or not f.confidence:
            return api
        rank = {"low": 0, "medium": 1, "high": 2}
        need = rank[f.confidence]
        api["evidence"] = [e for e in api.get("evidence", [])
                           if rank.get(e.get("confidence", "low"), 0) >= need]
        keep_chunks = {e["source"].get("chunkId") for e in api["evidence"]}
        api["sources"] = [s for s in api.get("sources", [])
                          if s.get("chunkId") in keep_chunks]
        return api

    # -- основной поиск -------------------------------------------------------
    def search_api(self, query: str, top_k: int = 12,
                   filters: Optional[QueryFilters] = None) -> dict:
        """Возвращает to_api-dict (7 ключей) + queryId + mode='rag'."""
        result = self.engine.search(
            query, top_k=top_k, filters=self._to_rag_filters(filters))
        api = result.to_api()
        api = self._post_filter_confidence(api, filters)
        api["queryId"] = f"q_{uuid.uuid4().hex[:12]}"
        api["mode"] = "rag"
        return api

    # -- граф -----------------------------------------------------------------
    def graph_for(self, topic: Optional[str]) -> dict:
        if topic:
            return self.engine.search(topic, top_k=12).graph.to_api()
        # без темы — объединяем графы трёх демо-сценариев (обзор индекса)
        self._ensure_cache()
        nodes: dict[str, dict] = {}
        edges: dict[str, dict] = {}
        for api in self._scenario_cache.values():
            for n in api["graph"]["nodes"]:
                nodes[n["id"]] = n
            for e in api["graph"]["edges"]:
                edges[e["id"]] = e
        return {"nodes": list(nodes.values()), "edges": list(edges.values())}

    # -- агрегаты по индексу (ленивый кэш) ------------------------------------
    def _ensure_cache(self) -> None:
        if self._scenario_cache or not self.available:
            return
        for name, q in self.scenarios.items():
            try:
                self._scenario_cache[name] = self.engine.search(q, top_k=12).to_api()
            except Exception:
                continue

    def aggregated_sources(self) -> list[dict]:
        self._ensure_cache()
        seen: set[str] = set()
        out: list[dict] = []
        for api in self._scenario_cache.values():
            for s in api.get("sources", []):
                doc = s.get("documentId") or s.get("chunkId")
                if doc in seen:
                    continue
                seen.add(doc)
                out.append(s)
        return out

    def aggregated_contradictions(self) -> list[dict]:
        self._ensure_cache()
        seen: set[str] = set()
        out: list[dict] = []
        for api in self._scenario_cache.values():
            for c in api.get("contradictions", []):
                if c["id"] in seen:
                    continue
                seen.add(c["id"])
                out.append(c)
        return out

    def aggregated_gaps(self) -> list[dict]:
        self._ensure_cache()
        seen: set[str] = set()
        out: list[dict] = []
        for api in self._scenario_cache.values():
            for g in api.get("gaps", []):
                if g["id"] in seen:
                    continue
                seen.add(g["id"])
                out.append(g)
        return out

    # -- извлечение по одному документу --------------------------------------
    @staticmethod
    def _conf_label(x) -> str:
        try:
            v = float(x)
        except (TypeError, ValueError):
            return "medium"
        return "high" if v >= 0.75 else "medium" if v >= 0.5 else "low"

    @staticmethod
    def _bucket(entity_type: str) -> Optional[str]:
        t = (entity_type or "").lower()
        if t in ("material", "reagent", "waste", "product"):
            return "materials"
        if t in ("process", "technology", "experiment"):
            return "processes"
        if t == "equipment":
            return "equipment"
        if t in ("parameter", "metric", "property"):
            return "properties"
        if t in ("person", "expert", "author", "organization"):
            return "experts"
        return None   # Condition/Unknown — числовой шум, пропускаем

    def document_extraction(self, document_id: str) -> Optional[dict]:
        """Реальная выжимка по одному документу из индекса: сущности (по типам),
        числовые параметры, типизированные связи и выводы-предложения. Источник
        каждого элемента — сам документ. Возвращает None, если документа нет."""
        idx = self.engine.index
        ent = self.engine.entities
        rows = idx.con.execute(
            "SELECT chunk_id, page, section_title, source_name FROM chunks "
            "WHERE document_id=? ORDER BY page", (document_id,)).fetchall()
        if not rows:
            return None
        # ограничиваем IN-запросы (лимит переменных SQLite + стоимость)
        chunk_ids = [r["chunk_id"] for r in rows][:2000]

        buckets: dict[str, list[str]] = {
            "materials": [], "processes": [], "equipment": [],
            "properties": [], "experts": []}
        seen_name = {k: set() for k in buckets}

        def add_entity(eid: str) -> None:
            b = self._bucket(ent.type_of(eid))
            if not b:
                return
            name = ent.name_of(eid)
            if (not name or name == eid or name.startswith("ent_")
                    or name.startswith("numeric_value") or ":" in name):
                return   # ":" помечает числовые Condition-сущности ("извлечение: 20 %")
            if name in seen_name[b]:
                return
            seen_name[b].add(name)
            buckets[b].append(name)

        # --- связи (типизированные) + попутно собираем сущности ---
        rels = idx.relations_for_chunks(chunk_ids, cap=600)
        out_rels: list[dict] = []
        seen_rel: set = set()
        for r in rels:
            add_entity(r["source_entity_id"])
            add_entity(r["target_entity_id"])
            if r["type"] == "MENTIONED_WITH":
                continue   # шумовой тип — только для обнаружения сущностей
            s, t = ent.name_of(r["source_entity_id"]), ent.name_of(r["target_entity_id"])
            if (not s or not t or s == t                       # петли отбрасываем
                    or s.startswith(("ent_", "numeric_value"))
                    or t.startswith(("ent_", "numeric_value"))
                    or ":" in s or ":" in t):
                continue
            key = (s, r["type"], t)
            if key in seen_rel:
                continue
            seen_rel.add(key)
            out_rels.append({
                "id": r.get("relation_id") or f"r_{len(out_rels)}",
                "from": s, "relation": r["type"], "to": t,
                "confidence": self._conf_label(r.get("confidence"))})
            if len(out_rels) >= 40:
                break

        # --- числовые параметры (dedup по raw_value+unit) ---
        params_by_chunk = idx.parameters_for_chunks(chunk_ids)
        out_params: list[dict] = []
        seen_p: set = set()
        for plist in params_by_chunk.values():
            for p in plist:
                raw = (p.get("raw_value") or "").strip()
                unit = p.get("unit") or None
                if not raw or (raw, unit) in seen_p:
                    continue
                seen_p.add((raw, unit))
                nm = p.get("name") or ""
                if not nm or nm == "numeric_value":
                    nm = f"числовой параметр ({unit})" if unit else "числовой параметр"
                norm = p.get("min") if p.get("min") is not None else p.get("value")
                out_params.append({
                    "id": f"p_{len(out_params)}", "name": nm, "value": raw,
                    "unit": unit, "normalizedValue": norm,
                    "normalizedUnit": unit, "sourceText": raw})
                if len(out_params) >= 60:
                    break
            if len(out_params) >= 60:
                break

        # --- выводы: предложения-доказательства из связей с наиб. confidence ---
        out_concl: list[dict] = []
        seen_c: set = set()
        for r in sorted((x for x in rels if x["type"] != "MENTIONED_WITH"),
                        key=lambda x: -(x.get("confidence") or 0.0)):
            txt = (r.get("evidence_text") or "").strip()
            if len(txt) < 20 or txt[:80] in seen_c:
                continue
            seen_c.add(txt[:80])
            out_concl.append({
                "id": f"cc_{len(out_concl)}", "claim": txt,
                "confidence": self._conf_label(r.get("confidence")),
                "sourceIds": [document_id]})
            if len(out_concl) >= 8:
                break

        for k in buckets:
            buckets[k] = sorted(buckets[k])[:20]
        return {"documentId": document_id, "entities": buckets,
                "parameters": out_params, "conclusions": out_concl,
                "relations": out_rels}

    # -- карточка источника ---------------------------------------------------
    _TYPE_MAP = {"publication": "publication", "internal_report": "report",
                 "reference": "report", "dataset": "experiment"}
    _GEO_MAP = {"domestic": "russia", "foreign": "foreign"}

    def source_detail(self, document_id: str) -> Optional[dict]:
        """Карточка источника из documents.jsonl + первый чанк как excerpt.
        None, если документа нет ни в метаданных, ни в индексе."""
        doc = self.documents.get(document_id)
        row = self.engine.index.con.execute(
            "SELECT source_name, year, source_type, geography, text FROM chunks "
            "WHERE document_id=? ORDER BY page LIMIT 1", (document_id,)).fetchone()
        if doc is None and row is None:
            return None
        get = (doc or {}).get
        stype = get("source_type") or (row["source_type"] if row else "") or ""
        lang = get("language") or "ru"
        excerpt = (row["text"] or "")[:300].strip() if row else None
        return {
            "id": document_id,
            "title": get("title") or get("source_name")
                     or (row["source_name"] if row else document_id),
            "type": self._TYPE_MAP.get(stype, "report"),
            "year": get("year") or (row["year"] if row else None),
            "language": lang if lang in ("ru", "en") else "other",
            "geography": self._GEO_MAP.get(
                get("geography") or (row["geography"] if row else ""), "unknown"),
            "authors": [],
            "reliability": "high" if stype in ("internal_report", "reference")
                           else "medium" if stype == "publication" else "low",
            "excerpt": excerpt,
            "url": None,
            "documentId": document_id,
            "relatedClaimIds": [],
        }

    # -- dashboard ------------------------------------------------------------
    def stats(self) -> dict:
        return self.engine.index.stats() if self.available else {}

    def dashboard(self) -> dict:
        self._ensure_cache()
        raw = self.stats()

        def _int(v) -> int:
            try:
                return int(v)
            except (TypeError, ValueError):
                return 0

        # все evidence по трём сценариям
        all_ev: list[dict] = []
        edges = 0
        for api in self._scenario_cache.values():
            all_ev.extend(api.get("evidence", []))
            edges += len(api.get("graph", {}).get("edges", []))
        rank = {"low": 1, "medium": 2, "high": 3}
        label = {1: "low", 2: "medium", 3: "high"}
        avg = (round(sum(rank.get(e.get("confidence", "low"), 1) for e in all_ev)
                     / len(all_ev)) if all_ev else 2)

        contradictions = self.aggregated_contradictions()
        gaps = self.aggregated_gaps()
        cards = [
            {"label": "Чанков в индексе", "value": _int(raw.get("chunk_count"))},
            {"label": "Связей (relations)", "value": _int(raw.get("relation_count"))},
            {"label": "Параметров", "value": _int(raw.get("parameter_count"))},
            {"label": "Источников (demo)", "value": len(self.aggregated_sources())},
            {"label": "Evidence (demo)", "value": len(all_ev)},
            {"label": "Противоречий", "value": len(contradictions)},
            {"label": "Пробелов", "value": len(gaps)},
            {"label": "Ср. достоверность", "value": label.get(avg, "medium")},
        ]
        recent = sorted(all_ev, key=lambda e: e.get("source", {}).get("year") or 0,
                        reverse=True)[:5]
        domains = {
            "hydrometallurgy": len(self._scenario_cache.get("catholyte", {}).get("evidence", [])),
            "ecology": len(self._scenario_cache.get("desalination", {}).get("evidence", [])),
            "pyrometallurgy": len(self._scenario_cache.get("pgm", {}).get("evidence", [])),
            "waste_processing": 0,
        }
        return {
            "mode": "rag",
            "cards": cards,
            "indexStats": {k: raw.get(k) for k in
                           ("chunk_count", "relation_count", "mention_count",
                            "parameter_count", "has_parameters")},
            "domainsCoverage": domains,
            "priorityGaps": [g for g in gaps if g.get("severity") == "warning"],
            "recentClaims": recent,
        }


# единый экземпляр на процесс
bridge = RagBridge()
