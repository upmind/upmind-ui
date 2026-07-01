# ADR 026: Mintlify as the Docs Renderer over a Drift-Gated Corpus

**Date:** June 2026
**Status:** Accepted
**Authors:** Dominic da Costa
**Related:**
- Council decision log: `~/.claude/councils/2026-06-27-mintlify-docs-incorporation/log.md` (full rationale, verdicts, execution plan)
- Linear epic: [FE-2748](https://linear.app/upmind-automation/issue/FE-2748)
- Supersedes the *self-hosted-only* binding constraint of the 2026-05-20 docs-strategy-mcp council
- [ADR-019](019-module-doc-shape.md) — module-doc shape (remains the spine for reference content)

---

## Context

The 2026-05-20 docs-strategy-mcp council chose a **single-corpus, multi-renderer** architecture for FE-2748: a typed JSON corpus built from TSDoc + authored MDX + ADRs + the graphify graph + executable examples, consumed by two renderers — a self-hosted static site (VitePress vs Starlight, TBD) and a custom MCP server for AI agents — with CI drift gates making staleness structurally impossible. A *binding constraint* of that decision was **self-hosted only; SaaS docs platforms (Mintlify, ReadMe, GitBook) were explicitly out of scope.**

Since then the organisation has **standardised on Mintlify company-wide.** That reverses the self-hosted-only constraint. A second council was convened on 2026-06-27 to decide how to incorporate Mintlify without losing the reason the epic exists. Nothing in FE-2748 had been built (all issues `Todo`), so no work was sunk.

Two constraints were fixed by the product owner going in and are not relitigated here:
1. **The drift guarantee is non-negotiable.** "Staleness structurally impossible" is the #1 pain and the reason the epic exists. Mintlify is a renderer + AI layer, not a freshness engine — it cannot compile code examples or detect code/API drift.
2. **Company-wide instance.** This headless/developer-docs effort is one section inside a shared Mintlify property (an existing, linked, public git repo) and must coexist with other teams' docs.

Seven role-specialised seats debated; verdict was **7× CONCERNS, 0 BLOCK** — unanimous on the architecture, with concerns confined to governance, scope discipline, and verification.

---

## Decision

**Adopt "Pole B": the drift-gated corpus pipeline remains the source of truth; Mintlify becomes the human renderer + free AI surface, fed generated MDX. The corpus + CI drift gates are the product; Mintlify is a swappable rendering target.**

Twelve binding decisions (condensed; full text in the council log):

1. **Source of truth = code/TSDoc + hand-authored MDX in our GitLab repo.** The corpus JSON is a *derived build artifact*, never authored. The Mintlify repo is a *publish target*, never a source.
2. **Reuse the existing TypeDoc-markdown pipeline** (`docs/typedoc.json` already emits 200+ files from `packages/headless`). Do not greenfield an extractor; do not over-engineer a corpus schema.
3. **Drift gates run in our GitLab CI before publish** — three blocking (`allow_failure: false`) gates: examples compile/type-check, API/symbol drift, authorship guard. Emit is `needs:`-blocked on gates-green. Flip the existing `(docs) build` job off `allow_failure: true`.
4. **Directory-enforced generated/authored partition.** `reference/**` + `changelog/**` = generated, machine-owned; `learn/**` `build/**` `contribute/**` = hand-authored. A blocking regen-and-compare gate fails the MR if a generated file is hand-edited.
5. **Provenance frontmatter on every generated page** (`generated: true`, `corpus_version`, `built_at`, plus `id/audience/module/status/last-verified-against-commit`). Makes the gated/un-gated boundary machine-detectable on the live site and via the hosted MCP. (Net-new: no authored doc carries frontmatter today.)
6. **MCP — split.** External agent surface = Mintlify's hosted `/mcp` + `/llms-full.txt`, adopted as-is (build nothing). The structured MCP (`get_symbol`/`get_related`/`get_changelog`/`list_examples`) survives **internal-only**, reading the corpus JSON for in-repo coding agents — never hosted, no public contract. No public structured MCP.
7. **The corpus only earns its keep iff it carries symbol-level relation edges (graphify) + symbol-keyed changelog** — the justification for the internal structured MCP. It does, so both survive; the corpus must model relations as first-class.
8. **Publish = PR-bot via SSH deploy key into a CODEOWNERS-fenced path, not push-to-main.** `origin` is self-hosted `git.upmind.io`; the Mintlify repo is a separate public repo — a cross-repo/cross-host push. The pattern already exists (`.gitlab-ci.yml:104-137`, used to push submodules to GitHub). Our CI is sole writer to our fenced path; `docs.json` is split via `$ref`.
9. **Atomic publish + staging preview + freshness canary.** Publish runs only on gates-green; the bot PR auto-gets a Mintlify preview deployment (branched staging) for optional human review; default is auto-merge on green. A post-publish canary asserts the live `/llms.txt` `corpus_version` matches the build, failing loudly on lag.
10. **OpenAPI playground — consume, never author; out of v1 if no spec exists.** No canonical frontend-owned OpenAPI spec exists today (the only signal is `docs/workshop/build-your-own-core.md:201`). Open it as a dependency-verification gate first; do not generate OpenAPI from the TS corpus.
11. **a11y splits into ENFORCE (our MDX emitter: heading hierarchy, link text, code titles, alt text, semantic callouts) vs VERIFY (Mintlify's chrome, via axe-core + pa11y in CI against the PR-preview URL, blocking on critical/serious).**
12. **Coexistence: we own one top-level entry + everything beneath it; the shared `docs.json` root, theme, and versioning are platform-owned.** Our audience IA (Learn/Build/Contribute/Reference/Changelog) is realised as tabs/groups inside our entry.

---

## Consequences

- **Positive — less to build.** Mintlify deletes the renderer work entirely (FE-2757 dies) and shrinks the extractor and renderer-implementation issues. The static site, search, "Ask AI" chat, `/llms.txt`, hosted doc-search MCP, and an interactive API playground all come free.
- **Positive — the guarantee is sharper.** The retained work is exactly the part that justified the epic (the drift gates), now smaller and with a clearer seam: gates in our CI, publish only on green.
- **Trade-off — we no longer own the renderer.** Theme, top-level chrome, and built-in component a11y are Mintlify's. a11y guarantees shift from *enforce* to *verify* (axe/pa11y in CI); an a11y verification spike gates content migration. Custom React injection is unavailable on non-Enterprise plans.
- **Trade-off — co-tenant repo + lock-in.** Our generated section shares a public repo with other teams; mitigated by a CODEOWNERS-fenced path and CI-sole-writer discipline. MDX + OpenAPI remain portable; `docs.json` nav config and the AI/playground features are captive.
- **Risk — dual-authoring & silent-publish drift** (the #1 pain via a back door). Mitigated by the directory partition + authorship guard (decision 4), provenance frontmatter (5), and atomic publish + freshness canary (9).
- **Non-negotiable retained:** the drift guarantee. Everything Mintlify provides free is deleted from scope and consumed; everything Mintlify cannot do (example compilation, API/code drift, the typed structured MCP) is kept.

### FE-2748 issue re-map

`DIE`: FE-2757 (renderer spike). `SHRINK`: FE-2752, FE-2756, FE-2758. `SURVIVE`: FE-2749, FE-2753, FE-2754, FE-2755. `SPLIT`: FE-2750, FE-2760. `SCOPED`: FE-2751, FE-2759. `NEW`: coexistence-contract + placement, publish-path (PR-bot), a11y verification spike, OpenAPI dependency-gate (v2), authorship guard. Plus a chore: reconcile the "Gotchas" (ADR-019) vs "Lessons (hard-won)" (`.agent/rules/docs-modules.md`) terminology before the corpus emits it.

### Open items

- **Top-level placement** in the company-wide Mintlify (own `product`/tab entry vs nested) — to be negotiated with the platform owner; push for an owned entry.
- **Mintlify plan tier** for PR preview deploys and contrast-token overrides — resolved in the publish-path / a11y spikes.

---

## Where the live version lives

The council log holds the full debate, verdicts, ranked risks, and the phased execution plan. This ADR holds the *why* and the binding decisions. FE-2748 and its sub-issues are updated to match.
