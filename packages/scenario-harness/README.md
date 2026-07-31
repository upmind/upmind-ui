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
| 3 | `COMPOSABLE_KEY` manifest | the one shared key union | every executor's own factory registry |
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

Types: `src/gate/gate.types.ts:13-19` (`GateInput`), `:21-31` (`GateVerdict`).
Function: `src/gate/coverage-gate.ts:9-55` (`runGate`) — pure, one call per
scope-matrix cell.

`GateInput` is everything one verdict pass needs: `actionKeys` (live action
names for that actor), `tags` (this package's parsed map), `actionSchemas`
(action id → its input schema, or `undefined`), `coveredActionIds` (the ids a
module's step catalog exercises).

"Input-taking" is keyed **only** off `actionSchemas[actionId] !== undefined`
(`coverage-gate.ts:31`) — never runtime parameter introspection. Verdict
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

### 3. `COMPOSABLE_KEY` manifest

`src/registry/registry.ts:7-9` (`COMPOSABLE_KEY` as-const), `:11-12`
(`ComposableKey`); `src/registry/registry.types.ts:4` (`ComposableRegistry<T>`).

This is the **only** key list. Extension procedure for a new module:

1. Add one entry to `COMPOSABLE_KEY` in `registry.ts`.
2. Every executor that declares its live-factory map as `const registry = { ... } satisfies ComposableRegistry<...>` now fails to compile until it binds the new key — there is no second manifest to remember to update, and no executor can silently skip a key.

Renaming or removing a key is the same mechanism in reverse: every binding
site (and any fixture typed against `ComposableKey`) goes red at the same
time.

### 4. `defineSteps` / `World` — the step-authoring contract

`World`: `src/world/world.types.ts:22-28`. Step shapes:
`src/steps/steps.types.ts:10-14` (`StepDef`), `:24-28` (`StepRegistrar`).
Builder: `src/steps/step-catalog.ts:15-33` (`defineSteps`).

A `<module>.steps.ts` file's import surface is exactly `{ defineSteps, World,
COMPOSABLE_KEY }` from this package — nothing else, no test-engine import.
Inside, `defineSteps(({ Given, When, Then }) => { ... })` registers
`Given`/`When`/`Then` patterns whose handlers each receive a `world` and talk
to the module only through its five methods: `boot(key, scope)`,
`fire(actionId, input?)`, `expectMeta(expected)`, the optional
`expectContext(expected)`, and `dispose()`. `expectMeta`/`expectContext` are
subset matches over already-plain data — never a UI assertion. Every member
returns a `Promise`, so a remote-driving `World` implementation and an
in-process one satisfy the same type. See
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

`src/steps/traceability.ts:76-107`, returns a `TraceabilityResult`
(`:16-20`: `ok`, `unmatchedFeatureSteps`, `orphanStepDefs`).

Usage, per module: read the sibling `.feature` file as text, import its
`.steps.ts` catalog, and assert
`createTraceabilityCheck(featureText, catalog).ok`. Matching uses the same
cucumber-expression engine a real test runner uses at registration time, so a
match here is a match there. Both drift directions are surfaced by name: a
feature step matched by no `StepDef` lands in `unmatchedFeatureSteps`
(with its line number); a `StepDef` matched by no feature step lands in
`orphanStepDefs`. `ok` is true only when both are empty.

This checker is designed to extend an existing feature↔test traceability
pattern already in use elsewhere in the codebase
(`packages/headless/src/modules/client-address-dry/__tests__/client-address-dry.traceability.test.ts`),
applied here to a feature↔steps pair instead of a feature↔test-id pair. That
file is a precedent to model a new `<module>.traceability.test.ts` on, not a
test of this package.

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

1. **Add a key.** One entry in `COMPOSABLE_KEY` (`src/registry/registry.ts`).
2. **Stamp the module's action members.** One `@playground-include` or `@playground-exclude <reason>` doc-comment per public action (§1) — write only where a member has no existing tag.
3. **Write the spec pair.** A human-readable `.feature` next to a `<module>.steps.ts` built with `defineSteps` over `World` (§4) — the step bodies are the only place the module's real behaviour is driven from.
4. **Wire the drift test.** A `<module>.traceability.test.ts` that reads the `.feature` text, imports the steps catalog, and asserts `createTraceabilityCheck(...).ok` (§5).
5. **Wire the coverage test.** A per-module test that assembles a `GateInput` (live action enumeration + this package's tag parser + the module's action-schema map) and asserts on `runGate(...)` (§2).
6. **Bind the executor registries.** Every place a `ComposableRegistry` is declared now needs the new key bound, or it will not compile (§3).

## Fixtures and negative controls

- [`src/__fixtures__/fixture-module.ts`](./src/__fixtures__/fixture-module.ts), [`fixture.feature`](./src/__fixtures__/fixture.feature), [`fixture.steps.ts`](./src/__fixtures__/fixture.steps.ts), [`node-world.ts`](./src/__fixtures__/node-world.ts) — a minimal four-member stand-in module plus its full spec pair and an in-process `World`, showing the shape end to end: module → `.feature` → `steps.ts` → `World`. The switch it models is a stand-in, not product behaviour.
- [`src/__tests__/known-bad/vue-value-import.must-fail.patch`](./src/__tests__/known-bad/vue-value-import.must-fail.patch), [`headless-type-import.must-fail.patch`](./src/__tests__/known-bad/headless-type-import.must-fail.patch) — reference patches for the no-vue lint boundary described above: applying either to a source file and running the workspace lint is expected to turn it red naming the banned specifier; reverting is expected to return it to green.

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
    ├── registry/             registry.ts · registry.types.ts
    ├── tags/                 tags.types.ts · tags.ts
    ├── gate/                 gate.types.ts · coverage-gate.ts
    └── __fixtures__/         worked example module + spec pair + in-process world
```

Everything above is re-exported from `src/index.ts`; import from
`@upmind-automation/scenario-harness`, never a deep path.
