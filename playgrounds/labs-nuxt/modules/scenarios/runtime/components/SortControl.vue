<template>
  <div class="flex items-center gap-0.5" data-test-key="sort">
    <Button
      size="sm"
      variant="outline"
      icon-only
      :disabled="!active || !!props.disabled"
      :aria-label="i18n.translate(directionKey, directionKey)"
      :data-attrs="{
        'data-test-value': isAscending ? 'sort-ascending' : 'sort-descending'
      }"
      @click="
        write(
          active?.field,
          isAscending ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC
        )
      "
    >
      <Icon
        :icon="isAscending ? 'arrow-up' : 'arrow-down'"
        size="nano"
        aria-hidden="true"
      />
    </Button>
    <Select
      size="sm"
      :model-value="active?.field"
      :items="props.fields"
      :disabled="props.disabled"
      :placeholder="sortLabel"
      :class="sortControl.field()"
      :data-attrs="{ 'data-test-key': 'sort-field' }"
      @update:model-value="
        field => write(field ? String(field) : undefined, direction)
      "
    />
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/SortControl
 * @description The display row's sort control — the SAME sort the table headers
 * write, offered in BOTH views (`G3`/`E9`): ordering belongs to the data
 * surface, so the control sits with the data in table view too, beside the view
 * toggle, and is not withheld until the headers happen to be gone. It owns no
 * state: the live sort model comes in and every change goes back out whole, so
 * both affordances funnel through the surface's one emit and can never disagree
 * (`P1-R9`).
 *
 * Drawn the way the house draws a sort control (`client-vue`'s `ProductSort` /
 * `EmailHistorySort`): ONE group carrying the direction toggle and the field
 * `Select`. Both of those are bound to their own module's hardcoded
 * sortable-property enum, so the treatment is adopted and the fields stay the
 * caller's declaration. It is drawn at the row's scale — one tight group at the
 * density of the view toggle beside it, never a control that sets the row's
 * height (`R6-1`).
 *
 * The direction toggle is the ONLY way to reverse ordering in card view, where
 * there are no headers to click — deleting it strands the booted default there.
 *
 * The direction vocabulary is the harness's `SORT_DIRECTION`, not headless's
 * same-named enum: everything this control reads and writes is the channel's
 * `TableModel`, whose `dir` is structural by design so it stays assignable
 * across the seam. Headless's is NOMINAL — mixing the two here would only be
 * reconcilable with a cast.
 *
 * The group root owns `data-test-key="sort"`; the `Select`'s own `useTestAttrs`
 * spreads last, so a fallthrough key on it renders as `select-trigger`.
 */

import { Button, Select } from "@upmind/ui";
import { computed } from "vue";
import { Icon, useFormI18n } from "@upmind-automation/client-vue";
import { SORT_DIRECTION } from "@upmind-automation/scenario-harness";
import { sortControl } from "./SortControl.styles";
import { find, first } from "lodash-es";
import type { SortControlProps } from "./SortControl.types";
import type {
  SortDirection,
  TableModel
} from "@upmind-automation/scenario-harness";
// -----------------------------------------------------------------------------

const props = defineProps<SortControlProps>();

const emit = defineEmits<{ "update:sort": [sort: TableModel["sort"]] }>();

const i18n = useFormI18n();

// The PRIMARY key is what the control steers: a multi-key boot order (the
// module's own declared default) shows its leading field, and the user's pick
// replaces the whole model with the single entry they chose.
const active = computed(() => first(props.sort));

const direction = computed(() => active.value?.dir ?? SORT_DIRECTION.ASC);

const isAscending = computed(() => direction.value === SORT_DIRECTION.ASC);

const directionKey = computed(() =>
  isAscending.value ? "action.sort_ascending" : "action.sort_descending"
);

const selected = computed(() =>
  find(props.fields, { value: active.value?.field })
);

const sortLabel = computed(
  () => selected.value?.label ?? i18n.value.translate("text.sort_by", "Sort by")
);

/** Every pick writes the WHOLE model: one field, one direction. */
function write(field: string | undefined, dir: SortDirection): void {
  if (!field) return;
  emit("update:sort", [{ field, dir }]);
}
</script>
