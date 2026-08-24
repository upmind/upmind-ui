<template>
  <DropdownMenuRoot v-model:open="isOpen">
    <DropdownMenuTrigger as-child>
      <ButtonItems
        size="sm"
        variant="outline"
        icon="columns-03"
        icon-only
        :label="t('labs.columns')"
        :aria-expanded="isOpen"
        :disabled="disabled"
        :data-attrs="{ 'data-test-key': 'columns' }"
      />
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end" :class="columnPicker.content()">
      <DropdownMenuLabel>{{ t("labs.columns") }}</DropdownMenuLabel>
      <!-- `select` is prevented so the menu stays open: picking a column set is
           several choices, and a menu that closes on each one makes the user
           re-open it per column. -->
      <DropdownMenuCheckboxItem
        v-for="column in columns"
        :key="column.value"
        data-test-key="column"
        :data-test-value="column.value"
        :model-value="column.isVisible"
        :disabled="column.isVisible && isLastVisible"
        @select="handleSelect(column, $event)"
      >
        {{ column.label }}
      </DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenuRoot>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ColumnPicker
 * @description Which of the table's declared columns are drawn (`R6-25`) — one
 * checkable entry per Control the table uischema declares (`R6-35`), so the
 * declaration is both the option list and the default set and nothing here
 * knows a module's fields.
 *
 * It owns no state: the live set comes in on `columns` and every change goes
 * back out WHOLE, in declaration order, so the url and the header row can never
 * disagree about what is drawn. The last visible column cannot be taken off —
 * a table with no columns is not a table, and the url has no way to say "none"
 * that is distinguishable from "unset".
 */

import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRoot,
  DropdownMenuTrigger
} from "@upmind/ui";
import ButtonItems from "./ButtonItems.vue";
import { columnPicker } from "./ColumnPicker.styles";
import { filter, map, size } from "lodash-es";
import type { ColumnOption, ColumnPickerProps } from "./ColumnPicker.types";
// -----------------------------------------------------------------------------

const props = defineProps<ColumnPickerProps>();

const emit = defineEmits<{ "update:columns": [columns: string[]] }>();

const { t } = useI18n();

const isOpen = ref(false);

const isLastVisible = computed(
  () => size(filter(props.columns, "isVisible")) === 1
);

function handleSelect(column: ColumnOption, event: Event): void {
  event.preventDefault();
  if (column.isVisible && isLastVisible.value) return;
  toggle(column);
}

function toggle(toggled: ColumnOption): void {
  emit(
    "update:columns",
    map(
      filter(props.columns, column =>
        column.value === toggled.value ? !column.isVisible : column.isVisible
      ),
      "value"
    )
  );
}
</script>
