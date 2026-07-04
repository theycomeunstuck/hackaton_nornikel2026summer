# `subject/` fixture — subject-linked numeric contradictions

Demo-only fixture for `test_subject_qualified_numeric_contradiction`. It proves
that the Mode-B contradiction detector recovers a **real same-subject** numeric
conflict while avoiding cross-subject false positives — the behaviour that the
full `nornikel.7z` index cannot yet exercise because its extracted parameter
names are bare (`содержание` with no subject; see `docs/ROADMAP.md`).

Four chunks in four documents, each with one structured parameter:

| doc | parameter name | value | expectation |
|-----|----------------|-------|-------------|
| `24_statya.docx` | `содержание железа` | `свыше 50 %` | ⟶ contradiction with `cm_01_24.pdf` |
| `cm_01_24.pdf` | `содержание железа` | `10–15 %` | ⟶ contradiction with `24_statya.docx` |
| `cm_07_23.pdf` | `содержание кремния` | `30 %` | different subject → **not** compared to Fe |
| `cm_09_23.pdf` | `содержание` (bare) | `99 %` | no subject → **never** compared |

Expected: exactly one contradiction — `содержание железа` 50 % vs 10–15 %,
`status: needs_review`, two real `SourceRef`s from different documents.
