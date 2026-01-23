<template>
  <table :class="cn(styles.table.root, props.class)" data-testid="table">
    <thead v-if="columns?.length" :class="styles.table.header">
      <tr :class="styles.table.row">
        <th
          v-for="(column, colIndex) in columns"
          :key="`th-${colIndex}`"
          :class="styles.table.headerCell"
          scope="col"
        >
          {{ column }}
        </th>
      </tr>
    </thead>
    <tbody :class="styles.table.body">
      <tr
        v-for="(row, rowIndex) in rows"
        :key="`tr-${rowIndex}`"
        :class="styles.table.row"
        :data-testid="`table-row-${rowIndex}`"
      >
        <td
          v-for="(cell, cellIndex) in row"
          :key="`td-${rowIndex}-${cellIndex}`"
          :class="styles.table.cell"
        >
          {{ cell }}
        </td>
      </tr>
    </tbody>

    <slot />
  </table>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import config from "./table.config";
import { useStyles, cn } from "../../utils";

// --- types
import type { TableProps } from "./types";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<TableProps>(), {
  uiConfig: () => ({ table: [] }),
  class: ""
});

const meta = computed(() => ({
  //
}));

const styles = useStyles("table", meta, config, props.uiConfig ?? {});
</script>
