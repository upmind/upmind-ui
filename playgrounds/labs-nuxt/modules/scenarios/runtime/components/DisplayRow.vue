<template>
  <div :class="displayRow.root()" data-test-key="display-row">
    <Text
      as="span"
      variant="faint"
      size="xs"
      class="inline-flex items-center gap-2 tracking-wider whitespace-nowrap uppercase"
    >
      {{ t("labs.results") }}
      <Separator
        orientation="vertical"
        decorative
        :class="displayRow.divider()"
      />
      {{ countLabel }}
    </Text>

    <!-- Operator ruling: the refinements read on the RESULTS line — the count
         and what narrowed it belong to the same sentence. -->
    <RefinementsRow v-if="criteria" :criteria="criteria" :locked="locked" />

    <div :class="displayRow.controls()">
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
          :disabled="locked"
          @update:model-value="onView"
        >
          <ToggleGroupItem
            v-for="item in viewItems"
            :key="item.value"
            :value="item.value"
            data-test-key="toggle-group-item"
            :data-test-value="item.value"
          >
            {{ item.label }}
          </ToggleGroupItem>
        </ToggleGroup>
      </Tooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/DisplayRow
 * @description Results label, sort, column set, view toggle — exactly R6
 * (`G3`, `H1`). Column visibility (`R6-25`) is steered here and nowhere else:
 * the table draws what the url names, so dropping the picker strands the set.
 */

import {
  Separator,
  Text,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip
} from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import ColumnPicker from "./ColumnPicker.vue";
import { displayRow } from "./DisplayRow.styles";
import RefinementsRow from "./RefinementsRow.vue";
import SortControl from "./SortControl.vue";
import { ListViewTypes } from "./surfaces/ListSurface.types";
import { isEmpty, isNil } from "lodash-es";
import type { DisplayRowProps, ToggleGroupOption } from "./DisplayRow.types";
import type { TableModel } from "@upmind-automation/scenario-harness";
// -----------------------------------------------------------------------------

const props = defineProps<DisplayRowProps>();

const emit = defineEmits<{
  "update:columns": [columns: string[]];
  "update:sort": [sort: TableModel["sort"]];
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

const viewItems = computed<ToggleGroupOption[]>(() => [
  { value: ListViewTypes.TABLE, label: t("text.table_view") },
  { value: ListViewTypes.CARD, label: t("text.card_view") }
]);

function onView(next: unknown): void {
  if (next === ListViewTypes.TABLE || next === ListViewTypes.CARD)
    emit("update:view", next);
}
</script>
