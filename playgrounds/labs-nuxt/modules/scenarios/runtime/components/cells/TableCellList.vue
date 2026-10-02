<template>
  <ul :class="cellList.root({ layout })" data-test-key="cell-list">
    <li
      v-for="(item, index) in items"
      :key="itemKey(item, index)"
      :class="cellList.item({ layout })"
      data-test-key="cell-list-item"
    >
      <span
        v-for="element in props.element.options.elements"
        :key="element.scope"
        :class="cellList.part()"
      >
        <component
          :is="resolveTableCell(element)?.renderer"
          :element="element"
          :row="item"
        />
      </span>
    </li>
  </ul>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------

import { uiTypeIs } from "@jsonforms/core";
import { computed } from "vue";
import { resolveScope } from "../../scenario.utils";
import { resolveTableCell } from "./cells.renderers";
import { cellList } from "./cells.styles";
import { get, isArray, toString } from "lodash-es";
import type { TableCellProps } from "./cells.types";
import type { TableCellList } from "../../scenario.types";
import type { ListRow } from "../surfaces/ListSurface.types";
// -----------------------------------------------------------------------------

const props = defineProps<TableCellProps<TableCellList>>();

const layout = computed(() => props.element.options.layout);

const items = computed<ListRow[]>(() => {
  const value = resolveScope(props.row, props.element.scope);
  return isArray(value) ? (value as ListRow[]) : [];
});

// An item's own id where it has one; its position otherwise — a feed entry is
// `{ kind, message }` and carries no id of its own.
function itemKey(item: ListRow, index: number): string {
  return toString(get(item, "id") ?? index);
}
</script>

<script lang="ts">
export const tester = { rank: 1, controlType: uiTypeIs("TableCellList") };
</script>
