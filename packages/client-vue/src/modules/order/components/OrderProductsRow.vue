<template>
  <tr :class="rowRootClass" :data-last-of-group="!!row.meta.lastOfGroup">
    <td
      :class="rowCellClass"
      :data-emphasis="row.meta.emphasis"
      v-bind="testAttrsItem(row.id)"
    >
      <template v-if="row.meta.indented">↳ </template>{{ row.item }}
    </td>
    <td :class="rowCellClass" v-bind="testAttrsPrice(row.price)">
      {{ row.price }}
    </td>
    <td :class="rowCellClass" v-bind="testAttrsQty(row.qty)">
      {{ row.qty }}
    </td>
    <td
      :class="rowCellClass"
      :data-emphasis="row.meta.emphasis"
      v-bind="testAttrsTotal(row.total)"
    >
      {{ row.total }}
    </td>
  </tr>
</template>

<script lang="ts" setup>
import { cn, useTestAttrs } from "@upmind/ui";
import { computed } from "vue";
import { tableRowRootVariants, tableRowCellVariants } from "../variants";
import type { TableRow } from "../types";

// -----------------------------------------------------------------------------

const props = defineProps<{
  row: TableRow;
  expanded: boolean;
}>();

const rowRootClass = computed(() =>
  tableRowRootVariants({
    muted: props.expanded && !!props.row.meta.detail,
    lastOfGroup: !!props.row.meta.lastOfGroup
  })
);

// cn() resolves the base padding against the variants' — plain cva emits both
// and lets stylesheet order decide, which flips `compact` back to the base.
const rowCellClass = computed(() =>
  cn(
    tableRowCellVariants({
      compact: props.expanded && !!props.row.meta.detail,
      spaced: !!props.row.meta.term || !!props.row.meta.lastBeforeOption,
      dashedTop:
        props.expanded && !!props.row.meta.indented && !props.row.meta.detail
    })
  )
);

// row-level test hooks the template binds: the item keys off the row id, the
// total off its formatted amount.
const testAttrsItem = (value?: string | number) =>
  useTestAttrs({ key: "order-product-item", value });
const testAttrsPrice = (value?: string | number) =>
  useTestAttrs({ key: "price", value });
const testAttrsQty = (value?: string | number) =>
  useTestAttrs({ key: "qty", value });
const testAttrsTotal = (value?: string | number) =>
  useTestAttrs({ key: "total", value });
</script>
