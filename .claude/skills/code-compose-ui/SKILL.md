---
name: code-compose-ui
description: Author a standards-compliant prop-first composed main (`<Name>.vue`) in design-system/packages/ui — net-new over reka primitives, or replacing an old-lib `.ce.vue` with a mandatory parity table. Use when adding a composed/consolidated component, wrapping a new reka primitive family into a data-first API, or migrating a `.ce.vue` convenience element to the new library.
---

# /code-compose-ui — build a composed component to standard

Produce one composed main `<Name>.vue` (folder root, CC-B) in `design-system/packages/ui` that is **complete on arrival**: conforming to the library contract, at parity with the component it replaces, and shipping its test, story and registry entry in the same change.

> **Comments — HARD GATE.** `rules/code-quality.md#comments` is in your context — obey it. Default to **no comment**. JSDoc = contract only. An inline `//` ships only where the logic is non-obvious or fragile (a reka forwarding quirk, a MODE gate). Narration is a review BLOCKER.

## The three binding documents — read, never restate

| Document | What it binds | Where |
| --- | --- | --- |
| `COMPONENT_SPEC.md` | The whole library contract: file layout, reka wrapping, token vocabulary, focus/invalid/motion/press grammar, Vue conventions, a11y, stories, tests, registry | `design-system/packages/ui/COMPONENT_SPEC.md` |
| `.claude/rules/code-ui.companion.md` § Composed components | **CC1–CC25** — the composed-layer delta | this repo |
| ADR-024 | Why `useStyles` / `uiConfig` / `*.config.ts` are gone, and the four retirements that are *ratified* | `docs/adr/024-adopt-new-upmind-ui-in-tree.md` |

A composed component obeys `COMPONENT_SPEC.md` in full, exactly like a primitive. CC1–CC25 are additive on top. Cite them by number in your work; do not paraphrase them.

## Where things live

| Thing | Path |
| --- | --- |
| Target component folder | `design-system/packages/ui/src/components/<slug>/` — main component at the root, pieces in `parts/` (CC-B); types in `types.ts` (CC4) |
| Test-attribute utility | `design-system/packages/ui/src/lib/use-test-attrs.ts` |
| Class merge | `design-system/packages/ui/src/lib/utils.ts` (`cn`) |
| Registry schema | `design-system/packages/ui/src/lib/registry.ts` |
| Package name | `@upmind/ui` |
| **Oracle** — old-lib convenience element | `packages/ui/src/ui/<slug>/<Name>.ce.vue` + `types.ts` + `<slug>.config.ts` |
| e2e suite (locator impact) | `tests/Playwright/` |
| Best exemplars | `announcement-bar/AnnouncementBar.vue` (declared slots, JSDoc'd props, `open: undefined`), `select/SelectTrigger.vue` (`delegatedProps` + `cn`), `dialog/DialogContent.vue` (portal `$attrs` routing) |

### Step 0 — oracle reachability (do this first)

`design-system/packages/ui` exists only on the `ui-migration/*` branches. The `packages/ui` submodule holding the `.ce.vue` oracle exists only on **develop-based** branches — it is removed from `.gitmodules` on the migration branches.

So from a `ui-migration/*` worktree the oracle is **not** in your tree. Read it out of the main develop-based checkout — resolve that path, never hardcode it:

```bash
MAIN=$(git worktree list --porcelain | awk '/^worktree /{print $2; exit}')
ls "$MAIN/packages/ui/src/ui/<slug>/"
git -C "$MAIN/packages/ui" show HEAD:src/ui/<slug>/<Name>.ce.vue
```

If you cannot reach the oracle, **stop** — CC15 cannot be satisfied and the component cannot be built to standard. Say so rather than proceeding blind.

### Step 1 — does it need one at all? (CC-A)

Count the symbols a consumer must import for ordinary usage.

```bash
grep -c 'default as' design-system/packages/ui/src/components/<slug>/index.ts
```

**One ⇒ stop.** A single-import component needs no composed layer; any parity gap belongs in the primitive. **More than one ⇒ required**, continue.

### Step 2 — route the job

| Condition | Route |
| --- | --- |
| `packages/ui/src/ui/<slug>/<Name>.ce.vue` exists | **Migration.** Steps 3–4 are mandatory. |
| No `.ce.vue`, but consumers exist for an equivalent old component | **Migration** against that component. |
| Genuinely new (no old-lib counterpart, no consumers) | **Greenfield.** Skip Step 3; Step 4 still runs against the *consumer* demand you are building for. |

Never self-declare greenfield to make Step 2 disappear — that is the failure this skill exists to prevent (`verify-cosplay.companion.md`).

### Step 3 — Four-Layer Audit (migration route, MANDATORY)

Dispatch **`/code-migrate-ui`** and run its Four-Layer Audit. Do not re-derive it here. Its generic layers bind to these paths:

- **Layer 1 — source.** `<Name>.ce.vue` + `types.ts`. Every prop, slot, emit, computed and default is a contract.
- **Layer 2 — styles.** `<slug>.config.ts`. Every `cva` slot and variant is a feature. ADR-024 retires the *override mechanism*, not the behaviours it expressed — a variant that changed appearance still has to exist somewhere.
- **Layer 3 — consumers.** Everything that binds the old component:
  ```bash
  grep -rn "<Name>" --include=*.vue --include=*.ts \
    apps/cart apps/cart-nuxt packages/client-vue apps/velia apps/hosting | grep -v node_modules
  ```
  What a consumer actually binds is the required surface. `apps/cart` is the reference app — build and prove there first; `cart-nuxt` and the submodules are mirrored after, never led with.
- **Layer 4 — decisions.** Linear issues/comments and GitLab MR threads for the component, plus `docs/adr/`. Bindings in `.claude/skills/code-migrate-ui.companion.md`.

### Step 4 — the parity table

One row per capability the oracle exposes, each with exactly one disposition from `verify-parity-oracle.md`: `Direct` · `Renamed` · `Absorbed-by` · `Dropped-with-Linear-issue` · `Not-supported-with-reason`. A blank or an unexplained "not needed" is a **missing row**.

Three repo-specific rulings apply:

1. **The four ratified retirements** (CC16) — `useStyles`, `uiConfig`, `*.config.ts`, per-slot class-override maps — are `Not-supported-with-reason: ADR-024 §2`. No Linear issue needed.
2. **Everything else absent needs a signed drop.** `Dropped-with-Linear-issue` carries the issue reference. An unsigned drop is a scope-purity violation — halt and escalate, do not narrow the component until the row disappears.
3. **Defaults are rows** (CC17). `size: "lg"` → `"md"` is `Renamed`/`Absorbed-by` with the reason, never silent.

File it at `docs/sdd/<ID>/parity.yaml` when the work has an SDD bundle; otherwise post the table as a Linear comment on the story (`code-migrate-ui.companion.md`). Note `docs/reviews/` and `docs/plans/` are gitignored — a table filed only there is not filed.

### Step 5 — author the component
Read two sibling composed mains and the exemplars above before typing. The reference implementation is `tabs/` — it exercises every law. The canonical shape:

`types.ts` — props, slots, the collection type and the class map (CC4, CC3):

```ts
import type { <Name>RootProps } from "reka-ui";
import type { HTMLAttributes, VNode } from "vue";
import type { DataAttrs } from "../../lib/use-test-attrs.ts";

/** One option in a data-driven <Name>. */
export interface <Name>Option {
  value: string | number;
  label?: string;
  disabled?: boolean;
  /** Escape-hatch data/test attributes for this option's element. */
  dataAttrs?: DataAttrs;
}

/** Classes for the parts a consumer can reach. The root takes `class` instead. */
export interface <Name>Ui {          // CC3 — one map, never a prop per element
  content?: HTMLAttributes["class"];
}

export interface <Name>Props extends <Name>RootProps {
  /** The options to render — the data-first alternative to hand-assembling the parts. */
  items?: <Name>Option[];
  /** Classes for the root. */
  class?: HTMLAttributes["class"];
  /** Per-part class overrides. */
  ui?: <Name>Ui;
  /** Escape-hatch data/test attributes for the root. */
  dataAttrs?: DataAttrs;
}

export interface <Name>Slots {
  /** The element that opens the overlay. */
  trigger?: () => VNode[];
  /** Per-option content; falls back to the option's label. */
  item?: (props: { option: <Name>Option }) => VNode[];
}
```

`<Name>.vue` — the main component, **template first** (CC0). Its pieces are imported from `./parts/`:

```vue
<template>
  <<Name>
    v-bind="{
      ...forwarded,
      ...$attrs,
      ...useTestAttrs({ key: '<slug>', dataAttrs: props.dataAttrs })
    }"
    :class="props.class"
  >
    <<Name>Trigger>
      <slot name="trigger" />
    </<Name>Trigger>

    <<Name>Content v-if="meta.hasItems" :class="props.ui?.content">
      <<Name>Item
        v-for="(option, index) in props.items"
        :key="option.value"
        :value="option.value"
        :disabled="option.disabled"
        v-bind="
          useTestAttrs({
            key: '<slug>-item',
            value: [option.value, index],
            dataAttrs: option.dataAttrs
          })
        "
      >
        <slot name="item" :option="option">{{ option.label ?? option.value }}</slot>
      </<Name>Item>
    </<Name>Content>
  </<Name>>
</template>

<script setup lang="ts">
import type { <Name>RootEmits } from "reka-ui";
import { computed } from "vue";
import { useForwardPropsEmits } from "reka-ui";
import <Name> from "./<Name>.vue";
import <Name>Trigger from "./<Name>Trigger.vue";
import <Name>Content from "./<Name>Content.vue";
import <Name>Item from "./<Name>Item.vue";
import { omit } from "../../lib/utils.ts";
import { useTestAttrs } from "../../lib/use-test-attrs.ts";
import type { <Name>Props, <Name>Slots } from "./types.ts";

defineOptions({ name: "<Name>", inheritAttrs: false });   // CC1, CC8

const props = withDefaults(defineProps<<Name>Props>(), {
  items: () => [],
  open: undefined                                    // CC6 — only where the root has a controlled boolean
});

const emits = defineEmits<<Name>RootEmits>();        // CC7 — forward, never re-implement v-model

const slots = defineSlots<<Name>Slots>();    // CC5

// CC7 — omit what this component consumes; no `_`-prefixed throwaways.
const rootProps = computed(() =>
  omit(props, ["items", "class", "ui", "dataAttrs"])
);
const forwarded = useForwardPropsEmits(rootProps, emits);

const meta = computed(() => ({                       // CC12, CC14 — every gate here, none in the template
  hasItems: props.items.length > 0,
  hasTrigger: !!slots.trigger
}));
</script>
```

Three things the skeleton is deliberately showing:

- **`useTestAttrs` is called in the template** (CC8b), not lifted into a `computed` or a helper — it is pure and reactive wherever it runs, and it belongs beside the element it lands on.
- **`omit`, not destructure-and-discard** (CC7). The old `delegatedProps` pattern needed `_`-prefixed names purely to satisfy eslint; the helper removes the need.
- **One `ui` map** (CC3). Adding `headerClass`, `listClass`, `contentClass` as separate props is the pattern this replaces. `ui` carries a plain class value per part — it is not the retired `uiConfig`, and it cannot be folded into `class` (Vue's object-class syntax owns that).

Verify reka export and prop names against `node_modules/reka-ui/dist/index.d.ts` before importing — `COMPONENT_SPEC.md` requires it and memory is not a source.

### Step 6 — ship the rest of the change (CC23–CC25)

Five files, same commit:

1. **`tests/<Name>.test.ts`** — data→DOM, each slot override, the test-key route, the a11y contract. `document.body` queries for teleported content. 3–6 focused `it()` blocks, no snapshots. All verification lives in the folder's `tests/`.
2. **`tests/<Name>.<what-it-breaks>.patch`** — negative control; any `*.patch` in `tests/` is one (`Tabs.degrade-rail.patch`). **The seat that wrote the component authors the patch** (it knows the line it changed); confirming it flips the suite RED happens blind, without reading the diff — and automatically, since `pnpm test` runs `scripts/verify-must-fail.ts` after the green suite.
3. **`<Name>.stories.ts`** — add a `PropFirst` story, realistic Upmind billing/hosting copy, and a JSDoc block explaining what the composed form is for.
4. **`types.ts` + `registry.ts` + `index.ts`** — `<Name>` and the option type in `exports`; one `props` row per composed-only prop prefixed `<Name> — …`; a composed `examples` entry; `a11y` notes for anything the composed layer owns.

### Step 7 — verify

```bash
pnpm --filter @upmind/ui test
pnpm --filter @upmind/ui typecheck
pnpm --filter @upmind/ui build:registry
```

Read the log's EXIT line; typecheck is per-package and needs the sandbox off. `lib/storybook-ids.test.ts` guards story↔registry alignment — it must stay green.

**Locator-impact sweep (blocking).** Any `data-test-key` this component emits is a live Playwright locator:

```bash
grep -rn "<slug>" tests/Playwright/ | grep -iE "test-key|getByTestId|locator"
```

A changed or newly-absent key breaks the suite silently — either keep the old key or update the specs in the same change.

**Visual regression (blocking for anything that changes the rendered tree).** A composed component assembles the DOM, so any change to it is a visual change. The live-staging Playwright VRT suite under `tests/Playwright/e2e/visual-regression/` (basket, billing, checkout, catalogue, product-config, registration…) is the only visual check this repo has. Run the specs covering the surfaces your component appears on, and read the result from `.last-run.json` plus time-filtered `allure-results` — not from console scrollback.

**Then drive it for real.** A green unit test is not delivery (`verify-cosplay.md`). Render the composed component in Storybook *and* in `apps/cart` at a real call site, and drive the flow it sits in — a change that re-activates a subsystem is verified by driving it, not by typecheck. Reuse the running dev server; never kill it.

### Step 8 — file the evidence

- The parity table → `docs/sdd/<ID>/parity.yaml` or a Linear comment on the story.
- The read-back (command + output) → the story's evidence per `verify-evidence-filing.companion.md`. A read-back that lived only in this session is not filed.
- Update Linear status + a completion comment as the work lands.

## Checklist — none of these is optional

- [ ] Oracle reachable and read (Step 0); `.ce.vue` + `types.ts` + `<slug>.config.ts` all consulted
- [ ] Four-Layer Audit run via `/code-migrate-ui`; consumers swept across cart, cart-nuxt, client-vue, velia, hosting
- [ ] Parity table complete — one row per oracle capability, every disposition explicit, every drop ADR-024-ratified or `Dropped-with-Linear-issue`
- [ ] CC1–CC25 satisfied; `COMPONENT_SPEC.md` obeyed in full
- [ ] Component carries its own `data-test-key` (CC9); item hooks keep the collection key constant (CC10)
- [ ] Slots declared with `defineSlots` + JSDoc (CC5); gates in a `meta` computed (CC12); no `cva`/`cn` (CC3)
- [ ] `tests/` (test + negative-control patch) + `PropFirst` story + registry/index updates all in the same change
- [ ] Package test / typecheck / build:registry green; locator sweep clean; driven for real in cart
- [ ] Parity table and read-back filed where they persist (not `docs/reviews/` or `docs/plans/` — gitignored)

## Seats

Under `agent-run` / `code-wave`, the seat split binds: **developer** writes the component and the negative-control patch; **prover** writes the test contract-fed, without reading the diff; **reviewer** pre-gates; **verifier** returns PRESENT/ABSENT. An interactive operator session is not seat-restricted, but the mutant-authoring split still holds — a prover that reads source to hand-author a negative-control patch has breached diff-blindness.

## Quick invoke

```
/code-compose-ui <slug>
```

Build the composed component for `<slug>` in design-system/packages/ui. Read COMPONENT_SPEC.md and CC1–CC25, run the Four-Layer Audit against the old-lib `.ce.vue`, produce the parity table, then ship the component with its tests/ (test + negative control), PropFirst story and registry entry.
