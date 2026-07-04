"""Генерация evidence report в Markdown и JSON.

Принимает `to_api`-словарь `SearchResult` (единый контракт из 7 ключей), поэтому
работает одинаково и для RAG-движка, и для демо-данных. Все обращения через
`.get()` — устойчиво к отсутствию отдельных полей (effect/materials/reliability).
"""
from __future__ import annotations

import json
from typing import Any


def _conds(conds: list[dict] | None) -> str:
    if not conds:
        return "—"
    return "; ".join(c.get("rawValue") or c.get("name") or "" for c in conds)


def _label_for(nid: str, nodes: list[dict]) -> str:
    for n in nodes:
        if n.get("id") == nid:
            return n.get("label", nid)
    return nid


def to_markdown(result: dict[str, Any], title: str, query: str,
                created_at: str, include_graph: bool = True,
                include_sources: bool = True,
                include_contradictions: bool = True,
                include_gaps: bool = True) -> str:
    p = result.get("parsedQuery", {})
    a = result.get("answer", {})
    lines: list[str] = []
    lines.append(f"# {title}")
    lines.append("")
    lines.append(f"> Evidence report · Научный клубок · сгенерирован {created_at}")
    lines.append("")
    lines.append(f"**Исходный запрос:** {query}")
    lines.append("")

    # Как система поняла запрос
    lines.append("## Как система поняла запрос")
    lines.append("")
    lines.append(f"- **Намерение (intent):** {p.get('intent', '—')}")
    lines.append(f"- **Материалы:** {', '.join(p.get('materials') or []) or '—'}")
    lines.append(f"- **Процессы:** {', '.join(p.get('processes') or []) or '—'}")
    lines.append(f"- **Технологии:** {', '.join(p.get('technologies') or []) or '—'}")
    lines.append(f"- **Свойства:** {', '.join(p.get('properties') or []) or '—'}")
    lines.append(f"- **Условия:** {_conds(p.get('conditions'))}")
    lines.append(f"- **География:** {p.get('geography', '—')}")
    tr = p.get("timeRange")
    if tr:
        lines.append(f"- **Период:** {tr.get('from') or '…'}–{tr.get('to') or '…'}")
    lines.append("")

    # Краткий вывод
    lines.append("## Краткий вывод")
    lines.append("")
    lines.append(a.get("shortConclusion", "—"))
    lines.append("")
    lines.append(f"**Уровень достоверности:** `{a.get('confidence', 'low')}` — "
                 f"{a.get('confidenceReason', '')}")
    if a.get("numericMode"):
        lines.append("")
        lines.append(f"**Режим числовой фильтрации:** `{a.get('numericMode')}`")
    if a.get("recommendation"):
        lines.append("")
        lines.append(f"**Рекомендация:** {a['recommendation']}")
    if a.get("warnings"):
        lines.append("")
        lines.append("**Предупреждения:**")
        for w in a["warnings"]:
            lines.append(f"- ⚠️ {w}")
    lines.append("")

    # Таблица доказательств
    lines.append("## Таблица доказательств")
    lines.append("")
    lines.append("| Утверждение | Условия | Источник | Стр. | Достоверность |")
    lines.append("|---|---|---|---|---|")
    for c in result.get("evidence", []):
        src = c.get("source", {})
        page = src.get("page") if src.get("page") is not None else "—"
        text = (c.get("text") or "").replace("\n", " ").replace("|", "\\|")
        lines.append(
            f"| {text} | {_conds(c.get('conditions'))} | "
            f"{src.get('sourceName', '—')} | {page} | {c.get('confidence', '—')} |")
    lines.append("")

    # Источники
    if include_sources and result.get("sources"):
        lines.append("## Источники")
        lines.append("")
        for s in result["sources"]:
            title_s = s.get("title") or s.get("sourceName") or s.get("documentId", "—")
            meta = []
            if s.get("type") or s.get("sourceType"):
                meta.append(str(s.get("type") or s.get("sourceType")))
            if s.get("year"):
                meta.append(str(s["year"]))
            if s.get("geography"):
                meta.append(str(s["geography"]))
            if s.get("reliability"):
                meta.append(f"надёжность: {s['reliability']}")
            authors = ", ".join(s.get("authors") or []) if s.get("authors") else ""
            suffix = f" — {authors}" if authors else ""
            lines.append(f"- **{title_s}** ({', '.join(meta) or 'н/д'}){suffix}")
            if s.get("chunkId"):
                lines.append(f"  · chunk: `{s['chunkId']}`"
                             + (f", стр. {s['page']}" if s.get("page") else ""))
            if s.get("excerpt"):
                lines.append(f"  > {s['excerpt']}")
        lines.append("")

    # Противоречия
    if include_contradictions and result.get("contradictions"):
        lines.append("## Противоречия")
        lines.append("")
        for c in result["contradictions"]:
            lines.append(f"### {c.get('title', 'Противоречие')} (`{c.get('status', 'possible')}`)")
            lines.append("")
            lines.append(c.get("description", ""))
            sa, sb = c.get("sourceA", {}), c.get("sourceB", {})
            lines.append(f"- Источник A: {sa.get('sourceName', '—')}, стр. {sa.get('page', '?')}")
            lines.append(f"- Источник B: {sb.get('sourceName', '—')}, стр. {sb.get('page', '?')}")
            lines.append("")

    # Пробелы
    if include_gaps and result.get("gaps"):
        lines.append("## Пробелы в знаниях")
        lines.append("")
        for g in result["gaps"]:
            icon = "⚠️" if g.get("severity") == "warning" else "ℹ️"
            lines.append(f"- {icon} **{g.get('title', '')}** ({g.get('type', '')}) — "
                         f"{g.get('description', '')}")
        lines.append("")

    # Граф
    graph = result.get("graph", {})
    if include_graph and graph.get("nodes"):
        nodes = graph.get("nodes", [])
        edges = graph.get("edges", [])
        lines.append("## Граф связей")
        lines.append("")
        lines.append(f"Узлов: {len(nodes)}, связей: {len(edges)}.")
        lines.append("")
        lines.append("```")
        for e in edges[:40]:
            src = _label_for(e.get("source"), nodes)
            tgt = _label_for(e.get("target"), nodes)
            lines.append(f"{src} --[{e.get('relation', '')}]--> {tgt}")
        lines.append("```")
        lines.append("")

    lines.append("---")
    lines.append("")
    lines.append("_No source — no factual claim. Каждый вывод привязан к источнику._")
    return "\n".join(lines)


def to_json(result: dict[str, Any], title: str, query: str, created_at: str) -> str:
    payload = {
        "title": title,
        "query": query,
        "createdAt": created_at,
        "result": result,
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)
