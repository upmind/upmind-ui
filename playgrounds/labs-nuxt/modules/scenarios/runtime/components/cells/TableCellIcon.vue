<template>
  <Icon
    size="nano"
    :icon="element.options.icon"
    :variant="isFlagged ? 'Solid' : 'Line'"
    :class="cellIcon({ isFlagged })"
  />
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/cells/TableCellIcon
 * @description A boolean drawn as ONE glyph on every row — filled where the
 * flag is set, outlined where it is not (`R6-34`). Which pack each state draws
 * from is this renderer's treatment; the declaration names the glyph and the
 * field, and nothing else.
 */

import { uiTypeIs } from "@jsonforms/core";
import { computed } from "vue";
import { Icon } from "@upmind-automation/client-vue";
import { resolveScope } from "../../scenario.utils";
import { cellIcon } from "./cells.styles";
import { CellSizingTypes } from "./cells.types";
import type { TableCellProps } from "./cells.types";
import type { TableCellIcon } from "../../scenario.types";
// -----------------------------------------------------------------------------

const props = defineProps<TableCellProps<TableCellIcon>>();

const isFlagged = computed(
  () => !!resolveScope(props.row, props.element.scope)
);
</script>

<script lang="ts">
export const tester = { rank: 1, controlType: uiTypeIs("TableCellIcon") };

/**
 * One glyph is one glyph wide (`R7-2`): the column measures to it, and the text
 * columns take what is left. A boolean given an equal share of the row is how a
 * star ends up as wide as an email address.
 */
export const sizing = CellSizingTypes.CONTENT;
</script>
