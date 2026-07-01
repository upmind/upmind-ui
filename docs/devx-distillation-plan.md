# DEVX.md Distillation & Retirement Plan

**Status:** Review + plan only. No edits made to DEVX.md, rules, or code.
**Goal:** Distill everything still-valid in `DEVX.md` into focused `.agent/rules/*.md` files so the monolithic doc (577 lines, un-loadable by agents) can be **deleted**.
**Author:** review pass, 2026-06-30.

---

## Summary

| Metric | Count |
|---|---|
| DEVX.md total lines | 577 |
| DEVX.md sections inventoried | **24** (across 4 top-level parts) |
| ✅ Covered (already in a rule) | **17** |
| 🔵 Gap (valid, must be distilled) | **4** |
| ⚫ Obsolete (drop, don't migrate) | **3** |
| New rules proposed | **0** — every gap fits an existing rule (`code-generation.md` ×3, `scoped-composables.md` ×1) |
| Rule files reviewed | 14 (5 in DEVX's scope; 9 confirmed out of scope) |
| Repo references to `DEVX.md` to repoint | **42 lines across 19 files** (16 source files + 3 `.claude/` mirrors handled by `agent-sync`) |

**Headline:** DEVX is ~71% already-covered, ~17% genuine gaps (small, additive — all land in existing rules), ~12% obsolete. **No new rule files are needed.** The dominant issue is not missing content but **drift**: DEVX prescribes a *flat single-`meta`-object* composable return shape that has since been **superseded twice** — first by individual `is/has/can` computeds (`code-generation.md`), then by the four-layer `useContext/useMeta/useActions/useInternals` shape (`scoped-composables.md`, canonical ref now `modules/auth/`). DEVX's own reference composables (`useDomain/useBasket/useBrand`) are the *old* canon and still use the meta-object shape. The plan keeps DEVX's timeless micro-rules (Lodash, state-utils, JSDoc-in-return, `isReady`, return-type export, barrel-import ban — all already distilled) and explicitly **retires the stale return-shape prescription** rather than migrating it.

> **JTBD of this exercise:** an agent should be able to load a small set of focused rules and generate/​review a composable correctly *without ever reading DEVX*. Success = the rules carry every still-true standard; DEVX carries nothing unique. Reference material (DEVX, ANALYSIS, the proposal docs) is **input, not the benchmark** — where DEVX disagrees with the live codebase + current rules, the codebase wins.

---

## 1. DEVX.md Inventory (section-by-section)

DEVX has four top-level parts: front-matter/usage, "Coding Style Rules" (10 numbered), "Upmind Composable Standards (2025)" (11 numbered), and a sample composable.

| # | Heading | Lines | 1-line summary |
|---|---|---|---|
| F1 | How to Use This Guide | 7–45 | Instructions for contributors / reviewers / **AI agents** ("first read DEVX.md, then…"). Pre-rules-era workflow. |
| F2 | Why This Matters | 47–55 | Rationale: predictable/readable/maintainable code, onboarding. |
| F3 | Related Documentation | 57–78 | Links to ANALYSIS / ARCHITECTURE_PROPOSAL / ADR-001 / IMPLEMENTATION_PLAN + "Upcoming Pattern Changes" (composable layers, scope-based instances, flat meta, actor contexts). |
| F4 | Quick Reference & Core Principles | 80–121 | Condensed restatement of all style rules (grouping, alphabetization, JSDoc, state-utils, Lodash, internal-exposure, separators, return-type, `isReady`, `meta`). |
| F5 | Do / Don't Table | 123–143 | Tabular do/don't of the same rules (incl. barrel-import ban). |
| F6 | Common Pitfalls | 145–168 | Bullet list of violations to avoid (incl. aggregator-barrel → `useTime is not a function` crash). |
| S1 | Style §1 Return Grouping & Documentation | 172–194 | `// --- state/context/private/methods/utils` grouping in **both** body and return; alphabetize; JSDoc-in-return; export return type. |
| S2 | Style §2 Reactivity & Internal State Exposure | 195–204 | Prefer computeds over raw refs; never expose `send`/`service`; canonical names, no renaming. |
| S3 | Style §3 JSDoc Placement & Content | 205–216 | JSDoc mandatory above every return prop; none above declarations; `meta` needs `@typedef`. |
| S4 | Style §4 Variable Naming | 217–227 | camelCase; concise (`get`/`set`/`find`); canonical names (`context` not `contextRef`). |
| S5 | Style §5 Spacing & Sectioning | 228–235 | Blank lines between sections; 80-char separator after imports & above return. |
| S6 | Style §6 Meta Object Rules | 236–259 | **`meta` is a single computed object**, synchronous only, `is/has/can` prefixes, `@typedef` JSDoc. |
| S7 | Style §7 Minimal, Targeted Changes | 261–266 | Only minimal style-consistent changes; don't reformat compliant code. |
| S8 | Style §8 Lodash Usage | 267–276 | Lodash for all array/object/utility ops; **not** `lodash.get` for state/context. |
| S9 | Style §9 isReady Pattern | 277–300 | Canonical `async isReady(): Promise<boolean>` via `waitFor`; grouped under `// --- state`. |
| S10 | Style §10 Context/Computed Values | 301–308 | All computeds defined above return (never inline), under `// --- context`; type-annotated. |
| C1 | 2025 §1 General Principles | 312–317 | Type-safe/reactive/state-utils; `useDomain/useBasket/useBrand` are reference impls. |
| C2 | 2025 §2 Machine Instantiation | 318–331 | Singleton/long-lived (module-scope, lazy-start) vs instance/short-lived (in-composable); document the choice. |
| C3 | 2025 §3 State & Context Access | 332–335 | MANDATORY Upmind utilities; never raw `.context`/`.value`/snapshot. |
| C4 | 2025 §4 Return Object Structure | 336–355 | Ordered: state (`isReady`, `meta`, primary ref) → context → methods. |
| C5 | 2025 §5 Documentation | 356–363 | JSDoc every return member; `@typedef` for complex objects; above the return prop. |
| C6 | 2025 §6 Type Safety | 364–369 | All context/computeds + method params/returns explicitly typed. |
| C7 | 2025 §7 Lodash Usage | 370–375 | (Duplicate of S8) Lodash for array/object ops. |
| C8 | 2025 §8 Service Subscription | 376–379 | If exposing the service, bind `.subscribe` as `service.subscribe.bind(service)`. |
| C9 | 2025 §9 Computed/Context Sectioning | 380–385 | (Duplicate of S10) computeds above return under `// --- context`. |
| C10 | 2025 §10 Other Patterns | 386–393 | No side effects in computeds; pagination as computed `{offset,limit,total}` + typedef; errors as `errors` context + reflected in `meta`. |
| C11 | 2025 §11 Review Checklist | 394–428 | 12-item composable review checklist; reference composables `useDomain/useBasket/useBrand`. |
| X1 | Sample Composable (Best Practice) | 430–577 | Full annotated `useSample` exemplar (flat return, single `meta` object, `@typedef`, `waitFor`). |

---

## 2. Rules Inventory (`.agent/rules/*.md`)

`.agent/rules/` is canonical; `.claude/rules/` is a byte-identical mirror (kept in sync by the `agent-sync` skill — confirmed identical sizes). Below: every rule, what it covers, and whether it's in DEVX's scope.

| Rule file | Lines | Covers | In DEVX scope? |
|---|---|---|---|
| **code-generation.md** | 433 | **Primary DEVX distillation target.** Pre-gen study; type rules; import order; file headers + `@internal`/barrel law; section separators; comments; Lodash; state/context utils; return structure + alphabetization; JSDoc rules; **individual `meta` computeds** (not a meta object); `isReady`; factory pattern; file naming; XState conventions; Vue/Nuxt; CSS/CVA; uischema i18n; boolean checks; variable naming; error handling (+ no try/catch around promises); test fixtures; review checklist. | ✅ Core |
| **code-reviews.md** | 246 | AI code-review config: quality/TS best-practices; a "**DEVX.md Alignment**" block (lodash, section-grouping, jsdoc-in-return, no-direct-state, return-type, canonical-names); Vue/SFC order; module structure; XState conventions; CVA; security; performance; severity levels. | ✅ Core |
| **scoped-composables.md** | 734 | **Current canonical composable architecture.** Four-layer return (`useContext/useMeta/useActions/useInternals`); XState vs TanStack variants; `destroy()` vs `stop()`; `scopeKey`; file structure; type exports; alphabetization; "no `.base` files"; machine-node-sweep rule; scope naming. Canonical ref: `modules/auth/`. | ✅ Core (supersedes DEVX shape) |
| **service-splitting.md** | 826 | Decision criteria + 3 patterns (full/partial/no split) for splitting service files by actor. Purely architectural — **no style/return-shape content**. | ◻ Adjacent (no overlap) |
| **design-thinking.md** | 280 | Pre-coding design checkpoints for stateful systems (ELI5 flow, ownership, question-the-model, artifact-first, subscriptions/helpers). | ◻ Adjacent (no overlap) |
| code-tests.md | 208 | Unit/integration testing standards (behavior not surface). | ✗ Out of scope |
| code-tests-e2e.md | 291 | Playwright e2e standards (ADR 020/021/022). | ✗ Out of scope |
| docs-modules.md | 436 | Per-module reference-doc standard (Contabo template). | ✗ Out of scope |
| docs-reviews.md | 276 | Audit standard for external docs. | ✗ Out of scope |
| docs-writing.md | 224 | Developer-doc writing guidelines. | ✗ Out of scope |
| guides-writing.md | 218 | Task-oriented guide guidelines. | ✗ Out of scope |
| agent-orchestration.md | 20 | Delegate heavy work to agents; keep main context clean. | ✗ Out of scope |
| agent-token-budget.md | 25 | Model tiering for multi-agent runs. | ✗ Out of scope |
| agent-verify-before-acting.md | 24 | Verify state before acting. | ✗ Out of scope |

**Scoping result:** DEVX content maps onto exactly **3 rules** (`code-generation.md`, `code-reviews.md`, `scoped-composables.md`). The other 11 are confirmed out of DEVX's scope (DEVX is purely composable + TS code-style; it contains zero testing/docs/agent-process content).

---

## 3. DEVX → Rule Mapping (classified)

Legend: ✅ Covered · 🔵 Gap · ⚫ Obsolete. "Drift" = covered but DEVX's version disagrees with the (newer, authoritative) rule.

| DEVX § | Class | Where covered / where it belongs | Notes / drift |
|---|---|---|---|
| F1 Usage (contributors/reviewers/AI-agents) | ⚫ Obsolete | — | The "AI agents: first read DEVX.md" workflow is exactly what the rules system replaced. Do not migrate. |
| F2 Why This Matters | ⚫ Obsolete | — | Generic rationale; rules carry their own "Why". No unique content. |
| F3 Related Documentation + "Upcoming Pattern Changes" | ⚫ Obsolete | — | Links to a Jan-2026 proposal cohort (ANALYSIS/ARCHITECTURE_PROPOSAL/IMPLEMENTATION_PLAN, all last-touched in the same commit `ed341897d`). The "upcoming" scope-based/flat-meta changes have **shipped** as `scoped-composables.md`. Stale roadmap — drop. |
| F4 Quick Reference | ✅ Covered | code-generation.md (whole) | Condensed restatement of S1–S10; nothing unique. |
| F5 Do/Don't Table | ✅ Covered | code-generation.md, code-reviews.md | Barrel-import row → code-generation.md §"Module Visibility Law". Rest already present. |
| F6 Common Pitfalls | ✅ Covered (1 enrich) | code-generation.md | Aggregator-barrel → `useTime is not a function` crash story is **richer in DEVX** than in code-generation.md. See checklist item G3 (enrich, optional). |
| S1 Return grouping / alphabetize / JSDoc-in-return / export return type | ✅ Covered | code-generation.md §"Return Structure", §"JSDoc Rules"; code-reviews.md "DEVX Alignment" | Fully present. |
| S2 Internal-state exposure / canonical names | ✅ Covered | code-generation.md §"Variable Naming"; scoped-composables.md `useInternals()` quarantine | scoped-composables.md is stricter (internals isolated to a sub-composable). |
| S3 JSDoc placement + `meta` `@typedef` | ✅ Covered **w/ drift** | code-generation.md §"JSDoc Rules" / §"Meta Properties Pattern" | JSDoc-placement covered. The `meta` `@typedef` requirement is **superseded** — see S6. |
| S4 Variable naming (camelCase, concise, canonical) | ✅ Covered | code-generation.md §"Variable Naming" | Present. |
| S5 Spacing & 80-char separators | ✅ Covered | code-generation.md §"Section Separators", §"Import Order" | Present; code-generation.md adds "never closing/bottom separators, never `// ===`". |
| S6 **Meta object rules (single `meta` computed + `@typedef`)** | ⚫ **Obsolete (superseded)** | code-generation.md §"Meta Properties Pattern"; scoped-composables.md `useMeta()` | **Key drift.** DEVX: one `meta` object with `@typedef`. code-generation.md: *individual* `is/has/can` computeds, NOT a meta object. scoped-composables.md: meta flags live in a `useMeta()` sub-composable. Codebase has **both** (e.g. `useBrand` still ships a `meta` object; `session-store` has `useSessionStore.meta.ts`). → Retire DEVX's prescription; the rules already state the current direction. See checklist G2 (document the migration/coexistence explicitly). |
| S7 Minimal targeted changes | 🔵 Gap (tiny) | → code-generation.md | "Don't reformat already-compliant code; make minimal style-consistent changes" is a useful guard not stated in code-generation.md. Distil one bullet. |
| S8 Lodash usage (+ not `lodash.get` for state) | ✅ Covered | code-generation.md §"Lodash Usage (MANDATORY)" | Present incl. the `lodash.get` exception. |
| S9 isReady canonical pattern | ✅ Covered **w/ drift** | code-generation.md §"isReady Pattern"; scoped-composables.md lifecycle | DEVX imports `waitFor` from a placeholder path; real util is `waitForProcessing` (`packages/headless/src/utils/useState.ts`). code-generation.md already shows the correct `waitFor(service, …)` shape. DEVX's path is stale only because it's a placeholder. No action beyond deleting DEVX. |
| S10 Context/computed above return | ✅ Covered | code-generation.md §"Return Structure" ("All context/computed values defined ABOVE return, never inline") | Present. |
| C1 General principles + reference composables | ✅ Covered **w/ drift** | code-generation.md (reference composables); scoped-composables.md (canonical = `modules/auth/`) | **Drift:** DEVX *and* code-generation.md cite `useDomain/useBasket/useBrand` (the OLD flat-return canon). scoped-composables.md names `modules/auth/` as the current canonical ref. See checklist G4 (reconcile the reference-composable citation). |
| C2 **Machine instantiation (singleton vs instance lifecycle)** | 🔵 **Gap** | → code-generation.md (or scoped-composables.md) | code-generation.md shows ONE factory pattern (module-scope `interpret` + lazy `start()`) but does **not** state the singleton-long-lived **vs** instance-short-lived decision rule. scoped-composables.md covers the *teardown* side (`destroy()` vs `stop()`, singletons have no `destroy()`) but not the *instantiation* decision. This is a real standard worth keeping. Distil the decision criterion. |
| C3 State & context access (MANDATORY utils) | ✅ Covered | code-generation.md §"State/Context Access (MANDATORY)"; code-reviews.md | Present, verbatim intent. |
| C4 Return object structure (ordered) | ✅ Covered | code-generation.md §"Return Structure"; scoped-composables.md | Present. |
| C5 Documentation (`@typedef` for complex objects) | ✅ Covered | code-generation.md §"JSDoc Rules" | Present (meta-object `@typedef` itself superseded — see S6). |
| C6 Type safety (explicit types) | ✅ Covered | code-generation.md §"Type Rules"; code-reviews.md "strict_types" | Present. |
| C7 Lodash (duplicate of S8) | ✅ Covered | code-generation.md §"Lodash Usage" | Internal DEVX duplication; no extra content. |
| C8 **Service subscription `.subscribe.bind(service)`** | 🔵 **Gap** | → code-generation.md | The specific idiom "if exposing the service, expose `.subscribe` as `service.subscribe.bind(service)`" is **not** in any rule. Niche but concrete. Distil one line (under XState conventions). |
| C9 Computed/context sectioning (duplicate of S10) | ✅ Covered | code-generation.md §"Return Structure" | Duplicate; no extra content. |
| C10 Other patterns: no side-effects in computeds / pagination computed / errors in `meta` | ✅ mostly / 🔵 partial | code-generation.md §"Meta Properties Pattern" (no side effects), §"Error Handling" (errors as `errors`, `hasErrors`) | Covered: no-side-effects-in-computeds ✅; errors-as-context ✅. **Gap:** the **pagination-as-computed-`{offset,limit,total}`-with-`@typedef`** convention isn't stated in any rule. Distil one bullet (note: in scoped-composables.md, pagination would live in `useContext()`/`useMeta()`). |
| C11 Review checklist (12 items) | ✅ Covered | code-generation.md §"Review Checklist"; scoped-composables.md §"Checklist" | code-generation.md's checklist already covers all but the pagination/subscribe items (folded into G-items above). |
| X1 Sample composable | ⚫ Obsolete (as written) | code-generation.md inline snippets; scoped-composables.md patterns | The exemplar encodes the **old flat + single-`meta`** shape. Live exemplars (`modules/auth/`, `useSessionStore.*`) supersede it. Do not migrate the sample verbatim; the rules + real reference modules are the exemplar now. |

**Tally:** ✅ Covered = 17 (F4, F5, F6, S1, S2, S3, S4, S5, S8, S9, S10, C1, C3, C4, C5, C6, C7, C9, C10, C11 — counting the duplicates C7/C9 under their primaries) · 🔵 Gap = 4 (S7, C2, C8, C10-pagination) · ⚫ Obsolete = 3 (F1, F2, F3) **+ 2 superseded** (S6, X1; S3/S9/C1 carry drift but their core is covered).

---

## 4. Rules-Review Findings (the "review our rules too" half)

Issues found *within* the rule set, independent of DEVX. Severity: 🔴 fix · 🟠 should-fix · 🟡 nit.

1. 🔴 **Broken cross-reference in code-generation.md (line 272).** Links to `file://monorepo/.agent/rules/adr-001-xstate-pattern.md` — **that file does not exist**. The real XState ADR is `docs/adr/005-xstate-state-management.md` (and ADR-001 is `scope-based-composables`, not xstate). Repoint or remove.

2. 🟠 **Three-way `meta` divergence across rules + code.** code-generation.md §"Meta Properties Pattern" says *individual computeds, NOT a meta object*; scoped-composables.md says *meta flags in `useMeta()`*; DEVX says *single `meta` object*; the codebase still has live `meta` objects (`useBrand`, ~70 files reference `meta,`). The rules don't acknowledge the older meta-object form still exists or how to treat it. → State the canonical form once and note legacy coexistence (folded into checklist G2).

3. 🟠 **Reference-composable citation drift.** code-generation.md line 26 cites `useDomain/useBasket/useBrand` as reference composables; scoped-composables.md line 13 cites `modules/auth/` as canonical. These are different generations (flat vs four-layer). A reader following code-generation.md's references would copy the *old* shape. → Reconcile (checklist G4).

4. 🟡 **Service-file naming inconsistency between rules.** code-reviews.md module-structure example uses `auth.service.ts` (**singular**); the real convention and code-generation.md use `*.services.ts` (**plural**, confirmed: `auth.services.client.ts` etc.). → Fix code-reviews.md example to plural.

5. 🟡 **Overlap (acceptable, but note):** code-generation.md, code-reviews.md, and scoped-composables.md all restate Lodash / state-utils / JSDoc-in-return / canonical-names. This is intentional redundancy (each rule loads independently per its `paths:` glob), but code-reviews.md's "DEVX.md Alignment" block is the most DEVX-coupled — its heading should be renamed (it will dangle once DEVX is deleted). → Rename to "Composable Standards Alignment" (checklist R-items).

6. 🟡 **`agent-token-budget.md` has no `description:` frontmatter** (all other rules do). Minor; flag for consistency. Out of DEVX scope — note only.

7. 🟢 **No internal conflicts found** between the testing/docs/agent rules and the composable rules; they're cleanly partitioned by `paths:`. `code-generation.md` (433) and the two big ones (`scoped-composables.md` 734, `service-splitting.md` 826) are long but well-sectioned and scoped by glob, so they load only for relevant files — acceptable.

**Stale-reference sweep (verified):** `eslint.config.mjs` custom rules `@internal/no-cross-module-imports` + `@internal/no-barrel-imports` **exist** (root config) ✅. Commit `2db6fc391` **exists** (`fix(headless): defuse import-time singleton cycle (FE-2821)`) ✅. `waitForProcessing` **exists** in `utils/useState.ts` ✅ (DEVX's `waitFor`/placeholder path is the stale one). The only broken reference is finding #1.

---

## 5. Ordered Distillation Checklist

Execute top-to-bottom. Grouped by target rule. Each item: source DEVX § → target → what to write. **All gaps land in existing rules — no new rule file is created.**

### Group A — `code-generation.md` (gaps + drift fixes)

- [ ] **G1 — Machine instantiation decision (DEVX C2).** Under §"Composable Factory Pattern", add a short note: *singleton/long-lived* machines (brand, basket, session-store) are interpreted at module scope and lazily started; *instance/short-lived* machines (per-use, e.g. flow composables) are interpreted+started inside the composable. Cross-link scoped-composables.md `destroy()` vs `stop()` for the teardown side.
- [ ] **G5 — Service `.subscribe` binding (DEVX C8).** Under §"XState Conventions", add one line: *if the service is exposed (rare/advanced), bind it: `service.subscribe.bind(service)`.*
- [ ] **G6 — Pagination convention (DEVX C10).** Under §"Return Structure" (or "Meta Properties Pattern"), add one bullet: *pagination is returned as a computed `{ offset, limit, total }` object, documented with a `@typedef`.*
- [ ] **G7 — Minimal-change guard (DEVX S7).** Add one bullet (near §"Comments" or top): *make minimal, style-consistent changes; don't reformat code that already complies.*
- [ ] **G2 — Resolve the `meta` story (DEVX S3/S6, finding #2).** In §"Meta Properties Pattern", add a one-line note that the **legacy single-`meta`-object** form (with `@typedef`) still exists in older modules (`useBrand`); current canon is individual computeds (utility composables) or a `useMeta()` sub-composable (scoped composables). State which to use for new code; do not silently leave three positions.
- [ ] **G4 — Reconcile reference composables (DEVX C1, finding #3).** At line ~26, qualify the reference list: `useDomain/useBasket/useBrand` exemplify the **flat utility-composable** shape; for **scoped (actor-aware)** composables the canonical reference is `modules/auth/` (see scoped-composables.md). Pick the exemplar by composable type.
- [ ] **R3 — Fix broken ADR link (finding #1).** Repoint line 272 from the non-existent `adr-001-xstate-pattern.md` to `docs/adr/005-xstate-state-management.md`.
- [ ] **G3 — (Optional) Enrich barrel-cycle story (DEVX F6).** code-generation.md already covers the barrel ban; DEVX's `useTime is not a function` narrative is slightly richer. Optionally fold one clause in; otherwise the rule already suffices.

### Group B — `scoped-composables.md`

- [ ] **B1 — (Optional) Singleton-instantiation cross-link.** If G1 lands in code-generation.md, add a one-line back-reference here next to `destroy()` vs `stop()` so the instantiation/teardown pair is discoverable from either side. No new content, just a pointer.

### Group C — `code-reviews.md` (drift/naming fixes, not DEVX gaps)

- [ ] **R1 — Rename "DEVX.md Alignment" heading (finding #5).** → "Composable Standards Alignment" (the block's content is fine; only the DEVX-coupled name dangles after deletion).
- [ ] **R4 — Fix `auth.service.ts` → `auth.services.ts` (finding #4)** in the module-structure example (plural, matches reality).

### Group D — Human-only content

- [ ] **D1 — None.** DEVX contains **no** genuinely human-only material that must survive elsewhere. F1/F2 (usage/why) are process boilerplate the rules system replaced; F3 is a stale roadmap (the proposal docs it links still exist independently in `docs/` for historians). The ADRs (005/010/011/001) already carry the human-facing "why" for these standards. **Nothing needs a new `docs/` human doc.**

> After Groups A–C, every still-true DEVX standard lives in a rule and every dangling DEVX-coupled reference inside the rules is fixed. DEVX then carries nothing unique.

---

## 6. Retirement Recommendation

**DEVX.md can be deleted outright** after the checklist executes — *provided the ~40 references below are repointed first.* No stub/redirect is needed **if** all referrers are updated; a one-line stub (`# Moved — see .agent/rules/code-generation.md and scoped-composables.md`) is an acceptable fallback only if you'd rather not touch the historical ADR/proposal docs in the same pass.

**Recommended order:** (1) execute Group A–C distillation; (2) repoint the live referrers (workflows, agent context, rules); (3) repoint or annotate the doc/ADR referrers; (4) `rm DEVX.md`; (5) run `agent-sync` so `.claude/` mirrors the edited rules; (6) `graphify update .`.

### Reference list — every `DEVX.md` mention to repoint (16 files)

**A. Live agent-process files (must repoint — agents read these):**
| File | Lines | Action |
|---|---|---|
| `.agent/rules/code-generation.md` | 14, 16 | Drop "Read DEVX.md for complete details" + the "Distilled version of DEVX.md / keep both in sync" sync note (no longer a thing once DEVX is gone). |
| `.agent/rules/code-reviews.md` | 33 | Rename "DEVX.md Alignment" heading (finding #5 / R1). |
| `.agent/workflows/code-generate.md` | 10 | Reword "adherence to DEVX standards" → "the code-generation rules". |
| `.agent/workflows/agent-run.md` | 279, 370 | "DEVX + Build Check" / "(DEVX.md)" → "code-generation rules". |
| `.agent/workflows/story-complete.md` | 75, 77 | "DEVX Compliance Review … follow DEVX.md" → rules. |
| `.agent/workflows/story-plan.md` | 142, 144 | "DEVX Compliance … confirm adherence to DEVX.md" → rules. |
| `.agent/workflows/story-review.md` | 85 | "(DEVX.md)" → "(code-generation.md)". |
| `.agent/workflows/agent-revise.md` | 96 | "Follow ALL project rules (DEVX.md, code-generation.md)" → drop DEVX. |
| `.agent/workflows/sdd-design.md` | 187 | "following DEVX patterns" → "following code-generation/scoped-composables patterns". |
| `.agent/context.md` | 100, 151 | "Composable Structure (DEVX.md compliant)" + link → rules. |
| `.agent/runner/HANDOFF.md` | 18, 105 | "DEVX checks" → "code-gen checks". |

> Note: each `.agent/*` file has a `.claude/*` mirror — `agent-sync` propagates these after editing the `.agent/` copies. Do not hand-edit `.claude/` separately.

**B. Docs / ADRs (historical — repoint links or add a one-line "superseded by rules" note):**
| File | Lines | Action |
|---|---|---|
| `docs/adr/011-composable-coding-standards.md` | 22, 25, 166, 172, 180 | This ADR's whole premise is "documented in DEVX.md". Add a note: standards now live in `.agent/rules/code-generation.md` + `scoped-composables.md`; keep ADR as the decision record. |
| `docs/adr/010-lodash-utilities.md` | 174, 182 | Repoint "documented in DEVX.md" → code-generation.md §Lodash. |
| `docs/adr/005-xstate-state-management.md` | 300 | Repoint link → code-generation.md / scoped-composables.md. |
| `docs/adr/001-scope-based-composables.md` | 428 | Already hedged "(to be updated)" — repoint → scoped-composables.md. |
| `docs/ANALYSIS.md` | 17, 26, 169, 250, 279, 422, 438, 470, 520, 527 | Jan-2026 analysis snapshot; many "552-line DEVX.md" mentions. Lowest priority — either bulk-repoint or leave (it's a historical analysis doc, not agent-loaded). |
| `docs/ARCHITECTURE_PROPOSAL.md` | 595, 623 | "Update DEVX.md patterns" / link — repoint or annotate. |
| `docs/IMPLEMENTATION_PLAN.md` | 162 | Link — repoint or annotate. |

**Priority:** Group A (live `.agent/*`) is mandatory before deletion — those are loaded by agents and would dangle. Group B (docs/ADRs) is non-blocking; ADR-011 specifically should get a "superseded" note since it exists to point at DEVX.
