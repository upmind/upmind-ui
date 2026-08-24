---
paths:
  - '**/*.vue'
  - '**/*.styles.ts'
  - '**/*.css'
---
> Companion to [code-ui.md](../../.agent/rules/code-ui.md) — Upmind-monorepo-specific bindings/examples.

## JSON/UI Schema Conventions (Uischema / JSONForms)

This monorepo authors forms and dynamic UI from a JSONForms-based **`Uischema`** system. On top of the base UI-authoring rules:

- Use `Uischema` (lowercase 's'): `useLoginUischema`.
- **All uischema elements MUST have an `i18n` property** — no rendered label/copy is hardcoded; it is resolved through the `i18n` key. This is mandatory and non-negotiable in this repo.

```typescript
// CORRECT
{ type: "Control", scope: "#/properties/username", i18n: "form.auth_email", options: { ... } }
// WRONG - Missing i18n
{ type: "Control", scope: "#/properties/username" }
```

### Review checklist addition

- [ ] Every uischema element has an `i18n` property

## Composed components — `design-system/packages/ui`

The prop-first layer over the reka-ui primitives, replacing the old lib's `.ce.vue` "convenience element" layer (`packages/ui/src/ui/**`).

**Two documents already bind and are never restated here:**

- **`design-system/packages/ui/COMPONENT_SPEC.md`** — the library's canonical component contract: file layout, reka-ui wrapping, the token vocabulary, focus/invalid/motion/press grammar, Vue conventions, a11y, stories, tests, registry. **Every composed component obeys it in full**, exactly like a primitive. Read it before writing one.
- **ADR-024 §2** — the styling model (`useStyles`, `uiConfig` and `*.config.ts` retired; `cva()` kept as an internal class-organiser).

The laws below are the **delta**: what the composed layer needs and `COMPONENT_SPEC.md` does not cover. The old lib's `.ce.vue` for the same component is the composed component's **parity oracle** — see [verify-parity-oracle.companion.md](./verify-parity-oracle.companion.md).

Skills: `/code-compose-ui` (new or migrated) and `/code-upgrade-ui` (existing). Both cite these laws; neither restates them.

### CC-A, CC-B · When one exists, and where its files go

*(Operator rulings, 10 Aug 2026.)* **CC-B conversion is part of each component's upgrade** — one review covers content and shape together. A component keeps the flat layout only until its turn in the review queue; there is no separate reshape pass.

- **CC-A — More than one import to use it ⇒ a composed component is required. One import ⇒ none is needed.** The test is mechanical: count the symbols a consumer must import for ordinary usage. `import { Badge }` is one, so Badge needs nothing. `import { TabsRoot, TabsList, TabsTrigger, TabsContent }` is four, so Tabs must offer a single-import form. This supersedes every earlier heuristic — a `v-for` in the old `.ce.vue`, hand-assembly demand counts, library part counts. Measured across the library: **50 of 85 components qualify; the composed `Tabs` is the reference implementation.**

  *(Operator rulings, 10 Aug 2026.)* Three refinements bind the ledger:
  - **Library-complete, not demand-driven**: a qualifying family gets its composed form even with no in-repo consumer yet — future apps and external consumers count. Zero usage defers nothing.
  - **Required, not offered**: the test counts imports needed for *ordinary usage*, never exports on offer. Sibling exports sharing a folder (`InputPassword` + `PasswordStrength`) and single-import mains with exported internals (`Card`, `Calendar`) do not qualify.
  - **Composition kits are exempt**: a component whose consumer contract IS assembly — `option-tile`, whose direct consumers are themselves picker-builders with bespoke tile content — keeps its parts surface. Kit exemptions are operator-ruled by name, never self-granted. *(Operator ruling, 11 Aug 2026.)* **No new kits**: every candidate brought for exemption (combobox anchor-sites, input/InputGroup, radio-group embeds) was ruled EXTEND instead — "we should be able to achieve everything they need to do without importing individual pieces." A capability gap in the composed form is closed in the composed form; option-tile remains the only standing exemption.

  Build-out complete 11 Aug 2026; FE-3075 holds the ledger — build list, kit/sibling/layout dispositions.
- **CC-B — The main component sits at the folder root; its pieces live in `parts/`.** *(Operator ruling, 11 Aug 2026: universal.)* This is the folder grammar for EVERY multi-file component folder, composed or not — calendar, interstitial, the shells and the other never-upgraded folders included. The remaining ~17 flat folders convert in one dedicated sweep, sequenced late (it renames files) like the other file-moving sweeps. *(Executed 11 Aug 2026 as a whole-history rewrite — every folder is born with the grammar; the namesake main stays at root, every other `.vue` is a part.)* **Sibling-mains exception** *(operator ruling, 11 Aug 2026)*: a folder of co-equal sibling components with no namesake main and no composition relationship keeps its mains at root — `brand-gradient` (MeshGradient + GrainGradient) is the standing example. The main component is the single-import one, and it takes the **plain name** — `tabs/Tabs.vue` *is* the composed component; the reka root wrapper it builds on is `parts/TabsRoot.vue`. No `.composed.vue` suffix on the main file, and no `Composed` in its type names (`TabsProps`, `TabsUi`, `TabsSlots`). The hand-assembled parts stay exported and first-class (CC1) — `parts/` marks composition order, not privacy. `ui` keys are the part names, so `ui.header` styles `parts/TabsHeader.vue`.

  ```text
  components/tabs/
  ├── Tabs.vue            ← the main component, one import to use
  ├── types.ts  variants.ts  index.ts  registry.ts
  ├── Tabs.stories.ts     ← stories stay at root: the showcase, not the proof
  ├── tests/
  │   ├── Tabs.test.ts  TabsParts.test.ts
  │   └── Tabs.<slug>.patch   ← negative controls (CC23)
  └── parts/
      ├── TabsRoot.vue  TabsHeader.vue  TabsList.vue
      └── TabsTrigger.vue  TabsContent.vue
  ```

  Everything that *verifies* the component lives in `tests/` — the test files and the negative-control patches beside them. Shared `context.ts` (injection keys used by main and parts alike) stays at the folder root with the other bare names.

  **This renames a public export.** `Tabs` now resolves to the composed component; existing `<Tabs><TabsList>` hand-assembly must move to `TabsRoot`. Accepted at ruling time.

- **CC-C — Consumers never hand-assemble from parts when a composed component exists.** *(Operator ruling, 10 Aug 2026.)* The single import IS the consumer API: a call site reaching for `TabsRoot`/`TabsList`/… where `Tabs` exists is wrong even when it renders identically. A layout the composed form cannot express is a **missing capability of the composed component** — extend it (a prop, a slot, a `ui` key), never drop to parts. Parts stay exported so the composed component itself can be built and so stories/tests can exercise them; they are not a consumer surface. A call site may hold on parts only while its blocking capability gap is filed. Neither stories nor registry examples showcase hand-assembly as a consumer idiom.

### CC1–CC3 · Shape

- **CC0 — `<template>` comes first.** *(Operator ruling, 10 Aug 2026 — overrides the script-first order the ~350 primitives use.)* The markup is what a reader opens the file for; the script is how it is fed. Order: `<template>`, then `<script setup lang="ts">`. Types live in `types.ts` (CC4), so a composed component has exactly these two blocks. *(Operator ruling, 11 Aug 2026.)* Parts flip template-first at their folder's reshape turn — the turn already owns the files; whatever the queue never touches converts in one mechanical sweep after the tray empties.
- **CC1 — One per folder, purely additive.** `<Name>.vue` at the folder root (CC-B), `defineOptions({ name: "<Name>" })`, exported under the plain name; the reka root wrapper it builds on is `parts/<Name>Root.vue`. A composed component never replaces or hides a primitive; the parts stay exported for the library's own composition — though consumers use the composed form only (CC-C).
- **CC2 — Prop-first, slot-escapable.** Its whole job is turning data (`items` / `tabs` / `title`) into the primitive tree. Every data prop has a named slot escape hatch for rich content, and every item slot exposes its item as a scope param (`<slot name="item" :option="option">`).
- **CC3 — Owns no presentation, and routes classes through one object.** No `cva`, no class literals, no token utilities; the primitive that owns an element does the `cn()` merge (`COMPONENT_SPEC.md` § Build on reka-ui), so a composed component reaching for `cn` is styling something it does not own. Two props carry classes and no more: **`class`** for the root (or the element a consumer most obviously means), and **`ui`** — a single object keyed by part — for everything else. *(Operator ruling, 10 Aug 2026.)* One `<Name>ComposedUi` interface per component; never a prop per element (`headerClass`, `listClass`, `termClass`… is the pattern this replaces).

  ```ts
  export interface TabsUi {
    header?: HTMLAttributes["class"];
    list?: HTMLAttributes["class"];
  }
  ```

  **`ui` is not `uiConfig` returning.** ADR-024 §2 retired `uiConfig`, `useStyles` and the `*.config.ts` cva-slot override maps, and that stands. `ui` takes a plain class value per part and nothing else — no variant maps, no `CxOptions`, no merge engine. It shares the Nuxt UI name because the shape is familiar, not the mechanism.

  It cannot be folded into `class`: `HTMLAttributes["class"]` is `any` and clsx's `ClassValue` includes `ClassDictionary`, so an object passed as `class` typechecks, reaches `cn()`, and emits the part names as literal CSS classes. Vue's own `:class="{ 'is-open': isOpen }"` object syntax owns that position.

### CC4–CC7 · API surface

- **CC4 — Props, slots and collection types live in the folder's `types.ts`.** *(Operator ruling, 4 Aug 2026 — this overrides `COMPONENT_SPEC.md` § Vue conventions, which has the interface inline.)* Each composed component's folder carries a `types.ts` exporting `<Name>ComposedProps`, `<Name>ComposedSlots` and its collection type (`TabItem`, `DescriptionListOption`, …); the SFC imports them, so no `<script lang="ts">` block is needed alongside `<script setup>`. Bare `types.ts`, matching the folder's other bare names (`variants.ts`, `context.ts`, `registry.ts`) and the old lib's own per-folder convention. All three are re-exported from `index.ts` and listed in `registry.ts` `exports`. Vue resolves imported prop types in `defineProps` — verified. *(Operator ruling, 11 Aug 2026: universal — executed as a whole-history rewrite.)* NO component declares prop types inline — no `interface Props` in an SFC, no `defineProps<X & {...}>` intersections; every part's props live in the folder's `types.ts` as `<PartName>Props`. The same holds for emit and slot contracts: no inline `defineEmits<{…}>` / `defineSlots<{…}>` literals — they live in `types.ts` as `<Name>Emits` (type alias) and `<Name>Slots` (interface). Where a part's natural name collides with the external base it extends (`AlertDialogProps` vs reka's), the external import takes a `Reka<Name>`-prefixed alias — the one place the no-alias import style yields; namespace imports are not an option because `@vue/compiler-sfc` cannot resolve namespace-qualified extends bases in `defineProps`.
- **CC5 — Slots are declared.** `defineSlots<>()` with a JSDoc line per slot, including the item slots and their scope params. Never leave the contract for `$slots` to discover at runtime. Slot functions return `VNode[]` — Vue's own slot type — never `any` or `unknown` *(operator ruling, 10 Aug 2026: no `any`/`unknown` where a defined type exists)*. Exemplar: `announcement-bar/AnnouncementBar.vue`.
- **CC6 — Absent booleans stay absent.** A controlled boolean that must fall through to reka when unset declares `open: undefined` in `withDefaults` — an absent Vue boolean prop casts to `false`, not `undefined`, so the default silently pins the controlled state.
- **CC7 — Explicit delegation via `omit`, never underscore throwaways.** Strip the props the component consumes with `omit(props, [...])` from `lib/utils.ts`, then `useForwardPropsEmits`. **No `_`-prefixed variables** *(operator ruling, 10 Aug 2026)* — the destructure-rest `delegatedProps` pattern needs them only because eslint's `unused-vars` ignores `^_`, so the helper replaces the pattern rather than the linter excusing it. A value the root *and* a part both need is bound explicitly on the element (`:default-value="resolvedDefault"`), never injected into the forwarded object — reka rebuilds forwarded props from the actual prop values and drops injections. v-model is forwarded, never re-implemented: no `useVModel`.

  ```ts
  const rootProps = computed(() => omit(props, ["tabs", "variant", "class", "classes"]));
  const forwarded = useForwardPropsEmits(rootProps, emits);
  ```

### CC8–CC11 · Attribute and test-hook routing

`COMPONENT_SPEC.md` is silent on test hooks; this is the whole law for them.

- **CC8 — `inheritAttrs: false` + exactly one explicit `$attrs` route.** Any composed component rendering more than one element sets it and binds `v-bind="$attrs"` on the element the consumer means — the trigger for triggered controls, the panel for overlays. Auto-inheritance lands consumer attributes on whichever element happens to be first, and on a portalled overlay that is the Teleport, which never reaches the DOM.
- **CC8b — `useTestAttrs` is called in the template, not lifted into the script.** *(Operator ruling, 10 Aug 2026.)* It is a pure function of its input and re-evaluates reactively wherever it is called, so `v-bind="useTestAttrs({ key: 'tab-item', value: [item.value, index], dataAttrs: item.dataAttrs })"` goes straight on the element. No `const rootTestAttrs = computed(...)`, no `function triggerTestAttrs(item, index)` — a wrapper adds a name to read past and puts the hook a step away from the element it lands on.
- **CC9 — Every composed component carries its own default key.** `useTestAttrs({ key: "<kebab-name>", … })`. A keyless `useTestAttrs({ dataAttrs })` emits nothing at all unless the consumer supplies a key — that is a bug, not a default. Receipt: on the branch that introduced the utility, **all seven** composed components call it keyless — the hook was ported and then wired to produce almost nothing.
- **CC10 — Collection key constant, item identity in `value`.** `useTestAttrs({ key: "tab-item", value: [item.value, index] })`. Interpolating the value into the key (`key: \`tab-${item.value}\``) destroys every locator that selects the collection rather than one member. Receipt: `Tabs.vue`.
- **CC11 — `dataAttrs` is the only override channel** — on the component and on every item type. A parent overrides key/value there, never by fallthrough; a fallthrough `data-test-*` auto-inherits onto every descendant and collides under strict-mode locators.

### CC12–CC14 · Derivation

- **CC12 — Gates live in a `meta` computed.** No multi-clause conditions inline in the template. Receipt: `Dialog.vue`'s four-term header `v-if`. *(Operator ruling, 10 Aug 2026.)* `meta` holds **flags and one-expression derivations only** — a loop, mutation, or multi-statement algorithm inside it means the derivation is missing its name. Extract it as a pure function `meta` calls (`toMenuGroups(props.items)`); a complicated `meta` is the tell that something is wrong.
- **CC13 — Named clauses, single expression. No lodash here.** No early-return `true`/`false` chains, no ternaries. The Lodash mandate in [code-quality.companion.md](./code-quality.companion.md) binds app code and **does not reach `design-system/packages/ui`**: `lodash-es` is not a dependency of that package, no component imports it (`markdown/Markdown.vue` hand-rolls a "lodash `lowerCase` equivalent" rather than adding it), and `COMPONENT_SPEC.md` makes adding a dependency a design-system decision. Use native methods, and `.at(0)` over `[0]` where the result may be absent.
- **CC14 — Slot presence is a `meta` flag**, not raw `$slots.x` truthiness repeated through the template.

### CC15–CC17 · Parity — the anti-cosplay law

- **CC15 — Replacing a `.ce.vue` is a migration.** `/code-migrate-ui`'s Four-Layer Audit and a complete parity table are mandatory *before* the first line of the composed component, with the `.ce.vue` (plus its `types.ts` and `*.config.ts`) as the oracle.
- **CC16 — ADR-024 ratifies exactly four retirements** — `useStyles`, `uiConfig`, `*.config.ts`, and the per-slot class-override maps. Every *other* absent capability is an unsigned drop: re-implement it, or carry `Dropped-with-Linear-issue`. Receipts already paid for downstream on the current branch: the single-tab degrade (regressed `Sections`, fixed twice), the tooltip arrow, the dialog `dismissable` close-guard, the dropdown async `handler`, the alert `action` link.
  **Operator ruling, 4 Aug 2026 — dependency-bound capabilities.** A capability the oracle delivered *only* through a dependency the new library does not carry is `Not-supported-with-reason`, not a drop needing an issue — the new component's own intended behaviour stands. `COMPONENT_SPEC.md` makes adding a dependency a design-system decision, so a per-component migration may never add one to close a parity row. This covers the old lib's `v-auto-animate` row/option animation in `description-list`, `checkbox-cards`, `radio-cards` and `select-grouped`: the new library ships no row-enter motion for these, by design, and that is the intended behaviour.
- **CC17 — Defaults are parity rows.** A changed default (`size: "lg"` → `"md"`, `variant: "outline"` → none) is a documented remap or a documented drop, never a fresh choice made in passing.

### CC18–CC22 · Correctness details the seven got wrong or left undecided

- **CC18 — `v-for` keys on identity, never the index.** `:key="item.value"`. An index key with a filtered or reorderable collection makes Vue reuse the wrong DOM node. Receipt: `DropdownMenu.vue` keys on `index` while its items carry a `hidden` flag, so members are skipped and the keys shift under them.
- **CC19 — `asChild` is not a composed-component prop.** A composed component renders a *tree*; there is no single element to merge into. It uses `as-child` internally on the trigger to adopt the consumer's slot content, and a consumer needing real `asChild` control uses the primitives. Strip it from the forwarded root props if the reka root type carries it.
- **CC20 — the accessible name is declared.** Every composed component states, in a prop JSDoc, how its accessible name arrives: a `title` that renders into the reka title part, an `ariaLabel` for controls with no visible label, or the consumer's trigger content. "reka handles it" is not an answer for a component that assembles the tree. The seven are inconsistent here — only Select exposes `ariaLabel`.
- **CC21 — empty-collection behaviour is explicit.** What an empty `items` renders is a decision, not an accident: no overlay, an empty-state slot, or a documented empty panel. Gate it off `meta`.
- **CC22 — no user-visible copy defaults.** The composed layer takes every rendered string as a prop and never defaults it to English — a `withDefaults` string default ships untranslatable copy from inside the library. (`AnnouncementBar`'s `label: "Announcement"` is the pattern not to copy.)

### CC23–CC25 · What ships with it

- **CC23 — tests in the folder's `tests/`**: data→DOM, each slot override, the test-key route, and the a11y contract (role/aria). Plus at least one **negative control**: any `*.patch` inside `tests/` is one, named `<TestBasename>.<what-it-breaks>.patch` (`Tabs.degrade-rail.patch`). Whoever wrote the source authors the mutant — they know the line that must be load-bearing; confirming it flips the suite RED is done blind, without reading the diff. The controls run automatically: `pnpm test` in the ui package executes `scripts/verify-must-fail.ts` after the green suite — every patch is applied, must flip its component's tests red, and is reverted (it refuses to mutate files with uncommitted changes; legacy colocated `<Name>.must-fail*.patch` files are honoured until each pre-standard component upgrades).
- **CC24 — A `PropFirst` story** in `<Name>.stories.ts`, realistic Upmind copy, per `COMPONENT_SPEC.md` § Stories.
- **CC25 — `registry.ts` and `index.ts` updated**: `<Name>` and its item type in `exports`; one `props` row per composed-only prop, prefixed `<Name> — …`; a composed `examples` entry; `a11y` notes for anything the composed layer owns.

### CC26 · Where classes live — placement + conditional discipline

*(Operator ruling, 10 Aug 2026.)* A class string has exactly two homes: **on the element, in a template** — a part's own `cn()` merge, an app element, or a `class`/`ui` value written at the call site — or **in the folder's `variants.ts`** when the look varies by prop. Never in a script const, record, or computed; no `<style>` blocks; no arbitrary values. The script names states, the template maps them to classes:

- Inline `cn()` conditionals carry **one or two named toggles with small payloads** (`meta.isCompact && 'p-2'`).
- A one-of-N look is a **variant**: classes go to `variants.ts` and the consumer picks by name. App code computes the variant *name* (`:variant="invoiceVariant"`), never the classes.
- Many independent toggles on one element mean the element is overloaded — split it, or collapse the toggles into fewer named `meta` states.

*(Operator rulings, 11 Aug 2026.)* **`variants.ts` earns its place only through variance or reuse.** It holds `cva` exports only, one string per concern in the base, no comments, no `[].join`, no plain consts: real variants for looks that vary by prop, plus zero-variant `cva` ONLY for a static look shared by two or more call sites (menu `Content`+`SubContent`, pagination's five buttons, the nav trigger coat). A single-use static look lives inline in its part's `cn()` — never parked in `variants.ts`, never a script const or computed. A component with neither variance nor shared statics has no `variants.ts` at all. Files stay self-contained — **no shared cross-component recipe module**, even where recipes repeat across the library.

App-code corollary (binds every consumer flip this layer reviews): a name→class record in script (`SIZE_MAX_WIDTH` in `OverlayContainer.vue` is the standing example) is a hand-rolled variant in the wrong layer. It moves into the component's `variants.ts` and becomes a prop at that component's upgrade turn.

### Review checklist addition

- [ ] Composed component carries a default `data-test-key`; item hooks keep the collection key constant (CC9, CC10)
- [ ] Every `.ce.vue` capability has a parity row; every drop is ADR-024-ratified or `Dropped-with-Linear-issue` (CC15–CC17)
- [ ] Slots declared via `defineSlots`; gates in a `meta` computed; no `cva`/`cn` in the composed layer (CC3, CC5, CC12)
- [ ] Every class string sits in a template or in `variants.ts` — none in script consts, records, or computeds (CC26)
- [ ] `variants.ts`: `cva` only, justified by variance or ≥2-site reuse; single-use static looks inline in the part; no `[].join`, no comments (CC26)
