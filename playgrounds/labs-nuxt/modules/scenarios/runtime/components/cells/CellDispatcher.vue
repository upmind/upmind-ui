<template>
  <component :is="renderer" v-if="renderer" :element="element" :row="row" />
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/cells/CellDispatcher
 * @description ONE declared cell, drawn by the renderer its own `type` NAMES
 * (`R6-36`): the registry's testers are asked which of them handles this
 * element, the way JSONForms resolves any control, so no surface holds a
 * vocabulary of cell types and adding one is a registry entry rather than a
 * branch.
 *
 * The same cell serves the table, the card and the read-only row list, so a
 * declared renderer cannot mean one thing in a column and another in a card.
 * An element no tester claims draws nothing — the declaration's own union makes
 * that unreachable, and a blank cell is the honest answer to a type nobody
 * registered.
 */

import { computed } from "vue";
import { resolveTableCell } from "./cells.renderers";
import type { TableCellProps } from "./cells.types";
// -----------------------------------------------------------------------------

const props = defineProps<TableCellProps>();

const renderer = computed(() => resolveTableCell(props.element)?.renderer);
</script>
