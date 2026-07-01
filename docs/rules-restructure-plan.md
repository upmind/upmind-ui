# `.agent/rules/` Restructure Plan

**Status:** Plan only. No edits to rules, code, or submodule. Audit + target taxonomy + migration checklist.
**Author:** rules audit pass, 2026-06-30.
**Companion doc:** `docs/devx-distillation-plan.md` (the just-completed DEVX retirement — its gaps now live in `code-generation.md` and MUST survive this split; tracked in the checklist).

---

## Summary

| Metric | Now | Proposed |
|---|---|---|
| Rule files | **14** | **17** |
| Total lines | **~3,720** | **~3,500** (re-sectioned, minimal net loss; the win is *per-load* size, not total) |
| Files >400 lines | **4** (`service-splitting` 826, `scoped-composables` 736, `code-generation` 445, `docs-modules` 436) | **0** |
| Files >250 lines | **6** | **1** (`code-services`, trimmed from 826 — single-domain, justified) |
| Code rules loading on a `.vue` edit | `code-generation` (445) + `code-reviews` (246) = **691 lines** | `code-ui` (~140) + `code-style` (~90) + `code-reviews` (~150) = **~380 lines** |
| Code rules loading on a `*.machine.ts` edit | `code-generation` (445) + `code-reviews` (246) + `scoped-composables` (736) + `design-thinking` (280) = **1,707** | `code-machines` (~110) + `code-style` (~90) + `code-reviews` (~150) = **~350 lines** |

**Headline:** the rule set is healthy in *content* (the DEVX distillation already consolidated it) but unhealthy in *shape*. Four files are multi-topic grab-bags, and the two broadest globs (`code-generation.md`, `code-reviews.md` both fire on every `.ts/.tsx/.vue/.js/.mjs/.css`) mean an agent editing **any** code file loads ~690 lines of rules — most irrelevant to the file in hand. The fix is **not** to delete content; it is to **split by domain and tighten `paths:`** so each file loads only when its file-type is being touched. Priority is the `code-*` split; doc/agent rules are explicitly out of scope for this pass.

> **JTBD:** When an agent opens a file, it should load *only* the rules that govern that file-type — a `.vue` edit pulls Vue + style + review rules, never the XState machine contract or the composable-return-shape essay. Lean, targeted context = better adherence and less burn. Same failure mode we just fixed by retiring the 577-line monolithic DEVX.md, one level down.

---

## 1. Inventory (every `.agent/rules/*.md`)

`.agent` is a **git submodule**; `.claude/rules` is a **symlink** to `.agent/rules` (`ls -la` confirms `.claude/rules -> ../.agent/rules`). They are the *same* files — there is no second copy to edit, and no `agent-sync` needed for rule bodies (the symlink is live). Edit under `.agent/rules/`, commit in the submodule, bump the pointer in the superproject.

| File | Lines | `paths:` glob(s) | Topics / sections | Verdict |
|---|---|---|---|---|
| **code-generation.md** | **445** | `**/*.ts`, `**/*.tsx`, `**/*.vue`, `**/*.js`, `**/*.mjs`, `**/*.css` | 23 sections: pre-gen study · type rules · import order · file headers + `@internal`/barrel law · separators · comments · Lodash · state/context utils · return structure · JSDoc · meta computeds · `isReady` · factory pattern (singleton vs instance) · file naming · **XState conventions** (naming, required-state, SET-handling, service-event, subscribe-bind) · Vue/Nuxt · CSS/CVA · uischema i18n · boolean checks · variable naming · error handling (no try/catch) · test fixtures · review checklist | 🔴 **Grab-bag.** 5+ distinct domains (style, types, composable shape, XState, Vue, CSS) under the broadest glob in the set. Primary split target. **IN SCOPE — dissolves into the `code-*` set.** |
| **code-reviews.md** | **246** | same 6 globs as above | AI-review config: code quality · TS best-practice · "Composable Standards Alignment" · Vue/Nuxt · Vue SFC structure · module structure · XState conventions · CSS/CVA · template formatting · security · performance · docs · acceptance-criteria · severity levels | 🟠 **Multi-topic but cohesive** (it's one artefact: the reviewer config). Heavily duplicates `code-generation.md` (Lodash, state-utils, JSDoc, XState naming, CVA). Trim by reference, keep as one review-config file. **IN SCOPE — trim in place.** |
| **code-tests-e2e.md** | 291 | `tests/Playwright/e2e/**/*.spec.ts`, `tests/Playwright/features/**/*.feature`, `tests/Playwright/e2e/support/**/*.ts` | Cardinal rules · mock policy · setup · locator priority · explicit-testid (P9) · support-lib org · isolation · brittle assertions · route-mock cleanup · ADR conflicts · self-check | 🟢 **Focused & well-scoped.** Tight glob, single domain (Playwright e2e). **IN SCOPE — keep as-is.** |
| **service-splitting.md** | **826** | `**/modules/**/*.services.ts`, `**/modules/**/*.services.*.ts` | Quick reference · 7 decision criteria · 3 implementation patterns (full/partial/no split) · 5 real-world examples · decision flowchart · testing actor-services · 3 common mistakes · migration path · review checklist · summary table · further reading | 🟠 **Single-domain but oversized.** **IN SCOPE — rename to `code-services.md` + trim worked examples into linked `docs/` appendix.** Glob unchanged. |
| **scoped-composables.md** | **736** | `**/modules/**/use*.ts`, `**/modules/**/*.ts`, `**/composables/**/*.ts` | When-to-use · four-layer return (`useContext/useMeta/useActions/useInternals`) · lifecycle methods · `destroy()` vs `stop()` · `scopeKey` · implementation patterns · actor-specific sub-composables/context/filters · where-shared-code-lives · no `.base` files · file structure · type exports · machine-node-sweep · naming · checklist | 🟠 **Single-domain but oversized AND over-broad glob.** **IN SCOPE — content MERGES into `code-composables-scoped.md` (trimmed), then `scoped-composables.md` is deleted.** |
| **docs-modules.md** | **436** | `**/modules/**/docs/foundation.md`, `**/modules/**/docs/**/*.md` | When-to-apply · scope boundaries · what-to-strip (7 sub-rules) · section template (12 sub-sections) · hot-keys-by-lifecycle · tone · review checklist | 🟠 **Single-domain but oversized.** Already tightly scoped (only module-doc files). The embedded section template (~150 lines, lines 151–351) is reference material → trim by extracting the template. **OUT OF SCOPE (this pass) — see deferred section below.** |
| **design-thinking.md** | 280 | `**/*.machine.ts`, `**/modules/**/use*.ts`, `**/composables/**/*.ts` | When-to-apply · five checkpoints · design-review questions · anti-patterns · subscription/helper pattern · artifact template · review checklist | 🟢 **Focused.** One concern (pre-coding design for stateful systems). Slightly long via the embedded artifact template (lines 218–268) — optional trim. Glob is right (machines + composables). **OUT OF SCOPE (this pass) — see deferred section below.** |
| **docs-reviews.md** | 276 | `docs/audit/**/*.md` | Review focus · scoring rubric · status markers · severity · in-progress signals · copywriter tone · evidence · file-location · appendices · checklist · anti-patterns | 🟢 **Focused & well-scoped.** Single domain (doc-audit standard), narrow glob. Leave. **OUT OF SCOPE (this pass).** |
| **docs-writing.md** | 224 | `**/docs/**/*.md`, `**/README.md`, `**/CHANGELOG.md` | Core principles · tone-by-audience · language · analogies · formatting · structure patterns · examples · changelog format · checklist | 🟢 **Focused.** One concern (how to write docs). Leave. **OUT OF SCOPE (this pass).** |
| **guides-writing.md** | 218 | `**/docs/guides/**/*.md`, `**/guides/**/*.md` | Guides-vs-module-docs · personas · structure (7 parts) · writing guidelines · naming · location · template · checklist | 🟢 **Focused & well-scoped.** Leave. **OUT OF SCOPE (this pass).** |
| **code-tests.md** | 208 | `**/*.spec.ts`, `**/*.test.ts`, `**/*.spec.js`, `**/*.test.js`, `**/__tests__/**`, `**/tests/**` | When-to-write · value vs waste · behavior-not-surface · XState guidance · file structure · when-to-add · fixtures · locators · checklist | 🟢 **Focused.** Single domain (unit/integration tests). **IN SCOPE — keep as-is.** |
| **agent-token-budget.md** | 25 | *(none — no frontmatter at all)* | Model tiering for multi-agent runs (sonnet/opus/fable JTBD) | 🟡 **Focused but missing `description:` frontmatter** (every other rule has one). **OUT OF SCOPE (this pass) — deferred; see below.** |
| **agent-verify-before-acting.md** | 24 | *(none — `description:` only, no `paths:`)* | Verify state before acting; user-intent gate | 🟢 **Focused, intentionally always-on** (no `paths:` = loads always). Leave. **OUT OF SCOPE (this pass).** |
| **agent-orchestration.md** | 20 | *(none — `description:` only, no `paths:`)* | Delegate heavy work to agents; keep main context clean | 🟢 **Focused, intentionally always-on.** Leave. **OUT OF SCOPE (this pass).** |

**Focus tally:** 8 focused/leave · 1 focused-needs-frontmatter (`agent-token-budget`, deferred) · 1 cohesive-but-duplicative (`code-reviews`, in scope) · 4 problem files (`code-generation` 🔴 split; `scoped-composables` 🟠 merge+delete; `service-splitting` 🟠 rename+trim; `docs-modules` 🟠 deferred).

### Out of scope (this pass)

The following were identified in the audit but are explicitly deferred — do not touch in this pass:

| Item | Why deferred |
| --- | --- |
| `docs-modules.md` trim (extract section template ~150 lines) | Low priority: tight glob, doc-only, zero cross-code overlap. |
| `design-thinking.md` optional rename → `code-design-thinking.md` | Cosmetic. Content is fine; glob is already right. |
| `docs-writing.md`, `docs-reviews.md`, `guides-writing.md` | Already a clean `docs-*`/`guides-*` family. No action needed. |
| `agent-orchestration.md`, `agent-verify-before-acting.md` | Intentionally always-on; no action. |
| `agent-token-budget.md` — add `description:` frontmatter | Trivial fix noted; deferred out of this pass. Do NOT add globs. |

---

## 2. Overlap / Redundancy / Staleness Findings

1. **Two broad code globs duplicate each other and over-fire.** `code-generation.md` and `code-reviews.md` carry the *same six globs* (`**/*.{ts,tsx,vue,js,mjs,css}`) and restate the same standards (Lodash, state-utils, JSDoc-in-return, canonical names, XState naming, Vue SFC order, CVA). Editing any `.css` file loads both files' full XState + composable sections — pure noise. **This is the core problem the split solves.**

2. **Composable-shape content is split across THREE files** with subtle disagreement (called out in `docs/devx-distillation-plan.md` finding #2):
   - `code-generation.md` §"Meta Properties Pattern" → individual `is/has/can` computeds, NOT a meta object.
   - `scoped-composables.md` §`useMeta()` → meta flags in a sub-composable.
   - `service-splitting.md` → no shape content, but its actor-split patterns assume the composable factory shape.
   The split must put the **canonical** composable-shape statement in ONE place (`code-composables.md`) and have the others cross-link, not restate. The four-layer scoped pattern goes exclusively into `code-composables-scoped.md`.

3. **XState content is scattered.** Machine conventions live in `code-generation.md` §"XState Conventions" (naming, required-state, SET-handling, service-event, subscribe-bind), are **restated** in `code-reviews.md` §"XState Conventions" (10 review bullets), and the *design* side is in `design-thinking.md`. The machine *authoring contract* deserves its own `code-machines.md` scoped to `*.machine.ts` **only**; the service-event-data pattern (written in service files) lands in `code-services.md`; review bullets stay in `code-reviews.md` (by reference); design checkpoints stay in `design-thinking.md`. Machine and service files thus partition cleanly — no glob overlap.

4. **Reference-composable citation drift** (devx-plan finding #3, already partly fixed): `code-generation.md` now correctly qualifies `useDomain/useBasket/useBrand` (flat) vs `modules/auth/` (scoped). Keep this qualified statement intact during the split — it lands in `code-composables.md`.

5. **`service-splitting.md` is 826 lines but has ZERO cross-file overlap** — it's a single, well-scoped domain. Its bloat is internal (5 worked examples + flowchart + summary table ≈ 350 lines of illustration). Trim by extracting examples; do **not** split into multiple rule files (no natural seam, and the glob is already tight). Rename to `code-services.md` for `code-*` family consistency.

6. **`scoped-composables.md`'s `**/modules/**/*.ts` glob is too broad** — it fires on every `.ts` in a module (types, schemas, mappers, services), not just composables. Tightening to `use*.ts` (+ the composable factory files) cuts spurious loads. This content merges into `code-composables-scoped.md` with the tighter glob.

7. **Stale/loose bits:** `agent-token-budget.md` has no frontmatter (no `description:`). `code-reviews.md` module-structure example still shows `auth.service.ts` singular vs the real `*.services.ts` plural (devx-plan finding #4 / R4 — not yet applied). The broken ADR link (devx-plan R3) was already fixed in `code-generation.md` (now points to `005-xstate-state-management.md`). No other stale references found.

8. **No genuine conflicts** between the doc/test/agent rules and the code rules — they partition cleanly by `paths:`. The problem is exclusively the four oversized files + the two over-broad code globs.

---

## 3. Proposed `code-*` Taxonomy

Split the two broad code files (`code-generation.md`, `code-reviews.md`) and the two oversized single-domain files into a **focused `code-*` family**, each with a tight glob so it loads only for the file-types it governs. `code-reviews.md` stays (it's the reviewer-config artefact) but is **trimmed to reference** the new authoring rules instead of restating them.

### Final `code-*` file set

| New file | Purpose (1 line) | `paths:` glob(s) | Absorbs (source · sections) | Target size |
|---|---|---|---|---|
| **code-style.md** | Cross-cutting TS/JS hygiene that applies to *every* code file: types, imports, headers, separators, comments, naming, errors, boolean style. | `**/*.ts`, `**/*.tsx`, `**/*.js`, `**/*.mjs` *(NB: drop `**/*.vue` and `**/*.css` — Vue/CSS-specific bits move to `code-ui`)* | `code-generation.md`: Type Rules (30–40), Import Order (42–62), File Headers + Module Visibility Law (65–100), Section Separators (104–110), Comments (113–120), Lodash (123–141), State/Context Access (144–157), Boolean Checks (381–388), Variable Naming (390–395), Error Handling + no-try/catch (398–422). G7 minimal-change guard → Comments section here. `@internal`/barrel-ban law → verbatim here. | **~120** |
| **code-composables.md** | The general composable contract: factory pattern, return structure, four-layer overview, meta computeds, `isReady`, JSDoc-in-return, type exports. The **canonical** composable-shape source — flat/non-scoped composables. | `**/modules/**/use*.ts`, `**/composables/**/*.ts` | `code-generation.md`: Return Structure (incl. G6 pagination-as-computed), JSDoc Rules, Meta Properties Pattern (incl. G2 legacy-meta-object note), isReady, Composable Factory + G1 singleton/instance lifecycle, File Naming, G4 reference-composable qualification. Cross-links `code-composables-scoped.md` for the `.as(actor)` four-layer variant. | **~150** |
| **code-composables-scoped.md** | The scope-based `.as(actor)` four-layer pattern: actor-routing, `.actions`/`.context`/`.meta` file breakdown, `scopeKey`, `destroy()` vs `stop()`, actor-specific sub-composables, no-`.base`, machine-node-sweep. | `**/modules/**/use*.ts`, `**/modules/**/use*.actions.ts`, `**/modules/**/use*.context.ts`, `**/modules/**/use*.meta.ts` | **Full merge of `scoped-composables.md`** (trimmed): four-layer shape, `destroy()`/`stop()`, `scopeKey`, actor sub-composables, no-`.base`, type exports, machine-node-sweep, naming, checklist. XState-vs-TanStack variant content trimmed to a cross-link. `scoped-composables.md` is deleted once merged. | **~150** |
| **code-machines.md** | The state-machine structure/authoring contract: naming, required-state pattern, SET-event handling, guards, actions, wiring, subscribe-binding. Machine files only. | `**/*.machine.ts` | `code-generation.md`: XState Conventions block (281–343) — Naming, Required State Pattern, Rules, Form-States-MUST-handle-SET, Composable Integration incl. G5 `service.subscribe.bind(service)`. **NB:** the "Service Event Data" pattern moves to `code-services.md` (it's written in service files). R3 ADR-005 link (already fixed). Cross-links `design-thinking.md` (design side) and `code-services.md` (service authoring + actor-split side). | **~110** |
| **code-services.md** *(renamed from `service-splitting.md`)* | Service-actor authoring + split decision: the **Service Event Data** pattern (invoked service destructures `{ data }` from the event), when-to-split criteria, patterns, checklist. Renamed for `code-*` family consistency; worked examples extracted to linked `docs/` appendix. | `**/modules/**/*.services.ts`, `**/modules/**/*.services.*.ts` | `service-splitting.md` trimmed: retain criteria + 3 patterns + checklist; extract 5 worked examples (479–627) + flowchart + summary table into `docs/reference/service-splitting-examples.md` (doc, not a rule). **+** absorbs the **Service Event Data** pattern from `code-generation.md` §"XState Conventions" (the `{ data }` destructure, written in service files). `service-splitting.md` is deleted (replaced by this rename). | **~250** *(largest remaining rule — justified: loads only for `.services.ts` edits, exactly when the full criteria is wanted)* |
| **code-ui.md** | **The single source of truth for ALL UI authoring** — nothing UI/styling lives anywhere else. Vue/Nuxt SFC order + script-setup organization + props/models typing; the full CVA pattern (`.styles.ts` config + `useStyles` helper + component usage); Tailwind-token discipline (no inline classes, no `<style>` blocks, no arbitrary values); template formatting (multiline threshold, semantic HTML, single-root); uischema/JSON-UI i18n. | `**/*.vue`, `**/*.styles.ts`, `**/*.css` | **All UI authoring consolidated here.** From `code-generation.md`: §Vue/Nuxt Conventions (347–353), §CSS/Styling Tailwind+CVA (357–363), §JSON/UI Schema i18n (367–377). **+** from `code-reviews.md`: §Vue-SFC-structure + §CVA-pattern + §template-formatting (50–82, 143–211) — the *authoring* versions move here (no copies left behind). **NB:** if `useStyles.ts` / `*.styles.ts` also match a composable glob, the **styling** rules still live here, not in `code-composables.md` (composable rules cover the composable contract only). | **~140** |
| **code-reviews.md** *(trim in place)* | AI code-review behaviour config: focus areas, severity levels, acceptance-criteria validation — **referencing** `code-style`/`code-composables`/`code-composables-scoped`/`code-machines`/`code-ui`/`code-services` instead of restating them. **Holds NO UI rules** — every SFC/CVA/template/styling concern is a ONE-LINE pointer to `code-ui.md`. | keep `**/*.ts`, `**/*.tsx`, `**/*.vue`, `**/*.js`, `**/*.mjs`, `**/*.css` *(reviewer config legitimately spans all code)* | Stays: Review Focus (quality, TS, security, performance, docs) (17–48, 213–231), Acceptance Criteria (233–239), Severity Levels (241–246). **Replace** the restated Composable-Alignment / Vue-SFC-structure / CVA-pattern / template-formatting / module-structure / XState blocks (33–211) with one-line pointers to the new authoring rules — all UI concerns collapse to a single `see code-ui.md`. Apply R4 (`auth.service.ts`→`auth.services.ts`). | **~150** (down from 246) |
| **code-tests.md** *(keep)* | Unit/integration test authoring contract. | `**/*.spec.ts`, `**/*.test.ts`, `**/*.spec.js`, `**/*.test.js`, `**/__tests__/**`, `**/tests/**` | No change. | **208** |
| **code-tests-e2e.md** *(keep)* | Playwright e2e test contract. | `tests/Playwright/e2e/**/*.spec.ts`, `tests/Playwright/features/**/*.feature`, `tests/Playwright/e2e/support/**/*.ts` | No change. | **291** |

**Net `code-*` result:** `code-generation.md` (445) **dissolves** (deleted); `scoped-composables.md` (736) **merges** into `code-composables-scoped.md` (deleted); `service-splitting.md` (826) **renames** to `code-services.md` + trims (deleted). A `.css` edit loads `code-ui` (~140) instead of `code-generation` (445) + `code-reviews` (246). A `*.machine.ts` edit loads `code-machines` (~110) + `code-style` (~90) + `code-reviews` (~150) = ~350 instead of 1,707 (and `code-machines` now fires on `*.machine.ts` only — no `*.services.ts` overlap).

### Composables split rationale

The four-layer scoped contract is **one cohesive domain** — splitting it into 5 per-layer files would fragment what agents need to hold together. Keeping it in ONE `code-composables-scoped.md` preserves coherence. The general/scoped split keeps each file loadable at the right granularity: flat composable edits load `code-composables` only; scoped composable edits load both. This also resolves the old "code-composables may exceed 200 lines" risk — it's now two ~150-line files.

### Single-domain big files — trim vs split decision

| File | Decision | Rationale |
|---|---|---|
| **scoped-composables.md** (736) | **MERGE into `code-composables-scoped.md` + DELETE.** Tighten glob from `**/modules/**/*.ts` to `use*.ts`/`use*.actions.ts`/`use*.context.ts`/`use*.meta.ts`. | The four-layer shape and the factory/meta content in `code-generation.md` are the *same domain*; today they're two files an agent must reconcile. Merging gives ONE canonical scoped composable rule. Trim the worked TanStack examples to a cross-link. |
| **service-splitting.md** (826) | **RENAME to `code-services.md` + TRIM.** Extract worked examples (479–627) + flowchart + summary table into `docs/reference/service-splitting-examples.md` (a doc, not a rule). | One coherent decision domain, already-tight glob — rename is for `code-*` family consistency. Bloat is illustrative; criteria + patterns + checklist stay in the rule. |
| **docs-modules.md** (436) | **OUT OF SCOPE (this pass).** Trim recommendation stands for a future pass. | Single domain, tight glob, doc-only. Low priority. |

### Non-code rules (out of scope this pass)

| File | Status |
|---|---|
| `design-thinking.md` (280) | OUT OF SCOPE. Keep. Optional future rename to `code-design-thinking.md` for family consistency. |
| `docs-writing.md`, `docs-reviews.md`, `guides-writing.md`, `docs-modules.md` | OUT OF SCOPE. Already a clean `docs-*`/`guides-*` family. Only `docs-modules.md` needs the template trim (future pass). |
| `agent-orchestration.md`, `agent-verify-before-acting.md`, `agent-token-budget.md` | OUT OF SCOPE. Keep always-on; **do not add globs**. `agent-token-budget.md` needs `description:` frontmatter — noted, deferred. |

---

## 4. Migration Checklist (ordered, executable)

All edits happen inside the **`.agent/` submodule** working tree (the `.claude/rules` symlink reflects them automatically). Commit in the submodule first, then bump the superproject pointer.

### Phase 0 — prep

- [ ] In `monorepo/.agent`, branch the submodule (`git -C .agent checkout -b chore/rules-code-split`).
- [ ] Confirm the symlink is intact: `ls -la .claude/rules` → `-> ../.agent/rules`. (No `agent-sync` needed for rule *bodies*; the symlink is the sync.)

### Phase 1 — create the `code-*` split (priority)

- [ ] **Create `code-style.md`** with `paths: ['**/*.ts','**/*.tsx','**/*.js','**/*.mjs']`. Move from `code-generation.md`: Type Rules, Import Order, File Headers + Module Visibility Law (`@internal`/barrel ban — keep verbatim, it cites ESLint rules + commit `2db6fc391`), Section Separators, Comments (incl. the **minimal-change guard**, devx-plan G7 — lands here), Lodash, State/Context Access, Boolean Checks, Variable Naming, Error Handling + **no-try/catch** (devx-plan-era content).
- [ ] **Create `code-composables.md`** with `paths: ['**/modules/**/use*.ts','**/composables/**/*.ts']`. Move from `code-generation.md`: Return Structure (incl. **pagination-as-computed** bullet, devx-plan G6), JSDoc Rules, Meta Properties Pattern (incl. the **legacy-meta-object coexistence note**, devx-plan G2), isReady, Composable Factory + **singleton-vs-instance lifecycle** (devx-plan G1), File Naming, and the **reference-composable qualification** (flat vs scoped, devx-plan G4). Add a cross-link to `code-composables-scoped.md` for the `.as(actor)` four-layer variant.
- [ ] **Create `code-composables-scoped.md`** with `paths: ['**/modules/**/use*.ts','**/modules/**/use*.actions.ts','**/modules/**/use*.context.ts','**/modules/**/use*.meta.ts']`. Full merge of `scoped-composables.md` (trimmed): four-layer shape, `destroy()`/`stop()`, `scopeKey`, actor sub-composables, no-`.base`, type exports, machine-node-sweep, checklist. Trim TanStack-specific examples to a cross-link. Rationale note: four-layer is ONE cohesive contract — kept in ONE file, not fragmented into per-layer files.
- [ ] **Create `code-machines.md`** with `paths: ['**/*.machine.ts']` **(machine files only — no `*.services.ts`)**. Move `code-generation.md` §"XState Conventions" machine-structure parts (Naming, Required State, Rules, **Form-States-MUST-handle-SET**, guards/actions/wiring, Composable Integration incl. **`service.subscribe.bind(service)`**, devx-plan G5). **Leave the "Service Event Data" pattern for `code-services.md`** (it's written in service files). Keep the ADR-005 link (devx-plan R3 already fixed it). Cross-link `design-thinking.md` + `code-services.md`.
- [ ] **Create `code-ui.md`** with `paths: ['**/*.vue','**/*.styles.ts','**/*.css']` — **the single source of truth for ALL UI authoring; nothing UI/styling may live elsewhere.** Move from `code-generation.md`: §Vue/Nuxt Conventions + §CSS/Styling (Tailwind+CVA) + §JSON/UI-Schema i18n. **Move (not copy)** from `code-reviews.md` the *authoring* versions of §Vue-SFC-structure, §CVA-pattern (`.styles.ts` config + `useStyles` helper + component usage), and §template-formatting (multiline threshold, semantic HTML, single-root). Consolidate into: SFC order + script-setup organization + props/models typing; full CVA pattern; Tailwind-token discipline (no inline classes, no `<style>` blocks, no arbitrary values); template formatting; uischema/JSON-UI i18n. **NB:** if `useStyles.ts` / `*.styles.ts` matches a composable glob too, the STYLING rules stay here — `code-composables.md` does NOT carry them.
- [ ] **Delete `code-generation.md`** once all five blocks above have a home. (Verify nothing orphaned: its Pre-Gen study intro → `code-composables.md`; Testing-Fixtures one-liner → cross-link `code-tests.md`; Review Checklist → split between `code-style`/`code-composables` checklists.)
- [ ] **Trim `code-reviews.md`** to focus-areas + severity + acceptance-criteria; replace restated standards (33–211) with one-line pointers (`see code-composables.md`, `see code-composables-scoped.md`, `see code-machines.md`, `see code-style.md`, `see code-services.md`). **For ALL UI concerns (SFC structure, CVA, template formatting, Tailwind discipline) keep only a SINGLE `see code-ui.md` pointer — restate no UI rule here.** Apply devx-plan **R4** (`auth.service.ts`→`auth.services.ts`) and **R1** (verify "Composable Standards Alignment" heading now just points out).

### Phase 2 — merge and rename the single-domain big files

- [ ] **Merge `scoped-composables.md` → `code-composables-scoped.md`** (done in Phase 1 above). **Delete `scoped-composables.md`** and ensure every cross-reference now targets `code-composables-scoped.md`.
- [ ] **Rename `service-splitting.md` → `code-services.md`**: extract worked examples (479–627), flowchart, summary table into `docs/reference/service-splitting-examples.md` (a doc, not a rule; link from the rule). **Absorb the "Service Event Data" pattern** (`{ data }` destructure) from `code-generation.md` §"XState Conventions" — it's written in service files, so it lands here, not in `code-machines.md`. Delete `service-splitting.md`.

### Phase 3 — housekeeping (deferred items, do NOT do in this pass)

- [ ] *(Deferred)* Add `description:` frontmatter to `agent-token-budget.md`.
- [ ] *(Deferred)* Rename `design-thinking.md`→`code-design-thinking.md` for `code-*` family consistency. Cosmetic.
- [ ] *(Deferred)* Trim `docs-modules.md`: extract the section template (151–351) into `docs/templates/module-foundation.md`; link from the rule.
- [ ] **Repoint cross-references.** Grep the `.agent/` tree (workflows, `context.md`, skills) and `docs/` for `code-generation.md`, `scoped-composables.md`, and `service-splitting.md` mentions; repoint to the new files. (The devx-plan already repointed *DEVX.md* refs; this is the second hop.) Check `.agent/workflows/*.md`, `.agent/context.md`, and any skill that names these rules.

### Phase 4 — verify & land

- [ ] Sanity-check globs against real files (already measured): `*.machine.ts`=25, `*.services*.ts`=44, `use*.ts`=142, `*.vue`, `*.styles.ts`=1, `*.css`. Confirm each new rule's glob matches its intended set and **nothing falls through the cracks** (esp. that every `.ts` is still covered by `code-style.md`, and composables get *both* `code-style` and `code-composables`/`code-composables-scoped`).
- [ ] Open a representative file of each type in the agent/editor and confirm the expected (smaller) rule set loads.
- [ ] Commit in `.agent` submodule; bump the submodule pointer in the superproject; run `graphify update .`.

---

## 5. Risks & Notes

- **Glob correctness is load-bearing.** If a glob is too narrow, a rule silently stops loading for files it should govern (e.g. forgetting `**/*.tsx` in `code-style.md` drops type rules for React-ish files). If too broad, the over-fire problem returns. **Mitigation:** `code-style.md` must keep ALL of `.ts/.tsx/.js/.mjs` so every code file still gets the hygiene baseline; the domain rules (`code-ui`, `code-machines`, `code-composables`, `code-composables-scoped`) *add* on top for their file-types. Composable files correctly match **two or three** rules (`code-style` + `code-composables` + `code-composables-scoped` for scoped ones) — that's intended, not duplication. **Separation-of-concern, not file-type:** a `*.styles.ts` (or `useStyles.ts`) file may match both `code-ui` and a composable glob, but the rules don't overlap — `code-ui` governs the **styling** (CVA/Tailwind), the composable rules govern the **composable contract**; neither restates the other's domain.
- **ALL UI authoring lives in `code-ui.md` — single source of truth.** Vue/Nuxt SFC structure, the full CVA pattern (`.styles.ts` + `useStyles` + usage), Tailwind-token discipline, template formatting, and uischema i18n are consolidated in `code-ui.md` and **nowhere else**. `code-style.md`, `code-composables.md`, and `code-composables-scoped.md` carry **no** UI/styling rules; `code-reviews.md` holds **no** UI rules either — every SFC/CVA/template/styling concern there is a single `see code-ui.md` pointer. This is the whole point of the consolidation: an agent touching UI loads one rule, and there is no second copy to drift.
- **`**/*.css` placement.** Today both broad code files include `.css`. Post-split, CSS rules live only in `code-ui.md` (CVA/Tailwind). Keep `**/*.css` on `code-ui.md` (and on `code-reviews.md`, which legitimately reviews everything but only *points* to `code-ui.md` for the rules). Do **not** put `.css` on `code-style.md` (its TS rules are meaningless for CSS).
- **`code-machines.md` / `code-services.md` partition cleanly — no glob overlap.** `code-machines.md` fires on `**/*.machine.ts` only (machine structure: naming, required-state, SET-handling, guards, actions, wiring); `code-services.md` fires on `**/modules/**/*.services.ts` only (service authoring incl. the **Service Event Data** `{ data }`-destructure pattern, plus the actor-split decision). Each file-type loads exactly one of the two — the earlier overlap on `.services.ts` is removed.
- **Submodule + symlink handling.** `.claude/rules` is a symlink to `.agent/rules`; there is no separate copy to keep in sync for rule *bodies*. Edit in `.agent/`, commit in the submodule, then bump the pointer in the superproject — a two-commit dance.
- **DEVX distillation must survive the split — explicit landing map** (from `docs/devx-distillation-plan.md`, all currently in `code-generation.md`):
  - G1 singleton-vs-instance lifecycle → **`code-composables.md`** (Factory Pattern section).
  - G2 legacy-meta-object coexistence note → **`code-composables.md`** (Meta Properties).
  - G4 reference-composable qualification (flat vs scoped) → **`code-composables.md`** (Pre-Gen).
  - G5 `service.subscribe.bind(service)` → **`code-machines.md`** (Composable Integration).
  - G6 pagination-as-computed `{offset,limit,total}` → **`code-composables.md`** (Return Structure).
  - G7 minimal-change guard → **`code-style.md`** (Comments).
  - R3 ADR-005 link (already fixed) → **`code-machines.md`**.
  - R4 `auth.services.ts` plural fix → apply in **`code-reviews.md`** during its trim.
  - The `@internal`/barrel-ban law (ESLint-enforced, cites commit `2db6fc391`) → **`code-style.md`** verbatim.
  None of these may be dropped; the checklist names each one's destination.
- **Rules that must stay broad / always-on.** `agent-orchestration.md`, `agent-verify-before-acting.md`, `agent-token-budget.md` have **no `paths:`** by design (they govern *how the agent works*, not a file-type) → they load on every turn. Do **not** add globs to them. `code-reviews.md` legitimately keeps the wide 6-glob set (a reviewer config spans all code).
- **Don't over-fragment.** Resist splitting `code-style.md` further (e.g. a separate `code-imports.md`) — sub-100-line rules with near-identical globs just trade one kind of overhead for another. The nine-member `code-*` family is the right granularity: one rule per file-type-domain.
