# Decision Log — Docs Strategy + Agent MCP

**Council:** 2026-05-20
**CEO:** Claude (Opus 4.7, 1M)
**User:** Dominic da Costa (dominic.dacosta@upmind.com)
**Repo:** upmind/upmind-monorepo
**Source branch:** `feature/graphify+docs` — this decision and its artifacts sit on top of that branch. Stories under FE-2748 should branch from `feature/graphify+docs` (not `develop`) until it is merged, or rebase onto `develop` after merge.
**Status:** saved — pending user review before SDD handoff
**Linear epic:** [FE-2748](https://linear.app/upmind-automation/issue/FE-2748/epic-headless-docs-platform-v1-corpus-mcp)

## Verdict tally

| Seat | Model | Verdict |
|---|---|---|
| principal-engineer | Opus | BLOCK-REPLACE |
| product-manager | Opus | BLOCK-REPLACE |
| integration-engineer | Opus | CONCERNS |
| technical-writer | Opus | CONCERNS |
| ui-ux-designer | Sonnet | CONCERNS |
| accessibility-specialist | Sonnet | CONCERNS |
| platform-engineer | Sonnet | APPROVE-KEEP-VITEPRESS |

**Net:** 6 of 7 say the current architecture cannot stand. Even the lone "keep" proposes wholesale CI/pipeline rework.

## Decision

**Adopt a single-corpus, multi-renderer architecture. Demote VitePress from "the docs platform" to "one human renderer among two consumers of a typed corpus." MCP is a peer renderer, not a bolt-on.**

```
       ┌─ TSDoc in packages/*/src/**           ┐
       ├─ Authored MDX in docs/content/**      │
       │  (frontmatter: id, audience, module,  │
       │   status, last-verified-against)      ├─→  one extractor  ─→  docs corpus
       ├─ ADRs (docs/adr/**)                   │    (typed JSON +         │
       ├─ graphify graph (graphify-out/)       │     content tree)        │
       └─ Executable examples (examples/**)    ┘                          │
                                                                         │
                              ┌──────────────────────────────────────────┤
                              ▼                                          ▼
                  Human renderer (static site)           MCP server (peer renderer)
                  search_docs(), get_symbol(),           same corpus, structured tool surface
                  get_guide(), get_adr(), get_changelog()  for agents — JSON, not scraped HTML
```

## Binding decisions

1. **Single source of truth = the corpus.** TSDoc + authored MDX + ADRs + graphify + executable examples → one extractor → typed corpus. VitePress (or replacement) and MCP both consume the corpus. They never read each other.
2. **MCP tool surface (initial cut):** `search_docs`, `get_symbol`, `get_guide`, `list_examples`, `get_related`, `get_changelog`. JSON-structured returns (except `get_guide` which is CommonMark with section anchors).
3. **Module is the unit of authorship, not the symbol.** ADR-019's module-doc shape (Operations, Gotchas, Coordination) is the spine. TypeDoc demoted to one input among several.
4. **IA is audience-first, not folder-first.** Top-level nav: Learn / Build / Contribute / Reference / Changelog. DEVX.md absorbed into Contribute, removed from repo root.
5. **Drift prevention is mechanical:**
   - `api.json` committed; CI diff-checks on every MR — non-`allow_failure`.
   - Every `@example` block is a real file, type-checked in CI against package exports.
   - Every authored doc carries `last-verified-against-commit` frontmatter; CI fails if it references symbols no longer present.
   - Ban Vue components in authored MDX (or compile-away pre-index).
6. **The `(docs) build` job loses `allow_failure: true`.** Stale docs must block merges.
7. **a11y guarantees travel with the chosen platform**, not its defaults: skip-link, native `<button>`/`<a>`, `<dialog>` for modals, focusable code-copy with `aria-label`, WCAG 2.2 SC 2.4.11 focus rings, validated TypeDoc heading hierarchy.
8. **Scope: docs only.** `ANALYSIS.md`, `ARCHITECTURE_PROPOSAL.md`, `IMPLEMENTATION_PLAN.md`, `plans/` are project ephemera — they leave the docs tree.

## Unresolved → escalated to user

**VitePress vs Starlight (Astro) as the human renderer.** Platform & integration: keep VitePress (CI already in place). UI/UX & a11y: Starlight materially better a11y + audience-aware IA out of the box. Principal/PM: indifferent on renderer once the corpus exists.

**CEO recommendation:** 1-day Starlight spike against the corpus contract before committing. Corpus design is renderer-independent — spike can run in parallel.

## Deferred

| Item | Revisit when |
|---|---|
| Vector/semantic search index | Corpus exists and lexical FTS proves insufficient |
| Public MCP endpoint for external devs | Internal MCP stabilises; ship internal-first |
| DTO versioning layer between TypeDoc reflection and MCP `get_symbol` response | At corpus-schema design step |

## Open questions surfaced by seats (for SDD or follow-up)

- **(integration → tech-writer)** Can authors live with banned Vue components + mandatory executable examples?
- **(platform → integration)** Minimum per-document schema for usefulness without a live vector store?
- **(tech-writer → integration)** Can one corpus artifact feed both renderers without two pipelines?
- **(ui/ux → tech-writer)** Which content layer is engineers actually keeping current today? — **Recon answer: `.agent/rules/` + ADRs, NOT TSDoc.** This is where editorial weight should land.

## Emergent insights worth remembering

- The team has already invented the right writing-standard primitive (ADR-019 module-doc shape) — the docs platform should serve it, not fight it.
- `.agent/rules/code-reviews.md` contains the literal note "Distilled version of DEVX.md. Keep both in sync" — a smoking gun for current manual drift.
- `graphify-out/` (2134 nodes / 6383 edges) is an existing structural representation of the codebase that should feed the corpus as the relations source.
- Four parallel content stores currently drift: `docs/`, `DEVX.md`, `packages/*/docs/`, `.agent/rules/`. Consolidation is the work.

## Next step

User wants to review this decision in detail before handing off to `spec-driven-development`. SDD is NOT yet authorised.

## Council artifacts

- Brief: [brief.md](./brief.md)
- Log: this file
- Run mode: parallel Agent subagents (no live teammate messaging in this environment)
- Round 2 cross-talk: skipped (structural convergence sufficient)
- Original council working directory (CEO-local, not authoritative): `~/.claude/councils/2026-05-20-docs-strategy-mcp/`
