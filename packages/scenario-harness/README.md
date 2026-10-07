# scenario-harness

Turns a live scope-based composable into plain data plus a small set of shared
contracts, so a validation client and a test runner can each build against the
same module without hand-writing per-composable glue. Framework-agnostic by
design: no Vue, no test-runner types, no UI. The boundary is enforced, not
just documented — a files-scoped lint block bans `vue`, the vue ecosystem,
and every vue-tainted workspace package (including `import type`) inside this
package (`eslint.config.mjs:729-733`, banned-specifier list at
`eslint.config.mjs:487-497`).

This README is the handoff surface: everything a module-build pipeline needs
in order to plug a new composable into the shared manifest, stamp its action
members, author its spec pair, and wire its own drift/coverage checks. It
describes contracts, not proof — read the cited source for the exact
behaviour, and see [Fixtures and negative controls](#fixtures-and-negative-controls)
for the worked examples this package ships.

## Contract ownership

Section numbers below match the numbered headings that follow.

| # | Contract | Defined here (this package) | Consumed / emitted by |
| --- | --- | --- | --- |
| 1 | Tag grammar + parser | grammar constants + read-only parser | the pipeline that stamps action members |
| 2 | Coverage gate | `GateInput` shape + `runGate` verdict function | a per-module test that supplies live data |
| 3 | `ScenarioRegistry<K,T>` + `createHarness` | the registry-generic contract type + harness constructor | the consumer's own manifest (e.g. `tests/journeys/scenario-harness/manifest.ts`) |
| 4 | `defineSteps` / `World` | the step-registration + execution-seam types | whoever authors a module's spec pair |
| 5 | `createTraceabilityCheck` | the bidirectional drift checker | one drift test per adopted module |
| 6 | Seam port + meta rule | `CompositionPort` shape + the booleans-only rule | the adapter that builds a port from a live composable |
| 7 | Post-merge drift backstop | specs the mechanic only | lands with the first adopted module |

---

### 1. `@playground-include`/`@playground-exclude` tag grammar

Grammar: `src/tags/tags.types.ts:6-9` (`PLAYGROUND_JSDOC_TAG`). Parser:
`src/tags/tags.ts:20-43` (`parsePlaygroundTags`) — a plain regex/line scan
over source text, no TypeScript compiler involved.

- Exactly one tag belongs on each public action member's doc block: `@playground-include`, or `@playground-exclude <reason>`.
- An exclude with reason text parses to `{ kind: "exclude", reason }`. A bare `@playground-exclude` with no reason text parses to `{ kind: "exclude" }` with `reason` absent — this is a deliberately invalid shape, never coerced into a valid exemption (the gate below reads it as a violation).
- An untagged member is absent from the returned map entirely (not `undefined`-valued-but-present).
- **Write-only-where-untagged**: this package only ever *reads* tags. Whatever stamps them must write a tag only where a member currently has none — an existing tag, whether hand-edited or previously stamped, is never rewritten. That write discipline lives in the stamping tool, not here; overriding a stamped tag is just editing it in place, visible in the diff.

### 2. Coverage gate — `GateInput` + `runGate`

Types: `src/gate/gate.types.ts:13-19` (`GateInput`), `:40-50` (`GateVerdict`).
Function: `src/gate/coverage-gate.ts:11-65` (`runGate`) — pure, one call per
scope-matrix cell.

`GateInput` is everything one verdict pass needs: `actionKeys` (live action
names for that actor), `tags` (this package's parsed map), `actionSchemas`
(action id → its input schema, or `undefined`), `coveredActionIds` (the ids a
module's step catalog exercises).

"Input-taking" is keyed **only** off `actionSchemas[actionId] !== undefined`
(`coverage-gate.ts:37`) — never runtime parameter introspection. Verdict
shape per action: `exempt` (excluded, reason recorded) · `red
missing-reason` (excluded, no reason) · `red untagged-input-taking`
(schema present, no tag) · `covered` / `red uncovered` (tag or no-schema
default, checked against `coveredActionIds`) · `red dead-step` (a covered id
that isn't in the live `actionKeys` set at all — a step naming a
no-longer-live action). An untagged action with no schema entry defaults
toward the covered/uncovered pair, never toward a tagging violation.

Nothing in this package enumerates live actions or parses source — a
per-module test assembles `GateInput` (live enumeration + this package's tag
parser + the module's own schema map) and asserts on `runGate(...).verdicts`.

### 3. `ScenarioRegistry<K, T>` + `createHarness`

`src/registry/registry.types.ts:8-11` (`ScenarioRegistry<K, T>`);
`src/registry/harness.ts:11-18` (`Harness<K>`), `:27-34` (`createHarness`).

**This package ships no manifest of its own.** `K` is never baked in here —
a consumer builds its own `as-const` key object plus its derived key union,
shapes a factory map as `ScenarioRegistry<K, T>`, and hands that registry
to `createHarness(registry)` (or constructs a `World<K>` directly against it,
§4) at construction time. `K` is inferred from the registry argument alone,
so every surface `createHarness` returns — and every `World<K>` built from
the same registry — is typed by that one argument: renaming or removing a
key in the consumer's manifest fails compilation at every construction site
built from it, with no second manifest to keep in sync.

Upmind's own manifest — the sole current consumer — lives at
`tests/journeys/scenario-harness/manifest.ts` (its own `COMPOSABLE_KEY`),
outside this package, since journeys is where the harness is actually
consumed today. This is an interim home: it re-homes once the app itself
starts consuming the harness directly — a follow-on piece of work, not this
package's concern.

### 4. `defineSteps` / `World` — the step-authoring contract

`World`: `src/world/world.types.ts:25-31` (generic over `K`, the consumer's
own key union — never a package-baked key type). Step shapes:
`src/steps/steps.types.ts:17-21` (`StepDef`), `:43-47` (`StepRegistrar`).
Builder: `src/steps/step-catalog.ts:16-34` (`defineSteps`).

A `<module>.steps.ts` file's import surface is exactly `{ defineSteps, World
}` from this package, plus the consumer's **own** manifest key — never a
package-exported one (this package's own fixtures import `FIXTURE_KEY` from
their local `./fixture-registry.ts`, §3). Inside, `defineSteps(({ Given,
When, Then }) => { ... })` registers `Given`/`When`/`Then` patterns whose
handlers each receive a `world` and talk to the module only through its five
methods: `boot(key, scope)`, `fire(actionId, input?)`, `expectMeta(expected)`,
the optional `expectContext(expected)`, and `dispose()`. `expectMeta`/
`expectContext` are subset matches over already-plain data — never a UI
assertion. Every member returns a `Promise`, so a remote-driving `World`
implementation and an in-process one satisfy the same type; a `World<K>`
implementation is constructed with (or typed against) the consumer's own
`ScenarioRegistry<K, …>` — never a global. See
[`src/__fixtures__/fixture.steps.ts`](./src/__fixtures__/fixture.steps.ts)
for the exact import surface and step shape in practice.

`defineSteps` is a thin registration shim, not a scenario format: it collects
`{ kind, pattern, handler }` tuples in declaration order and nothing else —
it must never grow a field for scenario data. Whatever engine ultimately
runs a module's `.feature` walks the resulting `StepCatalog` and re-registers
each pattern against its own real `Given`/`When`/`Then` (see
[`playwright.bdd.config.ts`](../../playwright.bdd.config.ts) at the repo root
for the reference walk of an in-process catalog).

### 5. `createTraceabilityCheck`

`src/steps/traceability.ts:73-104` (`createTraceabilityCheck`), returns a
`TraceabilityResult` (`src/steps/steps.types.ts:33-37`: `ok`,
`unmatchedFeatureSteps`, `orphanStepDefs`).

Usage, per module: read the sibling `.feature` file as text, import its
`.steps.ts` catalog, and assert
`createTraceabilityCheck(featureText, catalog).ok`. Matching uses the same
cucumber-expression engine a real test runner uses at registration time, so a
match here is a match there. Both drift directions are surfaced by name: a
feature step matched by no `StepDef` lands in `unmatchedFeatureSteps`
(with its line number); a `StepDef` matched by no feature step lands in
`orphanStepDefs`. `ok` is true only when both are empty.

This checker extends the feature↔test traceability pattern (a colocated test
parses the feature's tags and fails on unproven scenarios both ways), applied
here to a feature↔steps pair instead of a feature↔test-id pair. The in-repo
exemplar is this package's own `src/steps/__tests__/traceability.unit.test.ts` over the
`__fixtures__` pair; a per-module `<module>.traceability.test.ts` follows the
same shape.

**Dependency-policy deviation:** `@cucumber/cucumber-expressions` is declared
as a runtime `dependency`, not a `devDependency` (`package.json:22`) — this
module is barrel-exported production src, so the import executes for every
consumer of the package, not only this package's own tests (see the
`@remarks` at `src/steps/traceability.ts:68-72`).

### 6. Seam port + meta rule

`src/port/port.types.ts:9-14` (`CompositionPort`).

`CompositionPort` is the plain-data shape this package's reflection and gate
logic consume: `snapshot()`, `getMeta()`, `actions`, and an optional `table`
channel. The rule stated once because it applies everywhere `meta` is
touched: **`getMeta()` returns already-evaluated booleans.** Whoever builds
the port derefs every reactive value before it crosses in; this package
never receives, and never produces, a reactive wrapper.

Building a `CompositionPort` from a real composable's live layer returns is
the adapter's job, not this package's — a port over the builder itself
(rather than an instantiated composable) is out of contract; enumerating a
scope builder's own proxy is a known side-effecting trap and must never
happen here.

### 7. Post-merge drift backstop — allocation

This package specs the mechanic, it does not run it: a CI job that, on every
push to the default branch, re-runs the traceability check (§5, above) across every
adopted `.feature`/`steps.ts` pair and fails loudly if a committed pair has
drifted since it last passed in a merge request. No such job exists in this
package's own CI wiring — it lands once the first real module adopts the
spec pair, alongside that module's own feature/steps/traceability files.

---

## Onboarding a new module

1. **Add a key to your own manifest.** This package ships none — add one entry to your manifest's `as-const` key object (Upmind's current one: `tests/journeys/scenario-harness/manifest.ts`) and shape a factory map against it as `ScenarioRegistry<K, T>` (§3).
2. **Stamp the module's action members.** One `@playground-include` or `@playground-exclude <reason>` doc-comment per public action (§1) — write only where a member has no existing tag.
3. **Write the spec pair.** A human-readable `.feature` next to a `<module>.steps.ts` built with `defineSteps` over `World` (§4) — the step bodies are the only place the module's real behaviour is driven from.
4. **Wire the drift test.** A `<module>.traceability.test.ts` that reads the `.feature` text, imports the steps catalog, and asserts `createTraceabilityCheck(...).ok` (§5).
5. **Wire the coverage test.** A per-module test that assembles a `GateInput` (live action enumeration + this package's tag parser + the module's action-schema map) and asserts on `runGate(...)` (§2).
6. **Construct the harness.** Hand your registry to `createHarness(registry)` (or construct a `World<K>` directly against it, e.g. `new NodeWorld(registry)`) — everything returned is typed by that one registry argument, so renaming or removing a key fails compilation at every construction site built from it (§3).

## Fixtures and negative controls

- [`src/__fixtures__/fixture-module.ts`](./src/__fixtures__/fixture-module.ts), [`fixture-registry.ts`](./src/__fixtures__/fixture-registry.ts), [`fixture.feature`](./src/__fixtures__/fixture.feature), [`fixture.steps.ts`](./src/__fixtures__/fixture.steps.ts), [`node-world.ts`](./src/__fixtures__/node-world.ts) — a minimal four-member stand-in module, its own local manifest (`FIXTURE_KEY`), its full spec pair, and a registry-constructed in-process `World`, showing the shape end to end: manifest → module → `.feature` → `steps.ts` → `World`. The switch it models is a stand-in, not product behaviour.
- **The package depends on itself.** `"@upmind-automation/scenario-harness": "workspace:*"` sits in this package's own `devDependencies` (`package.json:29`) so that [`fixture.steps.ts`](./src/__fixtures__/fixture.steps.ts) can import `{ defineSteps, World }` by the package's public name — the same binding contract a real consumer follows — instead of a relative path; the manifest key itself (`FIXTURE_KEY`) comes from this package's own local [`fixture-registry.ts`](./src/__fixtures__/fixture-registry.ts), never the package barrel (§3). There is no `exports` map in `package.json`, so the public-name import only resolves because pnpm materialises a self-symlink for the workspace dependency and resolution falls back to the plain `main`/`types` fields; it is a standard pnpm dogfooding pattern, not a runtime circular dependency.
- **The seven `.feature` files under `src/__tests__/`** (e.g. [`tag-grammar-coverage-gate.feature`](./src/__tests__/tag-grammar-coverage-gate.feature), [`shared-key-union.feature`](./src/__tests__/shared-key-union.feature)) are documentation anchors, not an executed spec: a header comment on each names the sibling vitest suite that actually realizes it (for example, `tag-grammar-coverage-gate.feature` → `src/gate/__tests__/coverage-gate.unit.test.ts`). None of the seven run through a Gherkin/BDD runner in this package — the only `.feature` file actually executed here is [`__fixtures__/fixture.feature`](./src/__fixtures__/fixture.feature), via the root `test:bdd` lane. Drift between one of these seven and the suite it names is caught at review, not by an automated gate.
- [`src/__tests__/known-bad/vue-value-import.must-fail.patch`](./src/__tests__/known-bad/vue-value-import.must-fail.patch), [`headless-type-import.must-fail.patch`](./src/__tests__/known-bad/headless-type-import.must-fail.patch) — reference patches for the no-vue lint boundary described above: applying either to a source file and running the workspace lint is expected to turn it red naming the banned specifier; reverting is expected to return it to green.
- [`reintroduce-import-cycle.must-fail.patch`](./src/__tests__/known-bad/reintroduce-import-cycle.must-fail.patch) — a different boundary, targeting another workspace package: it reintroduces a same-package import cycle (`import/no-cycle`) inside a package this repo's ADR 023 package graph keeps acyclic. Same red-then-green contract; the lint scope for this one is derived from the patch's own touched files, not from this package.
- [`foundation-reaches-domain.must-fail.patch`](./src/__tests__/known-bad/foundation-reaches-domain.must-fail.patch) — the keystone control for ADR 023 §2's registry-ownership invariant, as Amendment 9 narrowed it: `foundation` may hold the inject seam and nothing that flows through it. It reaches a domain package from `useFormRenderers.ts` by a RELATIVE path, so it proves the relative-path boundary. The catching arm is `@workspace/no-cross-package-path-imports`, which resolves the path to disk and names the package that owns it. Applying it turns the workspace lint red naming the reach; reverting returns it to green.
- [`payment-reaches-invoice.must-fail.patch`](./src/__tests__/known-bad/payment-reaches-invoice.must-fail.patch) — the boundary control for `packages/modules-payment`'s own §3/§4 placement: it reroutes the pay action through a call into `@upmind-automation/invoice`, the shape that inverts a payment surface into needing the invoice package to pay an invoice. The catching arm is the repo-root `vue-tsc -b` gate: `packages/modules-payment`'s tsconfig `paths` carry no `invoice`, so the reach lands as a `TS2307` on the mutated line. Reverting returns it to green.
- **The five `*-reaches-host-shell` controls** — [`auth-`](./src/__tests__/known-bad/auth-reaches-host-shell.must-fail.patch), [`basket-`](./src/__tests__/known-bad/basket-reaches-host-shell.must-fail.patch), [`client-`](./src/__tests__/known-bad/client-reaches-host-shell.must-fail.patch), [`invoice-`](./src/__tests__/known-bad/invoice-reaches-host-shell.must-fail.patch) and [`product-reaches-host-shell.must-fail.patch`](./src/__tests__/known-bad/product-reaches-host-shell.must-fail.patch) — one per package that hands page templates to the shell socket, covering each one's own §3/§7 placement. ADR 023 Amendment 1 change 3 makes the page, layouts, header and footer app-owned, so each patch replaces the socket lookup with a relative escape into `apps/cart/src/shell` — the shape that makes an app-owned template a hard dependency of a package, and points a package at an app, an edge no row of §3's grant matrix carries. The catching arm is `eslint`'s `@workspace/no-cross-package-path-imports`, which resolves the escape to disk and names the package that owns the target; applying any one is expected to turn the workspace lint red naming the escape path, and reverting is expected to return it to green. The repo-root `vue-tsc -b` gate cannot see these five: `apps/cart` sits outside its project-reference graph, which is the gap this phase reports. Until the shell became app-owned these five named `@upmind-automation/client-vue`'s shell components instead; that package is gone, and the reach they control for is now the reach into an app.
- [`foundation-layout-reaches-app-chrome.must-fail.patch`](./src/__tests__/known-bad/foundation-layout-reaches-app-chrome.must-fail.patch) — the control for ADR 023 Amendment 10's invariant that `foundation`'s layout never reaches the app-owned header, footer, page or `modules/system`: it imports `useHeader` into `Inset.layout.vue` by a relative escape into `apps/cart/src/shell/components/header` and calls it. The catching arm is `eslint`'s `@workspace/no-cross-package-path-imports`, which names `apps/cart` as the owner; the repo-root `vue-tsc -b` gate cannot see it, because `apps/cart` sits outside its project-reference graph. Reverting is expected to return it to green.
- [`product-reaches-recommendations.must-fail.patch`](./src/__tests__/known-bad/product-reaches-recommendations.must-fail.patch) — the boundary control for `packages/modules-recommendations`' one-way edge onto `packages/modules-product` (ADR 023 §3, §7): it adds an import of `RECOMMENDATIONS_TEMPLATE` from `@upmind-automation/recommendations` into `product`'s `ProductCard.vue`, the shape that would turn the granted `recommendations → product` arrow into a cycle. Lint bans no such specifier either, so the catching arm is again the repo-root `vue-tsc -b` gate: `product`'s tsconfig `paths` allowlist carries no `recommendations` entry, so applying it is expected to turn `./node_modules/.bin/vue-tsc -b --force` red with a `TS2307` at the mutated import line; reverting is expected to return it to green. **Known irregularity, not introduced by this control:** this repo's negative-control runner runs `eslint` first and accepts any non-zero exit whose output merely contains the offending specifier — `import/order`'s alphabetical-ordering complaint about the new import line names the specifier incidentally, so the runner reports red without the boundary gate above ever running. Every one of the twelve patches in this directory shares that runner design; it is a pre-existing gap in `verify-negative-controls.mjs`, not something specific to this patch, and it wants its own fix rather than a per-patch workaround.
- [`boundary.must-fail.patch`](../modules-catalogue/src/__tests__/boundary.must-fail.patch) — the boundary control for `packages/modules-catalogue`'s one edge onto `packages/modules-domain` (ADR 023 §5, §7, Amendment 15). It lives beside the catalogue's own tests, not in this directory. `catalogue` loads `domain`'s DAC widget through one dynamic import, so a catalogue that never shows the domain search never loads `domain`. The patch swaps that dynamic import in `products/WidgetDAC.vue` for a static `import { UpmDacWidget } from "@upmind-automation/domain"`. The catching arm is [`boundary.test.ts`](../modules-catalogue/src/__tests__/boundary.test.ts), which turns red when any file imports `domain` statically. Reverting returns it to green.
- **Retired controls.** Each one lists the reason it went.
  - `catalogue-reaches-domain` gave the catalogue's DAC widget a static `import { UpmDac } from "@upmind-automation/domain"`. The type gate turned red with `TS2307`, because `catalogue`'s tsconfig `paths` had no `domain` entry. It went when `catalogue` started to load `domain` on demand. `catalogue` now declares `domain` as a dependency, so that `TS2307` can no longer fire. [`boundary.must-fail.patch`](../modules-catalogue/src/__tests__/boundary.must-fail.patch) and its catching arm [`boundary.test.ts`](../modules-catalogue/src/__tests__/boundary.test.ts), described above, cover the same reach.
  - `payment-unpublishes-stored-chooser` dropped `UpmStoredPaymentMethods` from `packages/modules-payment`'s barrel. It also added a consumer in `packages/modules-invoice` that imported it by name, so the type gate turned red with `TS2724`. It went with what it tested: the package no longer publishes a saved-card chooser. Nothing replaces it.
- **Two controls retired with no replacement cover.** Both losses follow from the ruling that the page shell is app-owned, not from the client-vue delete itself: an app-owned surface is copied per app and sits outside the repo-root `vue-tsc -b` project graph, so neither shape below has a gradeable subject left in the graph. Recorded here rather than dropped silently, because the capability each proved is now uncovered.
  - `client-vue-reclaims-moved-renderer` proved the ADR 023 Amendment 3 generic-controls move could not be quietly reverted: re-adding a moved renderer to the barrel it left turned the type gate red on a file that no longer existed in the package. That barrel now exists as three app copies, every one outside the root type gate, so reverting the move in any of them goes uncaught.
  - `basket-unpublishes-guest-checkout-offer` proved that a host dropping `UpmGuestCheckoutOffer` from `packages/modules-basket`'s barrel goes red. Publishing the offer exists for one purpose. `auth` sits below `basket`, so only the app page may import both and hand the offer to `UpmAuthRegister`'s `guest-checkout` slot. Its three consumers now sit in `apps/cart`, `apps/cart-nuxt` and `playgrounds/labs-nuxt`, outside the gate. No consumer the gate can see may import `basket`, because no package in the graph declares a `basket` dependency. So the control cannot be re-pointed without faking a consumer.
- **Removal-shaped controls have no home in this lane.** `scripts/verify-negative-controls.mjs` takes the text a red gate must name from the patch's own ADDED import line. A control whose mutation is a REMOVAL — dropping entries from a call, and their imports with them — gives the runner nothing to assert. The lane exits 1 on it. Giving the runner a vitest arm is a lane-design change, so a shape it cannot grade is covered by a spec instead. The shell socket this bullet used to name (ADR 023 §7, Amendment 1 change 3) is gone. ADR 023 Amendment 15 deleted `provideShellComponents`, `useShellComponents` and `SHELL_COMPONENTS` outright. Phase 10 deletes `client-vue` itself, so no package is left to hold a call to drop an entry from. Each app now keeps its own page-template record per family, keyed by that family's own enum. It also keeps a pick function with its own fallback (ADR 023 Amendment 16 ruling 4). A record missing an entry, or a pick wired to the wrong fallback, is still a `Record<Family, Component>` lint and `vue-tsc -b` cannot see through. The value type is `Component`, so any component satisfies it. [`apps/cart/tests/basket-templates.test.ts`](../../apps/cart/tests/basket-templates.test.ts) covers the five basket-family records (basket, basket product, billing, checkout, product setup) in one file; `catalogue-template.test.ts`, `domain-template.test.ts` and `recommendations-template.test.ts` cover the other three. Each test asserts, per family, that every template name draws its own component. It also asserts the pick function's fallback for no name, an empty name, and a name none of its own layouts carries. Each test's own `.must-fail.patch` beside it is its red-then-green reference. `apps/cart-nuxt` keeps its own mirror of all four.

## Layout

```text
packages/scenario-harness/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts            # single public barrel
    ├── archetype/          # structural archetype selection (not part of this handoff)
    ├── reflection/         # port → plain descriptor (not part of this handoff)
    ├── port/                port.types.ts · table-channel.types.ts
    ├── world/               world.types.ts · scope-actor.ts
    ├── steps/                steps.types.ts · step-catalog.ts · traceability.ts
    ├── registry/             harness.ts · registry.types.ts
    ├── tags/                 tags.types.ts · tags.ts
    ├── gate/                 gate.types.ts · coverage-gate.ts
    └── __fixtures__/         worked example module + spec pair + in-process world
```

Everything above is re-exported from `src/index.ts`. Import from
`@upmind-automation/scenario-harness`, never a deep path.
