# Actor arms — when/how

> **TEMPLATE — doctrine wins.** `code-composables.md` Part B + `code-composables.companion.md` ("Variance law") are the authority; this file is a navigation aid over them, never a match target. A disagreement is a surfaced finding, never silently resolved toward either.

**This file covers BOTH template variants** (`machine/` and `query/`). Everything below applies to both; the only per-variant differences are tabled in [Variant deltas](#variant-deltas) at the end. It lives at `templates/` root deliberately — two near-identical copies drifted once already (`docs/sdd/FE-2966-FE-2967/evidence/decisions.md`, 2026-07-28), and the duplicated content was prose, not logic.

A module ships **armless by construction** (clause 2). Arms exist for **all five sub-composable layers** — `module.services.{actor}.ts`, `useModule.actions.{actor}.ts`, `useModule.context.{actor}.ts`, `useModule.meta.{actor}.ts`, `module.schemas.{actor}.ts` — per the operator rulings of 2026-07-28: clause 3 applies to **any** actor-exclusive/overriding member of **any** layer, not only the layers with a pre-existing real-world exemplar. "No exemplar yet" is never a reason to scope a layer's arm template out — `code-composables.md` Part B "Actor-Specific Sub-Composables" states the pattern applies uniformly; the context/meta/schemas arm templates apply that doctrine PROSE directly, since no runtime `.context.{actor}.ts` / `.meta.{actor}.ts` / `.schemas.{actor}.ts` file exists anywhere in this codebase yet to cite as a receipt.

## Which files can earn an arm — the test

Before scoping anything, ask: **does this file hold actor-scoped state or actor-scoped behaviour that a caller resolves through the scope builder?**

- **Yes → it can earn an arm.** `services`, `actions`, `context`, `meta` and `schemas` all qualify: each is resolved per-actor by the module's own factory, so an arm has something to hold and the shared file has a merge seam to spread into. All five follow their variant's **services** shape — query: a `create…(scopeActor)` factory spreading `...scoped…(scopeActor)` last; machine: an exported object whose members resolve the arm off `context.scopeActor` per call, because a machine has no construction-time seam to close over.
- **No → it never earns an arm; use an actor-named export in the shared file.** A pure function has no per-actor construction to hook — input in, output out. Scoping it would create a file whose only content is a function that could equally live beside its sibling, and would force every caller to resolve an arm just to pick a function. Export both from the one shared file and let the caller that already knows the actor choose.

This is why `{module}.mappers.ts` and any `{module}.utils.ts` have **no** `.{actor}.ts` form. The divergence they need is real — a different endpoint returns a different shape, so it needs a different mapper — but it is expressed at the call site inside the arm that already has the actor, not by scoping the util.

Applying the test keeps the arm count honest: an arm exists because a scope earned one (clause 2/3), never because a file happened to need a second variant of a function.

## The three standing laws

**Every arm carries at least one member exclusive to it, OR one overriding the shared factory** (clause 3's test, below) — the arm templates demonstrate one of each; an authored arm carries only what it earned. The override is always **A vs A+B** — the shared factory does A; the arm does A *and something more*. An override whose body is byte-equal to the shared implementation is cosplay: it claims to override and delivers nothing (`verify-cosplay.md`). Kill it or make it real.

**The schemas layer moves as a PAIR.** Its schema parser and uischema parser are one contract: an arm that overrides the schema — adding a field, or un-`readOnly`-ing one — must override the uischema too, or it ships a required field with no control to fill it. Override both, or neither.

**`definitions` / `$ref` is the shape armed or armless.** The shared field and control definitions live in `useSchemaDefinitions()` / `useUischemaDefinitions()` from the start, and the shared parsers `$ref` / reference them — the same reason the resolution seam is always present: the file must not change shape the day a scope earns an arm. An arm `$ref`s the shared definition for every field it does not change and inlines a full object only where it genuinely differs, so the diff reads as `$ref` = inherited, inline = overridden.

## When to arm

Clause 3 (`code-composables.md` Part B "Actor-Specific Sub-Composables", cited by `code-composables.companion.md`): arm a layer **only** when this module's ADR-001 parity table gives at least one actor a member that is

- **exclusive to it** (no other actor has it, and the shared factory doesn't define it), or
- **overriding** the shared factory's implementation (same key, different behaviour, spread last).

`code-services.md`'s actor-split decision (different endpoint / grant type / response shape / business logic) is the services-layer version of the same test; the same test applies verbatim to actions, context, meta and schemas — a divergent domain mutation, a divergent computed data value, a divergent state flag, or a divergent field rule are each the same clause-3 trigger at their own layer.

**A per-actor capability/permission flag that gates an `actions` member is also `meta` read-state — arm both, from one source.** When an actor-exclusive permission boolean (e.g. a staff `canDelete` off a capability check) is computed to gate an `actions`-arm member, that same flag is state the UI must *read* to show/disable the control — so it earns a `meta` arm too, not only the `actions` gate. Compute the capability **once** (e.g. in `useModule.ts` or a shared util) and pass the one value to both arms; never recompute it independently per arm, or the gate and the displayed flag can silently drift. Deriving `meta: none` because "the capability only gates actions" is the trap — a gating flag is read-state by definition. (Incident 2026-07-31: a staff capability set gated the actions arm but was never surfaced as meta, so the UI had no permission read-state; `meta` was wrongly derived `none`.)

## When NOT to arm

If every actor this module serves is happy with the shared factory's behaviour, **stay armless** — the default in every shared file is the correct, complete shape for most modules. Do not scaffold an arm "for later": clause 2 bans an empty arm outright (see Checker gates), and an unearned arm is exactly the failure mode `code-reviews.companion.md`'s "Variance-law cues" flags as a 🔴 Blocker. Arm each layer **independently** — a module might earn a services arm and nothing else.

## How to arm

1. Copy the relevant `{layer}.{actor}.ts` template once per **layer** and once per **actor** that actually earns one — rename `client`/`Client` to `staff`/`Staff` or `guest`/`Guest` per this module's parity table, and rename the filename's own `{actor}` token to match.
2. Delete the worked-example members (see [Variant deltas](#variant-deltas) for the names your variant ships) and replace them with this module's real exclusive/overriding members. Keep at least one non-empty member — an arm exporting zero members fails clause 2 mechanically.
3. Wire the arm into the corresponding shared file. Every shared file already carries its resolution seam as live code, so this is an addition, not a swap and never a signature change: on **services** and **schemas** add a `case` to `scopedServices()` / `scopedSchemas()` returning the arm's factory, and uncomment the matching import above it; on **actions / context / meta** uncomment the `actorScope === …` branch above the return and add the arm's spread as the LAST entry. Nothing gets renamed — no `base*` prefix and never a `.base.ts` file (Part B "NO .base Files").
4. Attach a decision-record comment (`what:`/`why:`/`rejected:`) adjacent to any member whose key duplicates a name the shared factory also exposes, unless the shared file's value is itself a `scopedX(...)` delegate call (an endorsed merge-seam idiom the `scope-based/no-cosplay-arm` rule recognises without one).
5. Repeat 1–4 for a second actor, or a second layer, only if that actor/layer independently earns its own arm — do not mint an arm for an actor with nothing exclusive or overriding just to keep the matrix "even", and do not arm all five layers just because one earned it.

## How to un-arm

If a scope's exclusive/overriding need disappears (e.g. the divergent endpoint is retired), delete the `.{actor}.ts` file(s), drop that actor's `case` from `scopedServices()`, and remove the arm's branch and spread from the layer file. The shared file's shape is unchanged either way — that is the point of the seam being live. Do not leave a stub arm behind "in case it's needed again" — that is the same empty-scaffold anti-pattern clause 2 bans going in.

## Lint gates that apply

The **`scope-based` ESLint plugin** (`packages/eslint-plugin-scope-based/`, wired into the repo's single flat config and scoped to `packages/headless/src/modules/**`) mechanically enforces the law as part of `pnpm lint` / CI — so a green is an editor squiggle and a pipeline gate, not a script someone has to remember to run. Five rules:

- **`scope-based/no-cosplay-arm`** (clauses 2 & 3) — an arm member byte-identical (comments/whitespace aside) to the shared member of the same name is a **cosplay override**; an arm exporting nothing exclusive or overriding is an **empty scaffold**. Escapes: the shared value is a `scopedX(…scopeActor…)` **delegate seam**, or a complete `@decision` (`what:`/`why:`/`rejected:`) names the key.
- **`scope-based/no-self-branch`** (clause 4) — a *branch* on `ScopeActorTypes.SELF` / `'self'` (a `case` or a comparison) inside a module. Consumer call sites (`.as('self')`) and `as const` matrix keys are ignored; type positions never reach a value-position visitor. A tolerated exception is silenced **in place**: `// eslint-disable-next-line scope-based/no-self-branch -- <reason>`.
- **`scope-based/require-decision`** (clause 5) — a `@decision` block missing any of `what:`/`why:`/`rejected:` fails; back-to-back blocks are scored separately.
- **`scope-based/complete-layer-set`** (clause 1, decidable half) — a scoped composable missing a sub-layer (`useX.actions.ts` / `.context.ts` / `.meta.ts` / `.internals.ts`), or a data-layer file (`{module}.services.ts` / `.machine.ts` / `.mappers.ts` / `.schemas.ts`) without an `@internal` head marker.
- **`scope-based/arm-in-matrix`** — an arm whose actor is not declared in the module's scope matrix (`[ScopeActorTypes.X]`). One-directional: a matrix entry need not have an arm.

Armless is the default and lints clean — every rule self-gates (no arm file → nothing to score; not a scoped composable → inert). Clauses 1 (full shape) and 3 (override *quality*) beyond the decidable checks above stay reviewer judgement.

Run it yourself before filing:

```sh
pnpm lint
# or just this module:
./node_modules/.bin/eslint packages/headless/src/modules/<module>
```

The rules' own behaviour is pinned by their RuleTester specs — valid + invalid cases including the byte-identical cosplay, the differently-named-but-body-identical schema member, and the back-to-back `@decision` blocks the old string-lexer checker silently mis-scored:

```sh
node --test packages/eslint-plugin-scope-based/scope-based.test.mjs
```

## Variant deltas

The only per-variant differences. Everything above applies to both.

| | `machine/` | `query/` |
| --- | --- | --- |
| **Canonical armless exemplar** | `account/` | **None.** `client-email/` is the only query-backed *scoped* module and it is the FE-2824 implementation the anti-cosplay law was written about — cite it for facts, never copy its shape. Non-scoped query modules (`client-phone/`) are the honest reference for how a query-backed module reads its own list. |
| **Live arm precedent** | `auth/` — real earned arms at services + actions | none; no TanStack-Query-backed module has earned an arm at any layer, so its arm templates cross-cite `auth/` or the doctrine prose, honestly labelled |
| **Context worked override** | `lookups` (machine context reads state) | `lookups` (query context computes over the list) |
| **Meta worked override** | `isProcessing` — `useStateMatches` over machine states | `isLoading` — the shared first-fetch check plus any in-flight refetch |
| **Services worked override** | `register` — real-cited from `auth/auth.services.{client,staff,guest}.ts`, reached through `moduleServices`' own `register!` dispatcher | `loadList` **and** `register` — `loadList` is the clearest case: same collection and same endpoint, but the arm asks for extra related fields, so the response shape and therefore the mapper differ |
| **Schema parser names** | `useModuleSchemaParser` / `useModuleUischemaParser` (`*Parser` suffix — the machine-side convention, cf. `account/`) | `useSchema` / `useUischema` (unanimous across all 7 query-backed modules) |
| **JSON Schema type** | `JsonSchema` | `JsonSchema7` |
| **Actor-named mapper** | `mapClientModuleRequestData` — shapes a request payload | `mapClientModuleItems` — maps a richer client response |
| **`{module}.machine.ts`** | present, and carries the capability-guarded transition worked example (a seam — it ships with the services arm it invokes) | absent — the query is the state (Part B "State Machine vs TanStack Query") |

These naming splits are **deliberate, not drift**: each follows the convention its own variant's real modules already use, which is why the schemas layer is not shared between variants even though its doctrine prose is ~95% identical. Forcing one naming on both would break `code-reviews.companion.md`'s repo-fit standard for whichever variant lost.
