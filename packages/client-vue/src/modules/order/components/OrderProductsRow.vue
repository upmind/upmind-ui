<template>
  <tr
    :class="styles.table.row.root"
    :data-last-of-group="!!row.meta.lastOfGroup"
  >
    <td
      :class="styles.table.row.cell"
      :data-emphasis="row.meta.emphasis"
      v-bind="testAttrsItem(row.id)"
    >
      <template v-if="row.meta.indented">↳ </template>{{ row.item }}
    </td>
    <td :class="styles.table.row.cell" v-bind="testAttrsPrice(row.price)">
      {{ row.price }}
    </td>
    <td :class="styles.table.row.cell" v-bind="testAttrsQty(row.qty)">
      {{ row.qty }}
    </td>
    <td
      :class="styles.table.row.cell"
      :data-emphasis="row.meta.emphasis"
      v-bind="testAttrsTotal(row.total)"
    >
      {{ row.total }}
    </td>
  </tr>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useStyles, useTestAttrs } from "@upmind-automation/upmind-ui";
import config from "../order.config";
import type { TableRow } from "../types";

// -----------------------------------------------------------------------------

const props = defineProps<{
  row: TableRow;
  expanded: boolean;
}>();

const meta = computed(() => ({
  muted: props.expanded && !!props.row.meta.detail,
  lastOfGroup: !!props.row.meta.lastOfGroup,
  compact: props.expanded && !!props.row.meta.detail,
  spaced: !!props.row.meta.term || !!props.row.meta.lastBeforeOption,
  dashedTop:
    props.expanded && !!props.row.meta.indented && !props.row.meta.detail
}));

const styles = useStyles(["table.row"], meta, config);

const testAttrsItem = (value?: string) =>
  useTestAttrs({ key: "order-product-item", value });

const testAttrsPrice = (value?: string) =>
  useTestAttrs({ key: "price", value });

const testAttrsQty = (value?: number | string) =>
  useTestAttrs({ key: "qty", value });

const testAttrsTotal = (value?: string) =>
  useTestAttrs({ key: "total", value });
</script>
