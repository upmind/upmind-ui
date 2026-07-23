---
description: Standard for per-module reference documentation (Contabo workshop deliverables)
paths:
  - '**/modules/**/docs/foundation.md'
  - '**/modules/**/docs/**/*.md'
---

# Module Documentation Rules

These rules apply to per-module reference documentation produced for the Contabo workshop and equivalent deliverables. They sit alongside `docs-writing.md` (general writing standard) and `docs-reviews.md` (review standard). Use with the `/docs-module` and `/docs-review` workflows.

> **Audience**: architects and senior developers rebuilding the platform in a different language or stack. They know how to build software; they don't know Upmind. They are NOT consumers of our existing client code.

> **Core principle**: describe what the system *is* — its data, capabilities, dependencies, and the problems it must handle — not how *we* built it. Strip our implementation flavour. Prescribe nothing.

---

## When To Apply

Apply when documenting a module in `packages/headless/src/modules/<name>/docs/` for one of the workshop deliverables (per-module foundation doc, SDD, build-your-own guide).

The workshop doc lives at `packages/headless/src/modules/<name>/docs/foundation.md` — **not** at the module's `README.md`. The existing `README.md` is internal-facing (how to *use* the composable inside our codebase) and stays untouched. The two docs serve opposite audiences and must not be merged.

These rules do **not** apply to internal-facing module docs (`README.md`), story docs, or changelogs — those follow `docs-writing.md`.

---

## Scope boundaries between sibling modules

When a module shares its problem space with a sibling, the foundation doc must explicitly demarcate where this module's scope ends and the sibling's begins. Without an explicit boundary, two sibling docs will conflict on which one owns an endpoint or capability.

**Pattern** for the "What it is" section when siblings exist:

1. One paragraph describing what *this* module owns.
2. One sentence forwarding adjacent concerns: `"<adjacent surface> lives in <sibling-module>; <this module> picks up after <handoff point>."`
3. Every subsequent section (Operations, Data shape, API endpoints, Flows, Lessons) operates only within the demarcated scope.

**Validated examples** (do not duplicate scope across these pairs):

| Module | Owns | Forwards to sibling |
| --- | --- | --- |
| `product` | catalogue read, initial configuration, seating (`POST /orders`, `POST /orders/{basketId}/products`) | re-resolve / edit / remove → `basketProduct` |
| `basketProduct` | in-basket re-resolve, edit, remove, validate-saved, bulk replace | catalogue browsing + seating → `product` |
| `basket` | basket envelope (create, claim, currency, promotions, billing, conversion) | per-line product operations → `basketProduct` |
| `session` | identity / token / actor surfaces | client profile reads + sub-records → `client` |

When a single capability or endpoint could conceptually live in either sibling, decide by **what an architect rebuilding the platform asks first**: "what's available to add?" → catalogue side; "what do I do with what I've added?" → in-basket side. Document the call once, on the chosen side. The sibling references the call by URL but does not re-document it.

---

## What To Strip

Architecture-flavoured content that prescribes our choices and distracts from what needs to be built.

### Implementation names

- ❌ `useBrand()`, `isReady()`, `getConfigValue(key)`, `validateCurrency(model)` — our composable surface
- ❌ `brandConfigKeysStore`, `["brand", "config"]` query keys, `localStoragePersister` — our internal stores and identifiers
- ❌ `service.fetchBrandConfig`, `mapBrandSettings` — our internal functions

Use instead: **capability descriptions** ("readiness signal", "currency validation", "read keyed brand config").

### Framework / library choices

- ❌ Vue reactivity, `computed`, `ref`, `watch`
- ❌ XState machines, actors, services, guards, spawn
- ❌ TanStack Query, query keys, refetch, persisters
- ❌ Scoped composables (`useX().as('client')`)

Use instead: framework-neutral language ("observable", "derived value", "request", "filter", "validate").

### Producer-side orchestration concepts

Concepts that exist in *our* stack as architectural choices, not as platform contracts. Strip these even when they feel useful — they leak our solution shape:

- ❌ "Operation queue" / "single-concurrency queue" / "AsyncQueuer" / "mutations serialise per X" — our client-side serialisation pattern. The platform truth underneath ("mutations against the same X compound recomputation cost") belongs in **Lessons**, not as a Core concept or Coordination bullet.
- ❌ "Pending product" / "pending entry" / "draft state" — our mid-edit in-memory state framing. The platform has only the catalogue-read shape and the seated-record shape; the "I've started filling the form but haven't POSTed yet" lens is purely client-side.
- ❌ "Silent mode" / our wrapper around per-call validation flags — the client-side `{ silent: true }` convenience or any equivalent local toggling. The Lessons-section truths (where validation runs, what triggers it) belong in **Lessons**.
- ✅ **Per-call validation flags ARE wire flags and MUST be documented.** Flags like `provision_field_values_validate: false`, `skip_recompute: true`, or any other boolean the headless code actually puts on the request body must appear in the typed `RequestBody` shape and the curl example. They are platform contracts, not client conveniences — the platform changes behaviour based on their value. Distinguish: the wrapper concept ("silent mode") is ours; the wire flag is theirs. Strip the wrapper framing; document the flag.
- ❌ "Bundle" as an architectural concept — our parent-children composition pattern. The wire enum value (e.g. `product_type: 2`) can be enumerated as data; the concept of bundles as architectural primitives stays out.
- ❌ Deep-link / URL-parameter bag types (e.g. `DeepLinkConfig`, `pid`/`qty`/`bcm` shorthand fields) — our URL convention, not platform shape.
- ❌ Validation schema framing ("validates against a schema built from X's constraints") — our validator. The BE is the authority on validity; the doc describes what the BE enforces, not how a client checks first.
- ❌ "Reconfigure" / "edit cycle" flow as a 3-step recompute orchestration — our debounce-and-recalculate pattern. The platform constraints underneath (calculation responses can land out of order, provision fields are selection-dependent) belong in **Lessons**.
- ❌ "Inline edits race" / "two-surface UI" patterns — our component split where the same record is edited from two surfaces simultaneously.
- ❌ "Sub-track" / "sub-machine" / "child service" / "module emits X" / orchestrator-framing nouns — our machine vocabulary describing how downstream consumers connect to a parent module.

Each of these is a problem we solved in *our* stack. The architectural truths underneath belong in **Lessons** as platform constraints (with no "solution-shape" suffix), not in Core concepts, Operations, Flows, or Coordination.

### Implementation patterns presented as requirements

- ❌ "Everyone awaits `isReady()` before initialising"
- ❌ "You should..." / "every consumer must..." / "plan for X early"
- ❌ "The cleaner shape is X"
- ❌ "If you implement one thing first, build Y"

Use instead: factual descriptions of the *constraint*. ✅ "Consumers reading brand-derived values before brand has settled get defaults, not errors."

### Upmind-specific UI workarounds

- ❌ The `.meta` field on any BE response — UI workarounds for our own client
- ❌ Convenience flags derived from config keys (`hasStorefront`, `keepsUserInSitu`, `hasUpmindBranding`) — these are presentation-layer shortcuts, not architectural primitives

Note the `.meta` rule once at the top of the doc with a single italic line — **but only when the module's response payloads actually carry a `meta` field on their data payload.**

> *Any `meta` field returned by Upmind endpoints is UI-specific to our own client — ignore for spec purposes.*

**Conditional rule — verify before including the note:**

- **Include the note** when the module's captured fixtures show `meta` (or `object_meta`, or any sub-keyed bag like `meta.i18n`) at the *data* level — on `data` itself, or per-row inside `data: [...]`, or nested on an embedded record (e.g. a basket's embedded product carrying `meta.uischema`).
- **Omit the note** when the only `meta` present is the response *envelope wrapper*'s `meta: null` field (sibling of `data` / `error` / `messages` on every Upmind response — shared by every endpoint, not module-specific).
- **Tighten the wording** when only a specific sub-key exists (e.g. brand carries `meta.i18n` only — note reads: `*Any meta field returned by Upmind endpoints (e.g. meta.i18n on brand settings) is UI-specific to our own client — ignore for spec purposes.*`).
- **Cover both** when multiple top-level bags exist (e.g. basket responses carry both `meta` and `object_meta` — note reads: `*Any meta or object_meta field returned by Upmind endpoints is UI-specific to our own client — ignore for spec purposes.*`).

When the note IS included, silently omit `meta` everywhere else — types, samples, dependants, lessons.

**Everything inside `meta` is out of spec, regardless of sub-property.** This includes `meta.i18n`, `meta.cart`, `meta.uischema`, any future sub-keys, and any content surfaced under a different name (e.g. "i18n message overrides", "translation overrides", "brand-cart layout", "cart UI overrides") that ultimately resolves to a meta-located bag. Never reference meta-derived content by name, even indirectly, in any section of the doc — operations, data shape, dependants, samples, lessons.

### Meta-commentary about implementation choice

- ❌ "Our implementation splits this into sync and async variants"
- ❌ "We choose to fetch in parallel; you can do it differently"
- ❌ "Capabilities 6 and 7 share an architectural shape but we split them"

If the implementation choice is a hard-won lesson, surface it in the **Lessons** section as a *problem*, not a solution.

### Rolled-up data structures

Many of our headless modules compose multiple BE responses into a single bag, substrate, or composed object exposed by a composable. Examples we've already hit:

- `brand` exposes a single `useBrand()` substrate that internally fetches `/brand/settings`, `/config/brand/values`, `/config/organisation/values`, and `/org/modules`.
- `system` exposes a single `useSystem()` substrate that internally fetches `/countries`, `/billing_cycles`, `/currencies`, `/languages`, `/statuses`, `/tickets/departments`, etc.

**The composed object is our implementation choice. The BE contract is the individual endpoints.**

- ❌ Document the composed substrate as a single capability ("Read brand data" / "Read system data")
- ❌ Frame multiple BE responses as a single "rolled-up" object in the Data shape
- ❌ Treat the composition as architectural truth in the dependants table (e.g. "consumer reads the brand substrate")
- ❌ Carry over our framing-vocabulary that presupposes how the data gets used (e.g. "lookup", "context bag", "settings store")

Use instead:

- ✅ One **Operations** row per BE endpoint (or per genuinely-distinct retrieval shape — `/countries` and `/countries/{id}/regions` are distinct; `/countries` and `/billing_cycles` are also distinct)
- ✅ One **Data shape** block per endpoint response
- ✅ One **API endpoint** entry per BE call
- ✅ Dependants' "reads" column names the individual data the consumer needs ("country list", "billing cycles"), not our composed object ("brand", "system substrate")

When in doubt: an architect rebuilding the platform should be able to read your Operations table and see one row per HTTP call they'll need to make. If they see one row for "read all the system data", they can't.

---

## Section Template

Sections appear in this canonical order. **Required** must appear. **Optional** appear only when they apply — no `n/a` filler.

### Header

```markdown
# Module: <name>
```

### What it is [REQUIRED]

One paragraph describing the module's domain role in plain English. Why it exists, what problem it solves.

If there's a `.meta` to flag, add the single-line italic note immediately after.

If the module has keyed config or other phase-dependent data, follow with a **Keys by lifecycle phase** table:

| Phase | Keys | Relevance |
| --- | --- | --- |
| Initial page load | … | … |
| Product display | … | … |

Phases describe when each key is *relevant*, not when *we* fetch it.

### Core concepts [OPTIONAL]

3–6 terms the rest of the doc assumes. Each as a bullet: bold term + plain-English definition.

Skip when terms are self-explanatory from the data shape and operations.

### State model [OPTIONAL — usually omit]

Most modules don't need this section. Do not document our orchestration as a state model.

#### When to include a state model

Only when the **platform itself** exposes lifecycle states the caller observes — e.g. an order whose `status` is `pending → active → suspended → cancelled` as returned by the back end, a subscription whose `status` changes server-side, an invoice that transitions between `unpaid → paid → void`. The state must be a value the back end returns; the transitions must be ones the platform performs (or the caller drives via discrete BE calls).

#### When to omit a state model (default)

Anything that's *our* orchestration:

- ❌ `loading`, `checking`, `idle`, `processing`, `ready`, `refreshing` — these are reactive-stack artefacts.
- ❌ Sub-states like `available → invalid → checking` — that's our validation lifecycle.
- ❌ `expired`, `subscribing`, `unavailable` — our scheduler / subscription bookkeeping.
- ❌ The shape of a state machine — even drawn in plain ASCII.

If the urge to document state is really "how does the caller get from A to B", that's a **Flow**, not a state model. Drop the state diagram and write a flow instead.

#### Shape when a state model is included

Framework-neutral. List the platform-defined state values and the BE actions that transition between them. Reference the enum in `packages/types/` that defines the values. No XState / Vue / TanStack vocabulary.

### Operations [REQUIRED]

What callers need to be able to do. **Capabilities, not method signatures.**

| # | Capability | Inputs | Outputs |
| --- | --- | --- | --- |
| 1 | **Read X** | — | what comes back |
| 2 | **Check Y** | inputs | what comes back |

- **Cover every observable behaviour the module exposes**, including lifecycle (readiness, refresh, invalidate) where applicable. Use the source's exported surface as the inventory; for each entry, translate to a framework-neutral capability name and list its inputs/outputs.
- Max 12 capabilities per module.
- **When the module exposes 13+ BE calls**, fold rather than overflow: capabilities that share an endpoint family with a path variation (e.g. `GET /orders/current` and `GET /orders/{id}`) collapse to one capability row with both inputs noted; lifecycle-shaped capabilities (readiness, refresh, invalidate) move to an "Additional always-on behaviours" sub-list outside the 12-cap table; client-side derivations off a loaded record move to a "Derived from a loaded X" sub-table marked as non-BE.
- No method names.
- No commentary about how we split things.

### Data shape [REQUIRED]

Key types in TypeScript-ish notation. Inputs to operations, return shapes, persisted state.

- **Source of truth = the fixture.** The BE response is what consumers actually see. Include every field returned, except `meta` (the single field stripped per the top-of-doc note). Cross-reference `packages/types/src/models/` and `packages/types/src/data/enums/` for canonical type names and enum values — but where the typed contract is narrower than the fixture, **follow the fixture**. Typed contracts can lag the actual response shape, and admin-relevant fields the contract excludes (e.g. `region_id`, `email_logo`, `oauth_clients`) are still real and belong in the data shape.
- Strip the `meta` field from any response type.
- Inline `//` comments for non-obvious fields.
- Show example enum values for keyed config.

### Dependencies [REQUIRED]

#### Dependants — modules that read from this one

File-count weights from `graphify-out/graph.json` (cross-module import edges).

| Module | Weight | Reads | Why |
| --- | --- | --- | --- |
| `basket` | 4 | currency, language, brand id, … config keys | Use-case description |

**Direction matters when reading the graph.** Dependants are modules that import FROM the documented module — i.e. edges where the documented module is the *source* (the thing being imported) and another module is the *target* (the importer). Verify direction before regenerating: grep `grep -rl 'from "../<module>"' packages/headless/src/modules/<other>/` for one expected dependant — if it returns files, the row belongs; if not, the row is reversed (the documented module imports from `<other>`, making `<other>` a dependency, not a dependant).

- **Include every cross-module dependant the graph returns, weighted descendingly.** A "thin" table (only the top 3–5 modules) hides the breadth of the fan-in, which is itself architectural information.
- **Exclude foundational / app-level consumers** — `query` (the HTTP transport layer) and `routing` (app-level navigation) reference most modules but are not domain consumers. Add a one-line footnote noting their exclusion when the omission could surprise a reader. The same exclusion applies to UI-internal helpers (`datamanager`, `client-vue` framework consumers) — keep them out of the table; surface their fan-in via the "Presentation layer" row when relevant.
- **Add a "Presentation layer" row at the bottom** when relevant — UI consumers of module-derived values that aren't themselves headless modules (header/footer chrome, locale + currency switchers, white-label gating).
- **"Reads" column = data names**, not method names. ❌ `validateCurrency`, `getConfigValue('X')`. ✅ "default currency", "config key X".
- **Drop redundant rows.** If two consumers read the same identity assets (e.g. `theming` + presentation layer), keep only the more general row.
- **Drop modules whose dependency runs the other way.** A module that *populates* the documented module via a parent flow (e.g. `session` populates `client` via `/self`) is NOT a dependant — the dependency runs from documented-module to populator, not the reverse. Verify by code-grep if the graph weight is small and the relationship is ambiguous.
- **"Why" column**: factual use case in 1–2 phrases.

#### This module's own dependencies

Short list, bullet-shaped:

- **HTTP transport layer** — what concerns it covers (auth, currency injection, error normalisation)
- **Shared types / enums** — type-level only

Do not mention any module dependency that exists only to break a cycle in our codebase.

### API endpoints [REQUIRED]

Each endpoint: method + URL + role + **request body (where applicable)** + curl + sample response + fixture reference.

**Per endpoint, document all of:**

1. **Method + URL** — e.g. `POST /clients/register`. Use the logical path (no `/api/` prefix — that's the transport layer's job).
2. **Role** — one sentence on what the endpoint does and when a caller invokes it.
3. **Request body** *(required for `POST` / `PUT` / `PATCH`)* — a typed shape block, separate from the response shape. Fields:
   - Mark required vs optional explicitly (`field: string` vs `field?: string`).
   - Inline `//` comment any field whose meaning isn't obvious from name + type.
   - Document **sentinel values** when a numeric / string field uses 0, -1, `null`, or `""` to mean something other than the literal (e.g. `min_order_quantity: 0` = "no minimum, not literal zero"; `currency_id: null` = "use brand default").
   - Document **POST vs PUT divergences** when the same resource accepts both: which fields the caller can omit on POST that they must send on PUT (or vice versa); flags that one method accepts but not the other (e.g. `provision_field_values_validate: false` on POST). When divergence exists, show **both shapes** — `CreateBody` and `UpdateBody` as separate types — even if 95% of the fields overlap. Hidden divergences cost the caller hours.
4. **Curl example** — full body with realistic values, using `$API` and `$ACCESS_TOKEN` env vars. Must match the typed `RequestBody` shape one-to-one — every field in the type appears in the curl example, every field in the curl example appears in the type.
5. **Sample response** — sourced from real fixtures (`tests/fixtures/recordings/` in monorepo / `07-references/recordings/` in bundle), never hand-crafted. **Strip `meta` from sample bodies.** Stubbed responses allowed during drafting, marked `// stubbed`, with a note that real captures will replace them.
6. **Fixture reference** — name the fixture file the request/response was captured from: `Fixture: tests/fixtures/recordings/post-clients-register.json`. When fixtures capture the request body too (per the new format spec — see [`docs/workshop/references/fixture-index.md`](../../docs/workshop/references/fixture-index.md)), reference it so the reader can cross-verify request shape against the captured truth.

No cross-references to internal methods ("Used by `hasModuleEnabled()`").

### Failure modes [REQUIRED when the endpoint has non-error soft-failure paths]

When an endpoint can return `2xx + status: "ok"` but the operation didn't fully succeed (line stripped post-validation, partial application, etc.), document the soft-failure paths explicitly alongside the success path and the 4xx error path. **Three categories** to think through for every mutation endpoint:

1. **Hard success** — `2xx + status: "ok" + data` populated as expected.
2. **Hard failure** — `4xx + status: "error" + error` populated with category + message.
3. **Soft failure (the dangerous one)** — `2xx + status: "ok"` but with one of:
   - `data` empty/missing the entity the caller asked for (e.g. `POST /products` returned `200 OK` but the basket's `products: []` because the line was stripped)
   - `warning_notes: [...]` or `notes: [...]` populated with platform-side reasons the operation was downgraded
   - `messages: [...]` populated with caller-visible warnings
   - A specific field returned as `null` when the caller expected a value (signals partial application)

If the platform returns a soft-failure path for this endpoint, **document the trigger** (what the caller did to cause it), **the response shape** (where the warning/note lives), and **the recovery action** (what the caller should do — retry with different inputs? surface to user? both?). Soft-failure modes are the highest-cost class of gap: the caller writes against the documented happy path, the request returns 200, and silently nothing happens.

Skip this section only when you've actively verified the endpoint has no soft-failure path (the platform either succeeds or returns 4xx; no third state). Most mutation endpoints have at least one soft-failure path — assume the section is needed unless you've checked.

### Side effects [OPTIONAL — usually omit]

Most modules don't need this section. If you find yourself writing "our implementation persists to local storage" — that's a Lesson, not a Side effect.

Include only when the module has externally-observable side effects an equivalent **must** also produce (e.g. setting a cookie another system reads).

### Coordination [OPTIONAL — usually omit]

Same advisory as Side effects. The architectural truths of coordination usually belong in **Lessons**.

### Flows [OPTIONAL — usually include when the module is more than "fetch one bag of data"]

Flows describe **observable platform behaviours**: which BE calls happen in what order, what each call returns, what guarantees hold across the sequence. They are the right place for anything that previously felt like "state model" but was actually "how does the caller get from A to B".

#### When to include flows

When the module exposes one or more multi-step interactions a caller plans around — login, registration, transfer, claim-and-refresh, configure-then-add, paginate-then-filter, request-then-poll. If the module is purely "issue one request, render the response", omit the section.

#### Shape of a flow

One subsection per flow. Each carries:

1. **One-line purpose** — why this flow exists.
2. **Mermaid flowchart** (`flowchart TD`) — top-down. Use rounded `([...])` nodes for entry and terminal states, square `["..."]` nodes for actions or API calls, diamond `{...}` nodes for branch decisions on response fields, and `subgraph` for cross-boundary flows (e.g. origin A vs origin B). Use `<br/>` inside node labels for line breaks. Show BE endpoints and the discriminating fields on responses; do not show our actor system, helpers, subscriptions, query-key invalidation, or reactive recomputation. **Do not use `sequenceDiagram`** — branches read linearly, payload labels clutter, and ZenUML-style renderers used by some IDE extensions produce poor results. Flowcharts handle branches with diamonds, keep labels tight, and render consistently across viewers.
3. **Guarantees the platform holds** — bullet list of what *will* be true across the sequence. Things like "the same endpoint covers all six grants" or "the basket survives the actor swap".
4. **Constraints the caller has to plan around** — bullet list of failure modes and limits the platform won't paper over. Things like "the interim 2FA token expires in minutes", "the auth-code is single-use", "the recovery endpoint never reveals account existence".

Format the two lists with a prose lead-in (`Guarantees the platform holds:` / `Constraints the caller has to plan around:`) — not a sub-heading. Repeating identical sub-headings across every flow triggers Markdown-lint duplicate-heading rules and adds noise to the TOC.

#### Flow anti-patterns

- ❌ Drawing our state machine as a flow. The flow is the sequence of BE interactions, not our orchestrator's transitions.
- ❌ Using `sequenceDiagram` notation. Use `flowchart TD` with rounded / square / diamond nodes instead.
- ❌ Showing `useX().method()` calls inside nodes. Use BE endpoints (`POST /resource`) as the node label.
- ❌ Coordination commentary ("then we refresh the basket subscription"). That belongs in Lessons (as a problem statement) or nowhere.
- ❌ More than ~7 flows. If the module has more, group related ones (e.g. "all the read flows share this shape").

### Lessons (hard-won) [REQUIRED]

Problems we hit when building this. **Describe the problem, not our solution.**

Each entry:

1. **Stated as a problem.** ✅ "Consumers race brand at boot." ❌ "Plan for cache + dedupe early."
2. **No solution-shape suffixes.** Forbidden patterns include "the cleaner shape is X", "the natural separation is Y", "the X has to do Y", "the inversion has to happen somewhere". If you reach for one of these, you're describing our solution — stop at the problem statement.
3. **No prescriptive verbs** ("you should", "you must", "plan for").

Typical lessons surface:

- Load-profile issues (read-by-many, thundering herd)
- Race conditions at boot
- Coupling consequences (e.g. making a leaf module reactive tangles the graph)
- Aggregate request growth, supersession problems
- Propagation through callbacks vs through the transport layer
- **Mutation-returns-full-object diff gotchas** — when a mutation responds with the complete refreshed parent object (full basket, full collection) rather than just the new entry, consumers diff post-state against pre-state to identify the change. Edge cases worth flagging as bullet sub-cases within one lesson: (a) one mutation can yield multiple new entries; (b) mutations against quantifiable resources can yield zero new entries (the platform merges into an existing entry and bumps quantity); (c) the platform doesn't surface a "what changed" pointer in the response.
- **X-id parameter recomputation cost** — when an endpoint accepts an optional `{other_resource}_id` query parameter (e.g. `basket_id` on a catalogue read, `client_id` on a tax computation), supplying it triggers server-side recomputation against the referenced record. Cost scales with the size of the referenced record and is paid on every request. Give consumers the heuristic — when to pay the cost, when to skip — rather than prescribing one path.
- **Diff between input vocabulary and resolved-record vocabulary** — when a domain has both an *input form* (e.g. a coupon code the customer enters) and a *resolved form* (e.g. the promotion record returned on a price row), name both as distinct Core concepts and use each term consistently throughout the doc. Inputs sweep through Operations / API endpoints; outputs sweep through Data shape / Lessons.

---

## Hot Keys by Lifecycle Phase

When the module exposes keyed configuration, organise the keys by **user lifecycle phase**, not by our default-fetch list.

Typical phases:

- **Initial page load** — needed before anything renders
- **Product display / configuration**
- **Auth / registration**
- **Checkout**
- **Payment**
- **Post-purchase / subscription management**

Show only keys *architecturally* needed by an equivalent. Skip keys that are:

- Cart-UI-specific (`BASKET_FUNNELLING`, `CHECKOUT_FLOW`)
- Upmind-app-specific (`REMOVE_UPMIND_BRANDING_ENABLED`, `UI_*`)
- Internal-admin (`CREATE_USER_API_TOKENS`, `WEBHOOKS`)

If in doubt: "Could an equivalent built in another stack ignore this and still ship a working cart/portal?" If yes, omit.

---

## Tone

- ✅ Factual: "Brand is X"
- ❌ Prescriptive: "Brand should be X"
- ❌ Apologetic: "We chose to do X; you don't have to"
- ❌ Encouraging: "Everyone awaits X before initialising"
- ❌ Architect-coaching: "If you implement one thing first, build Y"

The doc states what *is*. The agent reading it decides what to build.

---

## Review Checklist

Before declaring a module doc complete, verify:

### Required sections present

- [ ] What it is
- [ ] Operations
- [ ] Data shape
- [ ] Dependencies (dependants + own dependencies)
- [ ] API endpoints
- [ ] Lessons (hard-won)

### Strip audit

- [ ] No method names from our composables (`useX`, `isReady`, `getConfigValue`, etc.)
- [ ] No store / queryKey / persister names from our internals
- [ ] No Vue / XState / TanStack references
- [ ] No `.meta` content anywhere except the single top-line italic note
- [ ] No "you should…" / "everyone awaits…" / "plan for…" / "the cleaner shape is…"
- [ ] No commentary about why we encoded X the way we did
- [ ] No rolled-up substrate framing — every BE endpoint has its own Operations row, Data shape block, and API endpoint entry; no single capability or data shape rolls multiple endpoints together

### Content quality

- [ ] Operations table describes capabilities, not method signatures
- [ ] Operations rows reflect per-endpoint reads, not our composed substrate
- [ ] Dependants table "reads" column uses data names not method names (and names the individual data, not our composed object)
- [ ] Hot-keys table (if present) organises by lifecycle phase, not default-fetch
- [ ] Hot-keys table omits cart-UI-only and Upmind-app-only keys
- [ ] Lessons describe problems, not solutions
- [ ] Sample responses in API endpoints have `meta` stripped
- [ ] No "the cleaner shape is X" trailing prescription on any Lesson

### Section minimalism

- [ ] State model section present only if the **platform** (not our orchestrator) exposes lifecycle states the caller observes — e.g. order/subscription/invoice status enums returned by the BE
- [ ] State model section contains no reactive-stack vocabulary (`loading`, `checking`, `processing`, `idle`, `ready`, `refreshing`, `subscribing`, `expired`)
- [ ] Side effects section present only if externally-observable
- [ ] Coordination section present only if architectural truths can't fit in Lessons
- [ ] Flows section present when the module exposes multi-step interactions; uses `flowchart TD` Mermaid (NOT `sequenceDiagram`) with `Guarantees` / `Constraints` prose lead-ins (not sub-headings) per flow
- [ ] Each flowchart uses rounded `([...])` nodes for entry/terminal states, square `["..."]` for actions / API calls, diamond `{...}` for branches, and `subgraph` for cross-boundary flows
- [ ] Flows show BE endpoints as node labels, not our composable method names; no actor / subscription / query-invalidation commentary inside the chart

### Tone

- [ ] Doc states what is; doesn't tell the reader what to do
- [ ] No "our implementation…" commentary
- [ ] Italic `.meta` note appears exactly once
