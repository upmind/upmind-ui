<template>
  <ul :class="cellList.root()" data-test-key="cell-list">
    <li
      v-for="(item, index) in items"
      :key="itemKey(item, index)"
      :class="cellList.item()"
      data-test-key="cell-list-item"
    >
      <component
        :is="resolveTableCell(element)?.renderer"
        v-for="element in props.element.options.elements"
        :key="element.scope"
        :element="element"
        :row="item"
      />
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
