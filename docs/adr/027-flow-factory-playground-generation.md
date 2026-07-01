# ADR 027: Flow Factory — Dynamic, Framework-Agnostic Playground Generation for Scope-Based Composables

**Date:** June 2026
**Status:** Accepted (architecture); the generator's economics are gated on the slice-2 kill-threshold below. **Amended 2026-06-30** (review-panel fold-in — see §Amendments; the Amendments supersede the original text where they conflict). **Pending a full review-panel pass + author review before commit.**
**Authors:** Dominic da Costa
**Related:**
- Working brief: `docs/sdd/FE-2965/flow-factory-brief.md` (v2)
- Deep council decision log: `~/.claude/councils/2026-06-29-flow-factory-deep/log.md` (6 seats, grounded, cross-talk; verdict 6× CONCERNS / 0 BLOCK → PROCEED WITH CHANGES)
- Linear: epic [FE-2962](https://linear.app/upmind-automation/issue/FE-2962) · this [FE-2965](https://linear.app/upmind-automation/issue/FE-2965) · composable factory [FE-2968](https://linear.app/upmind-automation/issue/FE-2968) · labs-nuxt migration [FE-2970](https://linear.app/upmind-automation/issue/FE-2970) · filters [FE-1335](https://linear.app/upmind-automation/issue/FE-1335)
- [ADR-020](020-gherkin-test-planning.md) (Gherkin spec-only — not relitigated), [ADR-001](adr-001-xstate-pattern.md) (XState)

---

## Context

**Motivation (Jobs-to-be-Done).** A scope-based composable is a **business module** — the headless implementation of a business capability. This is a **dev-facing factory**; the actor is the **developer**. The job:

> **When** we're working on a business module, **we want to** validate it **visually** against its **business requirements** across every scope, **so that** we build the right thing — **without** needing a finished app to do it.

**What we hire the flow factory to do:** *build us a stand-in client to validate a business module against its business requirements, for every scope, before the real client exists.* The playground is **a generated validation client**, not a dev/debug toy.

The **four forces** on the switch (hand-built labs → generated validation client): **Push** — a module can't be validated against business requirements until a client exists; building one by hand is slow and rots on every change (the current lab is the proof). **Pull** — a generated client that validates a module against requirements across all scopes, on demand and always-truthful. **Habit** — validating by building the real app, or hand-writing a labs page. **Anxiety** — will the generated client reflect real business use / loss of control / learning the schema model.

The hire decision is **Push/Pull**, not a cost-benefit — which is precisely why **no kill-threshold, LOC-benchmark, or abandon-metric belongs in this ADR**: the job is progress (validating modules pre-client), the forces are the rationale.

We want, for **any scope-based composable**, a **generated, always-truthful playground** that exercises every public function across every scope and every BDD scenario — built from our own components, **without per-composable hand-rewriting**. It is the **pre-app build-and-verify surface**: per composable, **make (FE-2968) → see (FE-2965) → review**, one at a time. It doubles as the runnable acceptance-spec view and the renderer workbench for our shared UI libs.

The original brief mis-stated the *mechanism* (type-extraction at build time, hand-authored manifest, JSON-Schema-carries-everything). Two councils ran: a shallow parallel pass, then a **deep grounded council with live cross-talk**. The deep council validated the corrected architecture against real code and converged unanimously. This ADR records the decisions.

**Two facts fixed going in (product-owner rulings, not relitigated):**
1. **Headless core is going Vue-agnostic** → the generation core must carry no framework code.
2. **No build step for generation** → composables are in flux during dev; the playground must reflect them *live*, like the TS language server gives live types without a rebuild.

---

## Decision

**A dynamic, framework-agnostic, generative playground on Storybook's model: an agnostic core consumes a live plain-data reflection of a scope-based composable; a pluggable per-framework renderer (Vue/labs-nuxt = adapter #1) draws it. Generation is runtime reflection (no build, no type-extraction). All intelligence is declared upstream; the renderer is dumb.**

Binding decisions:

1. **Keystone — dumb renderer, smart upstream.** The renderer holds **no business logic**; it is *given everything* and projects it: `(declarations + live snapshot) → UI`. Every decision (archetype, input shapes, action placement, exemptions) is declared upstream (by FE-2968 / the composable) and carried as data. No runtime heuristics in the renderer. This is what makes the renderer framework-swappable, testable, and truthful.

2. **Storybook model — agnostic core + pluggable renderer.** The core (IR + flow machine) carries **zero framework code** and lives with the soon-agnostic headless core. A per-framework **adapter** is the only framework-aware part; **labs-nuxt + shadcn-vue = adapter #1**; a React/Svelte adapter could consume the same IR. Cheap proof of agnosticism = a lint boundary banning `vue`/`@vue/*` imports in the core package (not a second adapter).

3. **Dynamic runtime reflection — no build, no type-extraction.** TS types are erased at runtime; we do not extract them. The adapter **reflects the live scope-based composable**: `useActions()` → function list (`Object.keys`); `useContext()` → data + the composable's own exposed `schema`/`uischema`; `useMeta()` → flags. HMR-reactive. The reflected surface is always the live composable → it **cannot drift**.

4. **The seam = pull-snapshot, reused from the labs Inspector.** Already proven in `playgrounds/labs-nuxt` (`[...scopeSuffix].vue` + `useInspector.ts`): a `factory()` returns a plain object, re-invoked inside a Vue `computed`. Reactivity stays adapter-side; the core receives plain data. Port shape: `{ snapshot(): Plain, getMeta(): Record<string,boolean>, actions: Record<string,Fn> }`. **`meta` crosses as already-evaluated booleans** (some flags read live external sources, e.g. `canRegisterAsGuest` → brand config) — the core must not own the predicates.

5. **Entry gate = scope-based composable (4-layer).** Only `createScopedComposable` output (4-layer `useActions/useContext/useMeta/useInternals`) is reflectable; flat composables are not. **FE-2968 is a hard precondition**, producing the 4-layer shape per composable. The conveyor (make → see → review) is sequential per composable, not a circular dependency. The JTBD reads "any *scope-based* composable," never "any composable."

6. **"Generated" is layered + honest. Action inputs are a per-action schema, not a hand-authored residual.** Display (meta + context/forms) and action *discovery* (names) are generated free. Action *inputs* are **not** runtime-reflectable (JS erases parameter types; measured ~78% of public functions are bare callables like `setDefault(id)`). Resolution: **every input-taking action exposes a JSON Schema (≥1 field), emitted by FE-2968 as part of the composable's contract** — the same mechanism `login` already uses for its form. The playground always renders a JSONForms form from that schema. This is reusable everywhere (validation, app forms, docs), single-source, **not** a playground-only manifest. (Overrules the council's "author inputs in BDD presets.")

7. **A family of composable-owned JSON Schemas, FE-2968-emitted, JSONForms-rendered:** action-input · filter ([FE-1335](https://linear.app/upmind-automation/issue/FE-1335)) · sort · form. Split: **JSON Schema = data + behaviour rules; UISchema = visual only.** Filters/actions/sorting are **in-scope BUILD** (this work defines them), not pre-existing.

8. **Archetype selection is deterministic + structural — no manifest, and split from input controls.** Two axes: a **content archetype** (List = array+filters/sort · Detail = single model+update · Form/Flow = XState service + real JSONForms schema + model/set/resolve · Action-panel = bag of callables) × an **optional flow-presentation wrapper** (none | Interstitial | Stepper). Selection is detected from *structural* signals (not `.uischema` presence — the Form detector must validate a structurally-real `JsonSchema` + `model`, guarding the basket "false-friend" `uischema`). *Selection* is auto; *per-action input controls* are the schema from decision 6.

9. **Coverage gate — runtime, falsifiable, no build-diff.** For every non-exempt `useActions` key there must be a BDD scenario whose `then.expected` (a `Partial<UseMeta>`) passes against live `useMeta()` and whose `@requires` are satisfied; every scenario must name a live function. Falsifiable on gap + drift. **Exemption is factory-stamped, not a runtime rule:** FE-2968 stamps each function with an explicit `@playground-include` / `@playground-exclude` JSDoc tag (+ reason); the gate reads tags only (no black-box heuristic); a human may override; an untagged input-taking function fails the gate.

10. **BDD is the shared spec — shared by source, separate in execution (clears ADR-020).** The shared artifact is a **typed TS scenario module** `{ id, given:{ scope:{ composable: string-KEY, actor, contextType?, contextId?, brandId? }, seed? }, when:{ actionId, input }, then:{ expected: Partial<UseMeta>, tags? } }` — **not** a `.feature` file (so it touches no Gherkin runtime; `.feature` stays spec-only). `given.scope.composable` is a **string key**, never a live import. A **`composableRegistry`** (`Record<string, () => ScopedComposable>`) lives in each executor (playground + Playwright) and resolves keys → composables — the load-bearing joint that keeps the scenario module headless-free. Guard: `then.expected` stays `Partial<UseMeta>`, never DOM assertions.

11. **The flow machine — new, agnostic, pattern-reuse-not-import; routes are an optional Nuxt-adapter presentation.** A new playground-owned machine drives screen/step/scope + BDD-preset playback. The routing/funnels engine (`useRoutingEngine`) is a vue-router-bound module singleton — **copy its actions/guards/services discipline; never import it** (it would drag vue-router + client-vue into the core). The flow machine is the **agnostic source of truth** for "which step/scope"; an optional **Nuxt adapter** projects step events → routes (deep-linkable, browser-back, app-realistic). Routes never become the source of truth.

12. **a11y = a UI-libs concern, not a labs gate.** The playground is an internal dev tool. a11y invariants attach to the **shared lib component contracts** (radix/reka-ui gives most for free), not the playground generator. **Primitives:** `dialog` + `dropdown-menu` + `interstitial` exist in `packages/ui`; **`stepper` + `context-menu` are installed from shadcn-vue** (not invented).

---

## ADR-day-one outputs (must exist before slice 1 — else slice 1 is a demo by construction)
- the **typed Scenario schema** (decision 10)
- the **`composableRegistry`** shape (decision 10)
- the **`@playground-include/exclude`** factory-tag convention (decision 9)
- the **seam port type** (decision 4) — **including the controlled-table channel** (filters/sort/pagination *model*, emit-up/consume-down). ⚠️ This channel is **net-new** — `manualSorting/Filtering` has zero instances in the tree today; the slice-1 port must add it.
- the **slice-1 relocation map** (amendment 2): each oracle-page behaviour → `declaration | composable | intent-event | Nuxt-adapter (routing) | deferred | deleted`. `router.replace` → **Nuxt adapter** (confirms decision 11); the **flow machine is NOT in slice 1**.

## Sequencing
- **Prerequisite (CORRECTED 2026-06-30):** `labs-nuxt` **already lives on the current branch** (`playgrounds/labs-nuxt/`, tracked) — there is **no migration** and **no UI-lib rebuild** (`client-vue` + `upmind-ui` *are* the shadcn-vue wrappers). [FE-2970](https://linear.app/upmind-automation/issue/FE-2970) is **canceled**. The only real remaining item — **harden the scope-switcher** — folds into the factory scope (FE-2965/FE-2968).
- **Slice 1 (canary) = `useAuth`:** generate its playground, **diff against the existing hand-built 356-LOC page** as the oracle. Proves reflection + seam + the schema model. It is the *flattering* case (Tier-1, schema-exposed, zero list/filter).
- **Slice 2 = a List composable (e.g. `useClientEmails`), gated on FE-1335 = the real economics test.**
- **Success check (NOT a kill-gate):** the generator is the committed goal — hand-built playgrounds are the **unmaintainable status quo this replaces**, so there is no "is it worth it / abandon" metric and no LOC benchmark against hand-writing. The only check is qualitative, on the canary + slice 2: **per composable = "write a few schemas + tags → the playground appears", NOT "rewrite a page by hand."** If it degrades to a hand-written rewrite, the *generation design* is wrong and gets revised — a feel-check, not a measured threshold.

---

## Amendments — review-panel fold-in (2026-06-30)

Adversarial review panel (4 seats: architecture / feasibility / risk / devil's-advocate; Opus; grounded). Verdict **accept-with-changes** (6 / 6.5 / 7 / 6), 0 block. These supersede the original text where they conflict. *(A full panel pass — debate + judge + written report — runs after author review.)*

1. **Factual correction — no labs-nuxt migration, no UI-lib rebuild.** `labs-nuxt` is already tracked on the current branch (`playgrounds/labs-nuxt/`). FE-2970 canceled. `client-vue` + `upmind-ui` ARE the shadcn-vue wrappers, so the panel's "client-vue→shadcn rebuild" (P1-3) is void. The only real remaining item — **harden the scope-switcher** — folds into FE-2965/FE-2968.
2. **Dumb-renderer keystone — define the line precisely (D1).** Renderer holds **ephemeral view-state only** (column visibility, expanded rows, hover). **Data-shaping state lives in the composable.** The slice-1 oracle's view logic (`start(flow)`, `handleLogout`, `onMounted` boot policy) **relocates** to declarations / the flow machine — *enumerate the relocation in the slice-1 SDD*. **Slice-1 success = behavioural parity (which LOC vanish vs. relocate), NOT a line-for-line diff.**
3. **List ≠ broken keystone (D8).** TanStack Table runs in **controlled/manual mode** (`manualSorting/Filtering/Pagination`): it emits user intent up → the composable owns + applies it → consumes rows/state back. Composable = source of truth; TanStack = binding engine; renderer = view-state. No business logic in the renderer.
4. **Filters & sort are the schema+model+uischema triad (D7).** Per composable: **filters schema + filters model**, **sort schema + sort model** (+ uischema). The **model** (live values) is passed to the query (`query.filter(model)` / `query.sort(model)`); the renderer binds schema→form to the model. Same shape as forms.
5. **Typed keys, not strings (D10).** `composableRegistry` is an `as const` map → `type ComposableKey = keyof typeof registry`. *(Net-new — no such `as const` registry/matrix exists today; do not claim an existing precedent.)* Scenario `composable`/`actionId` are typed against it → a rename is a **compile error**. **Both executors (validation client + Playwright) MUST import ONE shared key union** — separate registries would drift undetectably (the typed-key fix protects within an executor, not across two). The runtime gate is the backstop.
6. **Decision 9 — auto-derived AND explicit, gate is non-circular.** FE-2968 **computes** the include/exclude decision via a uniform rule **and stamps** the `@playground-include/exclude` tag (auto-derived + visible + human-overridable) — **not hand-authored** (closes the manifest backdoor the council flagged). The gate keys "input-taking" off the **action-schema map** (an action has an input schema or it doesn't), not runtime param introspection — resolving the "JS erases types" circularity.
7. **Decision 6 — bidirectional contract + the canary doesn't prove it.** The FE-2968↔FE-2965 seam is **two-way**: **FE-2965 defines the schema/tag grammar; FE-2968 emits to it** (name both owners). And `useAuth`'s form schema is **state-driven** (machine-assigned per flow — free); the **new per-action static schema** (the ~78% Tier-2 need) is **first tested at slice 2**, not slice 1. The canary validates the seam, not decision 6.
8. **Kill-threshold / spike / go-authority — REMOVED.** The generator is the committed objective: the existing hand-built lab is unmaintainable (the reason this project exists), so benchmarking it against hand-written LOC benchmarks against the very thing being replaced. There is **no kill-gate, no upstream LOC-denominator spike, and no go-authority** (the panel's P0-2 + P2-2 only existed to serve the gate). Replaced by the qualitative **success check** in Sequencing: per composable = "a few schemas + tags → the playground appears," not "rewrite a page." If it degrades to a rewrite, the generation *design* is revised — not the project abandoned.
9. **Correct the overclaims.** "Already proven" → *the pull-snapshot pattern exists in labs (hand-enumerates 13 meta flags); the generic `Object.keys` reflection is unbuilt.* "Near-zero marginal cost" → *near-zero for the display layer; per-action input schemas are authored upstream (FE-2968), gated by the kill-threshold.*
10. **Flow machine + routes-presentation are NOT slice-1 critical.** Slice 1 = reflect → render `useAuth` + scope-switch + one BDD preset. The flow machine (and the Nuxt route projection) arrive with multi-screen flows — design step-events cleanly now, build later.
11. **`meta` = sync boolean is a structural invariant (D4).** By design, lint-enforced; not an assumption. Any async-derived flag must resolve its source into a reactive store upstream so the flag reads synchronously.
12. **Schema-rot defence is three-layer.** App-consumption (a wrong schema breaks production) + runtime drift gate + a new **`/story-complete` step** (touch a scope-based composable → its playground + schemas updated and gate green, like the docs step).
13. **"Framework-agnostic = YAGNI" — overruled.** It's a settled product constraint (headless going Vue-agnostic), proven by a no-`vue`-imports lint on the core. Fold the milder form: keep the IR to the **plain snapshot + typed descriptors** — no further IR ceremony.

## Consequences

**Positive:** framework-agnostic core (renderer swappable); the hardest seam already exists (labs Inspector) → low build risk; **auto-truthful for the reflected surface (~22%)** (live reflection can't drift) — the authored schemas (~78%) stay fresh via app-consumption + the runtime drift gate + the `/story-complete` step; one source of truth for action input shapes (the composable schema serves the validation client + real-app validation + app forms); BDD scenarios (the business requirements) drive both the validation client and e2e.

**Costs / risks accepted:** FE-2968 must emit per-action input schemas + playground tags for every scope-based composable (the ~78% authored surface — *this is the work, justified by triple-duty reuse per Motivation, not a cost-benefit gate*); the scope-switcher needs hardening; `stepper`/`context-menu` primitives need installing (from shadcn-vue); the routes-presentation is additive (not slice-1 critical) but the flow machine's step events must be designed cleanly now so the Nuxt adapter can subscribe later.

**Out of scope:** changing composable *behaviour*; a public/hosted playground; building a second (React/Svelte) renderer now (the agnostic boundary is proven by the lint rule, not a second adapter).
