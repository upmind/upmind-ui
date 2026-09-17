<template>
  <ToggleGroup
    type="single"
    size="sm"
    :model-value="active"
    :disabled="disabled"
    :data-attrs="{ 'data-test-key': 'criteria-tabs' }"
    @update:model-value="onSelect"
  >
    <ToggleGroupItem
      v-for="tab in tabs.elements"
      :key="tab.value"
      :value="tab.value"
      data-test-key="criteria-tab"
      :data-test-value="tab.value"
    >
      {{ i18n.translate(tab.i18n, tab.i18n) }}
    </ToggleGroupItem>
  </ToggleGroup>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/CriteriaTabs
 * @description The declared criteria tab pair — the collection's headline
 * narrowing, drawn beside the filter bar and written through the SAME channel:
 * the composable's own merging `setCriteria`. It spells no wire parameter and
 * knows no module's columns; a tab carries the `filters` leaves it writes and
 * nothing else (`C5` · `C10` · `C15`).
 *
 * It owns NO state. Which tab reads as selected is derived from the live
 * criteria model each render, so the control cannot claim a narrowing the wire
 * does not carry, and a criteria write from anywhere else — the url replay, the
 * chips' Clear all, the filter bar — moves it with no second source of truth.
 * With no tab matching (the collection's unnarrowed boot), none is selected,
 * which is the honest reading of "no status filter in effect": the tab pair
 * never writes on its own, so mounting the page issues no request of its own.
 *
 * `setCriteria` merges at BRANCH level, so the whole live `filters` branch is
 * re-sent with the tab's leaves merged on top — writing the leaf alone would
 * silently drop every other filter the hand had set. The same reason
 * `FilterBar` hands back the whole branch.
 *
 * The write is refused through the control's own `disabled` while a scenario
 * drives the collection (`R6-23`), the same mechanism the bar beside it takes.
 */

import { ToggleGroup, ToggleGroupItem } from "@upmind/ui";
import { computed } from "vue";
import { useFormI18n } from "@upmind-automation/client-vue";
import { assign, find, get, isMatch } from "lodash-es";
import type { CriteriaTabsProps } from "./CriteriaTabs.types";
// -----------------------------------------------------------------------------

const props = defineProps<CriteriaTabsProps>();

// Declaration-sourced keys resolve through the ENGINE's translator — the same
// one the mounted filter bar uses, so a tab label and a filter label cannot
// resolve by two different rules.
const i18n = useFormI18n();

/** The live `filters` branch, read off the composable's own model. */
const liveFilters = computed(
  () =>
    get(props.criteria.model.value, "filters", {}) as Record<string, unknown>
);

/**
 * Which tab the LIVE criteria amounts to — never a stored selection. A tab
 * matches when every leaf it declares is present on the model with that value,
 * so the `neq` tab cannot read as selected while the wire carries `eq`.
 */
const active = computed(
  () =>
    find(props.tabs.elements, tab => isMatch(liveFilters.value, tab.filters))
      ?.value
);

function onSelect(next: unknown): void {
  const tab = find(props.tabs.elements, { value: next as string });
  if (!tab) return;
  props.criteria.set({ filters: assign({}, liveFilters.value, tab.filters) });
}
</script>
