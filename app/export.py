"""Генерация evidence report в Markdown и JSON.

Отчёт включает исходный запрос, parsed query, краткий вывод, confidence,
таблицу доказательств, источники, противоречия, пробелы и timestamp.
"""
from __future__ import annotations

import json

from .models import SearchResult


def _fmt_conditions(conds) -> str:
    if not conds:
        return "—"
    return "; ".join(c.rawValue for c in conds)


def to_markdown(result: SearchResult, title: str, query: str,
                created_at: str, include_graph: bool = True,
                include_sources: bool = True,
                include_contradictions: bool = True,
                include_gaps: bool = True) -> str:
    p = result.parsedQuery
    a = result.answer
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
    lines.append(f"- **Намерение (intent):** {p.intent}")
    lines.append(f"- **Материалы:** {', '.join(p.materials) or '—'}")
    lines.append(f"- **Процессы:** {', '.join(p.processes) or '—'}")
    lines.append(f"- **Технологии:** {', '.join(p.technologies) or '—'}")
    lines.append(f"- **Свойства:** {', '.join(p.properties) or '—'}")
    lines.append(f"- **Условия:** {_fmt_conditions(p.conditions)}")
    lines.append(f"- **География:** {p.geography}")
    if p.timeRange:
        lines.append(f"- **Период:** {p.timeRange.from_ or '…'}–{p.timeRange.to or '…'}")
    lines.append("")

    # Краткий вывод
    lines.append("## Краткий вывод")
    lines.append("")
    lines.append(a.shortConclusion)
    lines.append("")
    lines.append(f"**Уровень достоверности:** `{a.confidence}` — {a.confidenceReason}")
    if a.recommendation:
        lines.append("")
        lines.append(f"**Рекомендация:** {a.recommendation}")
    if a.warnings:
        lines.append("")
        lines.append("**Предупреждения:**")
        for w in a.warnings:
            lines.append(f"- ⚠️ {w}")
    lines.append("")

    # Таблица доказательств
    lines.append("## Таблица доказательств")
    lines.append("")
    lines.append("| Claim | Условия | Эффект | Источник | Стр. | Достоверность |")
    lines.append("|---|---|---|---|---|---|")
    for c in result.evidence:
        effect = c.effect.description if c.effect else "—"
        page = c.source.page if c.source.page is not None else "—"
        text = c.text.replace("\n", " ")
        lines.append(
            f"| {text} | {_fmt_conditions(c.conditions)} | {effect} | "
            f"{c.source.sourceName} | {page} | {c.confidence} |")
    lines.append("")

    # Источники
    if include_sources and result.sources:
        lines.append("## Источники")
        lines.append("")
        for s in result.sources:
            authors = ", ".join(s.authors) if s.authors else "—"
            lines.append(
                f"- **{s.title}** ({s.type}, {s.year or 'н/д'}, {s.geography}, "
                f"надёжность: {s.reliability}) — {authors}")
            if s.excerpt:
                lines.append(f"  > {s.excerpt}")
        lines.append("")

    # Противоречия
    if include_contradictions and result.contradictions:
        lines.append("## Противоречия")
        lines.append("")
        for c in result.contradictions:
            lines.append(f"### {c.title} (`{c.status}`)")
            lines.append("")
            lines.append(c.description)
            lines.append(f"- Источник A: {c.sourceA.sourceName}, стр. {c.sourceA.page}")
            lines.append(f"- Источник B: {c.sourceB.sourceName}, стр. {c.sourceB.page}")
            lines.append("")

    # Пробелы
    if include_gaps and result.gaps:
        lines.append("## Пробелы в знаниях")
        lines.append("")
        for g in result.gaps:
            icon = "⚠️" if g.severity == "warning" else "ℹ️"
            lines.append(f"- {icon} **{g.title}** ({g.type}) — {g.description}")
        lines.append("")

    # Граф
    if include_graph and result.graph.nodes:
        lines.append("## Граф связей")
        lines.append("")
        lines.append(f"Узлов: {len(result.graph.nodes)}, связей: {len(result.graph.edges)}.")
        lines.append("")
        lines.append("```")
        for e in result.graph.edges[:40]:
            src = next((n.label for n in result.graph.nodes if n.id == e.source), e.source)
            tgt = next((n.label for n in result.graph.nodes if n.id == e.target), e.target)
            lines.append(f"{src} --[{e.relation}]--> {tgt}")
        lines.append("```")
        lines.append("")

    lines.append("---")
    lines.append("")
    lines.append("_No source — no factual claim. Каждый вывод привязан к источнику._")
    return "\n".join(lines)


def to_json(result: SearchResult, title: str, query: str, created_at: str) -> str:
    payload = {
        "title": title,
        "query": query,
        "createdAt": created_at,
        "result": result.model_dump(by_alias=True),
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)
