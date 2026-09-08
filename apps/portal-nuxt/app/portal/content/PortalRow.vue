<template>
  <PageSection
    v-if="meta.kind === 'full'"
    :class="['min-w-0', meta.class, props.class]"
  >
    <slot />
  </PageSection>

  <div
    v-else-if="meta.kind === 'split-equal'"
    :class="[ROW_SPLIT_EQUAL_CLASS, props.class]"
  >
    <div class="min-w-0"><slot name="start" /></div>
    <div class="min-w-0"><slot name="end" /></div>
  </div>

  <div
    v-else-if="meta.kind === 'split-aside'"
    :class="[ROW_SPLIT_ASIDE_CLASS, props.class]"
  >
    <template v-if="meta.aside === 'left'">
      <div class="min-w-0"><slot name="aside" /></div>
      <div :class="['min-w-0', ROW_SPLIT_ASIDE_WIDE_CLASS]">
        <slot name="main" />
      </div>
    </template>
    <template v-else>
      <div :class="['min-w-0', ROW_SPLIT_ASIDE_WIDE_CLASS]">
        <slot name="main" />
      </div>
      <div class="min-w-0"><slot name="aside" /></div>
    </template>
  </div>

  <div v-else :class="[ROW_TRIPLE_EQUAL_CLASS, props.class]">
    <div class="min-w-0"><slot name="start" /></div>
    <div class="min-w-0"><slot name="middle" /></div>
    <div class="min-w-0"><slot name="end" /></div>
  </div>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/content/PortalRow
 * @description The content primitive's row component (tasks.md 4.1,
 * design.md §D7) — one layout vocabulary covering all six board row shapes.
 * Every multi-column layout is a proportional grid PortalRow supplies
 * itself: `PageBody`'s aside is a fixed track beside a fluid main, right for
 * a sidebar but wrong for a proportion, which is what every board row is
 * (corrected 2026-08-24 — see §D7's history for the regression this caused).
 *
 * A page composes this directly, filling its named slots with hand-authored
 * content — the same "native slot for content the framework does not model
 * yet" pattern `PortalFrame`'s `logo`/`header-actions` slots use (Task 5's
 * modules, which would let a row's content come from config instead, do not
 * exist yet). `ContentConfig.rows` (types.ts) types the SAME layout
 * vocabulary as data, ready for that wiring; nothing populates it yet.
 *
 * `row-full`'s own `PageSection` carries `min-w-0`, same as every other
 * kind's slot wrapper below: it is a grid item of `PageBody`'s single-column
 * track, and a non-wrapping child (a segmented tabs row, an unbroken price
 * string) otherwise pins it to its content's min-content width, bleeding
 * past the viewport (X2). (No template-level comment here — a leading HTML
 * comment ahead of this file's v-if/v-else-if chain broke every branch's
 * `wrapper.classes()` resolution in `@vue/test-utils`, not just `full`'s.)
 */
import { PageSection } from "@upmind/ui";
import { computed } from "vue";
import { ROW_LAYOUT, ROW_MEASURE } from "./types";
import {
  ROW_SPLIT_ASIDE_CLASS,
  ROW_SPLIT_ASIDE_WIDE_CLASS,
  ROW_SPLIT_EQUAL_CLASS,
  ROW_TRIPLE_EQUAL_CLASS,
  rowFullMeasureClass
} from "./variants";
import type { PortalRowProps, PortalRowSlots } from "./types";

defineOptions({ name: "PortalRow" });

const props = withDefaults(defineProps<PortalRowProps>(), {
  measure: ROW_MEASURE.PAGE
});

defineSlots<PortalRowSlots>();

type RowMeta =
  | { readonly kind: "full"; readonly class: string }
  | { readonly kind: "split-equal" }
  | { readonly kind: "split-aside"; readonly aside: "left" | "right" }
  | { readonly kind: "triple" };

/** Every combination the board draws, keyed on each row's first slot token (types.ts). */
const STATIC_ROW_META: Readonly<
  Record<
    Exclude<(typeof ROW_LAYOUT)[keyof typeof ROW_LAYOUT], "row-full">,
    RowMeta
  >
> = {
  [ROW_LAYOUT.SPLIT_EQUAL]: { kind: "split-equal" },
  // Two Column Left: wide slot first (left) -> narrow slot sits on the right.
  [ROW_LAYOUT.SPLIT_WIDE_LEFT]: { kind: "split-aside", aside: "right" },
  // Two Column Right: narrow slot first (left) -> narrow slot sits on the left.
  [ROW_LAYOUT.SPLIT_WIDE_RIGHT]: { kind: "split-aside", aside: "left" },
  [ROW_LAYOUT.TRIPLE_EQUAL]: { kind: "triple" }
};

const meta = computed<RowMeta>(() => {
  const layout = props.layout;
  if (layout === ROW_LAYOUT.FULL) {
    return { kind: "full", class: rowFullMeasureClass(props.measure) };
  }
  return STATIC_ROW_META[layout];
});
</script>
