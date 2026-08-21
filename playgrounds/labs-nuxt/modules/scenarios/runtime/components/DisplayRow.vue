<template>
  <div :class="styles.displayRow.root" data-test-key="display-row">
    <div :class="styles.displayRow.lead">
      <p :class="styles.displayRow.results">
        <span :class="styles.displayRow.resultsLabel">
          {{ t("labs.results") }}
        </span>
        <Separator
          orientation="vertical"
          decorative
          :class="styles.displayRow.divider"
        />
        <span :class="styles.displayRow.count">{{ countLabel }}</span>
      </p>

      <RefinementsRow v-if="criteria" :criteria="criteria" :locked="locked" />
    </div>

    <div :class="styles.displayRow.controls">
      <!-- The ordering control is drawn in BOTH views (G3/E9): the data surface
           owns its ordering, so it is offered where the data is, whether or not
           there happen to be headers to click.

           Each control carries its OWN tooltip rather than the cluster carrying
           one: the tooltip's trigger is a shrink-to-fit span, so wrapping the
           cluster would take its `ml-auto` off the flow and unpin the controls
           from the row's right edge (`R6-23`). -->
      <Tooltip
        v-if="hasSort"
        :label="t('labs.replay_locked')"
        :active="!!locked"
      >
        <SortControl
          :fields="fields"
          :sort="sort"
          :disabled="locked"
          @update:sort="emit('update:sort', $event)"
        />
      </Tooltip>
      <Tooltip
        v-if="hasColumns"
        :label="t('labs.replay_locked')"
        :active="!!locked"
      >
        <ColumnPicker
          :columns="columns ?? []"
          :disabled="locked"
          @update:columns="emit('update:columns', $event)"
        />
      </Tooltip>
      <Tooltip
        v-if="hasCardView"
        :label="t('labs.replay_locked')"
        :active="!!locked"
      >
        <ToggleGroup
          type="single"
          size="sm"
          :model-value="view"
          :items="viewItems"
          :disabled="locked"
          @update:model-value="onView"
        />
      </Tooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/DisplayRow
 * @description What the collection amounts to, what narrowed it to that, and
 * how it is drawn — the Results count and the active-refinement chips on the
 * left, the ordering, the column set and the view choice on the right, all on
 * the data surface's own ONE line (`G3` · `H1` · `R6-16` · `R6-25`). The chips
 * ride here rather than in a row of their own above: what was asked for and
 * what came back read as one statement.
 *
 * It owns no state. The count is read, the sort model and the column set come
 * in and go back out whole, the chips write through the criteria's own merging
 * `set`, and the view is the caller's — so the column headers, these controls
 * and the url can never disagree about the criteria (`P1-R9`).
 *
 * The count is the surface's OWN two numbers: how many rows it is drawing, and
 * the collection's `pagination.total`. Nothing is aggregated and nothing is
 * counted per facet — we hold only the current page, so any other number would
 * be a lie (`S16`/`G13`).
 *
 * Every control here is LOCKED while a scenario drives the collection (`R6-23`)
 * and says why on hover; the count stays live, because a report of what is on
 * screen is exactly what a replay wants read.
 */

import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  Separator,
  ToggleGroup,
  Tooltip,
  useStyles
} from "@upmind-automation/upmind-ui";
import ColumnPicker from "./ColumnPicker.vue";
import config from "./DisplayRow.styles";
import RefinementsRow from "./RefinementsRow.vue";
import SortControl from "./SortControl.vue";
import { ListViewTypes } from "./surfaces/ListSurface.types";
import { isEmpty, isNil } from "lodash-es";
import type { DisplayRowProps } from "./DisplayRow.types";
import type { TableModel } from "@upmind-automation/scenario-harness";
import type { ToggleGroupItem } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const props = defineProps<DisplayRowProps>();

const emit = defineEmits<{
  "update:sort": [sort: TableModel["sort"]];
  "update:columns": [columns: string[]];
  "update:view": [view: ListViewTypes];
}>();

const { t } = useI18n();

const hasSort = computed(() => !isEmpty(props.fields));

const hasColumns = computed(() => !isEmpty(props.columns));

const countLabel = computed(() =>
  isNil(props.total)
    ? t("labs.results_shown", { count: props.count })
    : t("labs.results_showing", { count: props.count, total: props.total })
);

const viewItems = computed<ToggleGroupItem[]>(() => [
  { value: ListViewTypes.TABLE, label: t("text.table_view"), icon: "table" },
  { value: ListViewTypes.CARD, label: t("text.card_view"), icon: "grid-01" }
]);

// Un-clicking the active segment leaves the view where it is: a list is always
// drawn as something.
function onView(next: unknown): void {
  if (next === ListViewTypes.TABLE || next === ListViewTypes.CARD)
    emit("update:view", next);
}

const meta = computed(() => ({
  hasSort: hasSort.value,
  hasColumns: hasColumns.value,
  hasCardView: !!props.hasCardView
}));

const styles = useStyles(["displayRow"], meta, config);
</script>
