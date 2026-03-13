<template>
  <tr
    :class="styles.table.row.root"
    :data-last-of-group="!!row.meta.lastOfGroup"
  >
    <td
      :class="styles.table.row.cell"
      :data-emphasis="row.meta.emphasis"
      :data-testid="`item-${kebabCase(row.item)}`"
    >
      <template v-if="row.meta.indented">↳ </template>{{ row.item }}
    </td>
    <td :class="styles.table.row.cell" data-testid="price">{{ row.price }}</td>
    <td :class="styles.table.row.cell" data-testid="qty">{{ row.qty }}</td>
    <td
      :class="styles.table.row.cell"
      :data-emphasis="row.meta.emphasis"
      data-testid="total"
    >
      {{ row.total }}
    </td>
  </tr>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { kebabCase } from "lodash-es";

// --- internal
import config from "../order.config";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- types
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
</script>
